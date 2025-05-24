"use client";

import { useState, useEffect, useCallback } from "react";
import { auth } from "@/lib/firebase";
import {
  Loader2,
  Upload,
  File,
  Trash2,
  Info,
  RefreshCw,
} from "lucide-react";

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

const DIFY_API_URL =
  process.env.DIFY_API_URL || "https://api.dify.ai/v1";
const DIFY_API_KEY = process.env.NEXT_PUBLIC_DIFY_KNOWLEDGE_BASE_API_KEY || "";
const DIFY_DATASET_ID = process.env.NEXT_PUBLIC_DIFY_DATASET_ID || "";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [knowledgeBaseStatus, setKnowledgeBaseStatus] = useState<string | null>(
    null
  );
  const [refreshing, setRefreshing] = useState(false);

  const areDocumentsProcessing = useCallback(() => {
    return documents.some(
      (doc) =>
        doc.indexing_status === "indexing" ||
        doc.indexing_status === "waiting" ||
        doc.display_status === "queuing"
    );
  }, [documents]);

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
      setKnowledgeBaseStatus("Connected to Knowledge Base");
    } catch (error: unknown) {
      console.error("Error loading documents:", error);
      if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
        const typedError = error as {code: string, message: string};
        setError(`Dify API error (${typedError.code}): ${typedError.message}`);
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

  useEffect(() => {
    if (!areDocumentsProcessing()) return;

    const interval = setInterval(async () => {
      const processingDocs = documents.filter(
        (doc) =>
          doc.indexing_status === "indexing" ||
          doc.indexing_status === "waiting" ||
          doc.display_status === "queuing"
      );

      if (processingDocs.length === 0) {
        clearInterval(interval);
        return;
      }

      await loadDocuments();
    }, 10000);

    return () => clearInterval(interval);
  }, [documents, areDocumentsProcessing]);

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

      const currentUser = auth.currentUser;
      if (!currentUser) {
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
              throw new Error(
                "File type not allowed. Supported formats: PDF, DOCX, TXT, MD, HTML, CSV, etc."
              );
            default:
              throw new Error(
                `Upload failed: ${errorData.message || errorData.code}`
              );
          }
        }

        throw new Error(
          `Upload failed: ${errorData.message || response.statusText}`
        );
      }

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

      setSuccess("Document uploaded successfully to knowledge base!");
      e.target.value = "";
    } catch (error: unknown) {
      console.error("Error uploading document:", error);
      setError(
        error instanceof Error ? error.message : "Failed to upload document"
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
                  throw new Error(
                    "The document is still being processed and cannot be deleted at this time"
                  );
                default:
                  throw new Error(
                    `Failed to delete document: ${
                      errorData.message || errorData.code
                    }`
                  );
              }
            }
            throw new Error(
              `Failed to delete document: ${
                errorData.message || response.statusText
              }`
            );
          } catch {
            throw new Error(
              `Failed to delete document: ${response.statusText}`
            );
          }
        }
      }

      setDocuments(documents.filter((doc) => doc.id !== id));
      setSuccess("Document deleted successfully from knowledge base");
    } catch (error: unknown) {
      console.error("Error deleting document:", error);
      setError(error instanceof Error ? error.message : "Failed to delete document");
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

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Knowledge Base Documents
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage documents for your AI knowledge base
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold">Knowledge Base</h2>
              {knowledgeBaseStatus && (
                <p className="text-sm text-gray-500 mt-1 flex items-center flex-wrap">
                  <Info className="h-3.5 w-3.5 mr-1 text-green-600 flex-shrink-0" />
                  <span>{knowledgeBaseStatus}</span>
                  {areDocumentsProcessing() && (
                    <span className="ml-2 text-amber-600 flex items-center">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin flex-shrink-0" />
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
                  className={`bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-md flex items-center gap-2 whitespace-nowrap ${
                    uploading ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                  disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                      <span className="sm:inline hidden">
                        Uploading to Knowledge Base...
                      </span>
                      <span className="sm:hidden">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 flex-shrink-0" />
                      <span className="sm:inline hidden">Upload Document</span>
                      <span className="sm:hidden">Upload</span>
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
                    Upload your first document to enhance your AI&apos;s knowledge
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {/* Mobile card view for small screens */}
                  <div className="sm:hidden space-y-4 p-4">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center">
                            <File className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                            <h3 className="font-medium text-gray-900 text-sm line-clamp-1">
                              {doc.name}
                            </h3>
                          </div>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-50 flex-shrink-0">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-gray-500 mb-1">Status</p>
                            {getStatusLabel(doc)}
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">Source</p>
                            <p className="text-gray-700">
                              {doc.data_source_type === "upload_file"
                                ? "Uploaded File"
                                : doc.data_source_type || "Unknown"}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-gray-500 mb-1">Uploaded</p>
                            <p className="text-gray-700">
                              {formatDate(doc.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop table for larger screens */}
                  <table className="min-w-full divide-y divide-gray-200 hidden sm:table">
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
                              <File className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                              <div className="truncate max-w-[200px] md:max-w-[300px] lg:max-w-none">
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
              About Knowledge Base
            </h3>
            <p>
              Documents uploaded here are sent to the knowledge base for
              retrieval augmented generation (RAG). This enhances your AI
              chatbot&apos;s ability to answer questions based on your specific
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
