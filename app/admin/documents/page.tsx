"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  Loader2,
  ArrowLeft,
  Upload,
  File,
  Trash2,
  Eye,
  ExternalLink,
  Info,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tooltip } from "@/components/ui/tooltip";

type Document = {
  id: string;
  name: string;
  url?: string;
  created_at: string;
  size?: number;
  type?: string;
  display_status: string;
  indexing_status?: string;
  position?: number;
  data_source_type?: string;
};

// Environment variables
const DIFY_API_URL = process.env.NEXT_PUBLIC_DIFY_API_URL || "https://api.dify.ai/v1";
const DIFY_API_KEY = process.env.NEXT_PUBLIC_DIFY_KNOWLEDGE_BASE_API_KEY || "";
const DIFY_DATASET_ID = process.env.NEXT_PUBLIC_DIFY_DATASET_ID || "";

// TEMPORARY TESTING ONLY - remove after fixing environment variables
// Uncomment these lines if environment variables still aren't working
// const DIFY_API_URL = "https://api.dify.ai/v1";
// const DIFY_API_KEY = "your-api-key-here";  // Replace with your actual API key
// const DIFY_DATASET_ID = "your-dataset-id-here";  // Replace with your actual dataset ID

export default function DocumentsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [knowledgeBaseStatus, setKnowledgeBaseStatus] = useState<string | null>(
    null
  );
  const [refreshing, setRefreshing] = useState(false);

  // Debug environment variables
  useEffect(() => {
    console.log("Checking env variables:");
    console.log("DIFY_API_URL:", process.env.NEXT_PUBLIC_DIFY_API_URL);
    console.log("DIFY_API_KEY exists:", !!process.env.NEXT_PUBLIC_DIFY_KNOWLEDGE_BASE_API_KEY);
    console.log("DIFY_DATASET_ID exists:", !!process.env.NEXT_PUBLIC_DIFY_DATASET_ID);
  }, []);

  const loadDocuments = async () => {
    try {
      if (!DIFY_API_KEY || !DIFY_DATASET_ID) {
        setError(
          "Dify API configuration is missing. Please check environment variables. Required: DIFY_KNOWLEDGE_BASE_API_KEY and DIFY_DATASET_ID"
        );
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/documents?page=1&limit=100`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${DIFY_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error fetching documents:", errorData);
        throw new Error(
          `Failed to load documents: ${
            errorData.message || response.statusText
          }`
        );
      }

      const data = await response.json();
      setDocuments(data.data || []);
      setKnowledgeBaseStatus("Connected to Dify Knowledge Base");
    } catch (error: any) {
      console.error("Error loading documents:", error);
      if (error.code) {
        setError(`Dify API error (${error.code}): ${error.message}`);
      } else {
        setError(
          error instanceof Error ? error.message : "Failed to load documents"
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  // Periodically check status of indexing documents
  useEffect(() => {
    // If no documents are in processing state, don't set up the interval
    if (!areDocumentsProcessing()) return;
    
    // Set up interval to check processing documents
    const interval = setInterval(async () => {
      // Get all documents that are in processing state
      const processingDocs = documents.filter(doc => 
        doc.indexing_status === 'indexing' || 
        doc.indexing_status === 'waiting' || 
        doc.display_status === 'queuing'
      );
      
      // If there are no processing documents, clear the interval
      if (processingDocs.length === 0) {
        clearInterval(interval);
        return;
      }
      
      // Refresh the document list to check their status
      await loadDocuments();
    }, 10000); // Check every 10 seconds
    
    // Clean up the interval when component unmounts
    return () => clearInterval(interval);
  }, [documents]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDocuments();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!DIFY_API_KEY || !DIFY_DATASET_ID) {
        throw new Error(
          "Dify API configuration is missing. Required: DIFY_KNOWLEDGE_BASE_API_KEY and DIFY_DATASET_ID"
        );
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("You must be logged in to upload documents");
      }

      const formData = new FormData();
      formData.append("file", file);

      const data = {
        indexing_technique: "high_quality",
        process_rule: {
          mode: "automatic",
        },
      };

      formData.append("data", JSON.stringify(data));

      const response = await fetch(
        `${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/document/create-by-file`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${DIFY_API_KEY}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Upload error details:", errorData);
        
        if (errorData.code) {
          switch (errorData.code) {
            case "no_file_uploaded":
              throw new Error("Please upload a file");
            case "too_many_files":
              throw new Error("Only one file is allowed");
            case "file_too_large":
              throw new Error("File size exceeded the limit");
            case "unsupported_file_type":
              throw new Error("File type not allowed. Supported formats: PDF, DOCX, TXT, MD, HTML, CSV, etc.");
            default:
              throw new Error(`Upload failed: ${errorData.message || errorData.code}`);
          }
        }
        
        throw new Error(`Upload failed: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();

      const refreshResponse = await fetch(
        `${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/documents?page=1&limit=100`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${DIFY_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!refreshResponse.ok) {
        throw new Error("Failed to refresh document list");
      }

      const refreshedData = await refreshResponse.json();
      setDocuments(refreshedData.data || []);

      setSuccess("Document uploaded successfully to Dify knowledge base!");
      e.target.value = "";
    } catch (error: any) {
      console.error("Error uploading document:", error);
      setError(
        error.message || error.toString() || "Failed to upload document"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this document from the knowledge base?"
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!DIFY_API_KEY || !DIFY_DATASET_ID) {
        throw new Error(
          "Dify API configuration is missing. Required: DIFY_KNOWLEDGE_BASE_API_KEY and DIFY_DATASET_ID"
        );
      }

      const response = await fetch(
        `${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/documents/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${DIFY_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status !== 204) {
          try {
            const errorData = await response.json();
            if (errorData.code) {
              switch (errorData.code) {
                case "archived_document_immutable":
                  throw new Error("Cannot delete an archived document");
                case "document_indexing":
                  throw new Error("The document is still being processed and cannot be deleted at this time");
                default:
                  throw new Error(`Failed to delete document: ${errorData.message || errorData.code}`);
              }
            }
            throw new Error(`Failed to delete document: ${errorData.message || response.statusText}`);
          } catch (parseError) {
            throw new Error(`Failed to delete document: ${response.statusText}`);
          }
        }
      }

      setDocuments(documents.filter((doc) => doc.id !== id));
      setSuccess("Document deleted successfully from knowledge base");
    } catch (error: any) {
      console.error("Error deleting document:", error);
      setError(error.message || "Failed to delete document");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(
      typeof dateString === "number" ? dateString * 1000 : dateString
    ).toLocaleString();
  };

  const getStatusLabel = (document: Document) => {
    const status = document.indexing_status || document.display_status;

    switch (status) {
      case "completed":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            Completed
          </span>
        );
      case "indexing":
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            Indexing
          </span>
        );
      case "waiting":
      case "queuing":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
            Queuing
          </span>
        );
      case "error":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
            Error
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
            {status}
          </span>
        );
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const areDocumentsProcessing = () => {
    return documents.some(doc => 
      doc.indexing_status === 'indexing' || 
      doc.indexing_status === 'waiting' || 
      doc.display_status === 'queuing'
    );
  };

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Base Documents</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage documents for your AI knowledge base
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold">Dify Knowledge Base</h2>
              {knowledgeBaseStatus && (
                <p className="text-sm text-gray-500 mt-1 flex items-center">
                  <Info className="h-3.5 w-3.5 mr-1 text-green-600" />
                  {knowledgeBaseStatus}
                  {areDocumentsProcessing() && (
                    <span className="ml-2 text-amber-600 flex items-center">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Documents processing
                    </span>
                  )}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                className={`p-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-accent transition-colors ${
                  refreshing ? "opacity-50 pointer-events-none" : ""
                }`}
                disabled={refreshing}
                title="Refresh document status">
                <RefreshCw
                  className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>

              <div className="relative">
                <input
                  type="file"
                  id="fileInput"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".txt,.md,.markdown,.pdf,.doc,.docx,.csv,.html,.ppt,.pptx,.xls,.xlsx"
                />
                <button
                  className={`bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-md flex items-center gap-2 ${
                    uploading ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                  disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading to Knowledge Base...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload Document
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 p-3 rounded-md mb-4 text-sm">
              {success}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border border-gray-200">
              {documents.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <File className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No documents in knowledge base yet</p>
                  <p className="text-sm mt-1">
                    Upload your first document to enhance your AI's knowledge
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Document
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Source
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Uploaded
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {documents.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <File className="h-5 w-5 text-gray-400 mr-3" />
                              <div>
                                <div className="text-sm font-medium text-gray-900 mb-1">
                                  {doc.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {doc.data_source_type === "upload_file"
                                ? "Uploaded File"
                                : doc.data_source_type || "Unknown"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusLabel(doc)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {formatDate(doc.created_at)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                                title="Delete document">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 text-sm text-gray-500 bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium text-gray-700 mb-2">
              About Dify Knowledge Base
            </h3>
            <p>
              Documents uploaded here are sent to Dify's knowledge base for
              retrieval augmented generation (RAG). This enhances your AI
              chatbot's ability to answer questions based on your specific
              documents.
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Supported formats: PDF, DOCX, TXT, MD, HTML, CSV, etc.</li>
              <li>For large documents, processing may take some time</li>
              <li>
                The knowledge base helps your AI provide more accurate and
                relevant responses
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
