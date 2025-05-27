"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Eye,
  MessageSquare,
  RefreshCcw,
  SearchIcon,
} from "lucide-react";
import type {
  Conversation as ConversationBaseType,
  EmbeddedMessage,
} from "@/types/chat";
import {
  getAllConversations,
  getConversationWithMessages,
} from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";

interface AdminConversationSummary
  extends Omit<ConversationBaseType, "messages" | "createdAt" | "updatedAt"> {
  createdAt: string;
  updatedAt: string;
}

type FullConversation = ConversationBaseType;

const formatDate = (dateInput: Date | string | undefined): string => {
  if (!dateInput) return "-";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "Invalid Date";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function AdminConversationsPage() {
  const [conversations, setConversations] = useState<
    AdminConversationSummary[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string>("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [selectedConversation, setSelectedConversation] =
    useState<FullConversation | null>(null);
  const [viewMessagesDialogOpen, setViewMessagesDialogOpen] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);

  const fetchConversationsList = async () => {
    setLoading(true);
    try {
      const convosData = await getAllConversations(1000);
      setConversations(
        convosData.map((c) => ({
          id: c.id,
          user_id: c.user_id,
          user_email: c.user_email,
          difyConversationId: c.difyConversationId,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        }))
      );
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast({
        title: "Error Loading Conversations",
        description:
          (error as Error).message || "Could not fetch conversations.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConversationsList();
  }, []);

  const handleViewMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    setViewMessagesDialogOpen(true);
    setSelectedConversation(null);
    try {
      const fullConvo = await getConversationWithMessages(conversationId);
      setSelectedConversation(fullConvo);
    } catch (error) {
      console.error("Error fetching conversation messages:", error);
      toast({
        title: "Error Fetching Messages",
        description: "Could not load messages for this conversation.",
        variant: "destructive",
      });
      setViewMessagesDialogOpen(false);
    }
    setLoadingMessages(false);
  };

  const filteredAndSortedConversations = useMemo(() => {
    return conversations
      .filter(
        (convo) =>
          convo.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          convo.user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          convo.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        let aValue: string | number | undefined =
          a[sortField as keyof AdminConversationSummary];
        let bValue: string | number | undefined =
          b[sortField as keyof AdminConversationSummary];

        if (sortField === "createdAt" || sortField === "updatedAt") {
          aValue = aValue ? new Date(aValue as string).getTime() : 0;
          bValue = bValue ? new Date(bValue as string).getTime() : 0;
        }

        const strA =
          typeof aValue === "string"
            ? aValue
            : aValue === undefined
            ? ""
            : String(aValue);
        const strB =
          typeof bValue === "string"
            ? bValue
            : bValue === undefined
            ? ""
            : String(bValue);

        if (typeof aValue === "number" && typeof bValue === "number") {
          if (sortDirection === "asc") {
            return aValue - bValue;
          } else {
            return bValue - aValue;
          }
        }

        if (sortDirection === "asc") {
          return strA.localeCompare(strB);
        } else {
          return strB.localeCompare(strA);
        }
      });
  }, [conversations, searchTerm, sortField, sortDirection]);

  const totalPages = Math.ceil(
    filteredAndSortedConversations.length / pageSize
  );
  const paginatedConversations = filteredAndSortedConversations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-accent mb-4" />
        <p className="text-lg">Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-accent">Bot Conversations</h1>
          <p className="text-gray-600">
            Browse and review user interactions with the chatbot.
          </p>
        </div>
        <Button
          onClick={fetchConversationsList}
          variant="outline"
          size="icon"
          className="hover:bg-accent/10 flex-shrink-0"
          disabled={loading}>
          <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search by User Email, User ID, or Conversation ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10"
          />
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => toggleSort("user_email")}>
                  User Email{" "}
                  <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50" />
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => toggleSort("updatedAt")}>
                  Last Updated{" "}
                  <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50" />
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => toggleSort("createdAt")}>
                  Created At{" "}
                  <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50" />
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && conversations.length > 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-accent mx-auto mb-2" />
                    Refreshing data...
                  </TableCell>
                </TableRow>
              )}
              {!loading && paginatedConversations.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-10 text-gray-500">
                    No conversations found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                paginatedConversations.map((convo) => (
                  <TableRow key={convo.id}>
                    <TableCell className="font-medium">
                      {convo.user_email || "N/A"}
                    </TableCell>
                    <TableCell>{formatDate(convo.updatedAt)}</TableCell>
                    <TableCell>{formatDate(convo.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewMessages(convo.id)}
                        className="hover:bg-accent/10">
                        <Eye className="h-4 w-4 mr-1.5" /> View Messages
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages} (Total:{" "}
            {filteredAndSortedConversations.length} conversations)
          </span>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <Dialog
        open={viewMessagesDialogOpen}
        onOpenChange={setViewMessagesDialogOpen}>
        <DialogContent className="max-w-2xl w-[90vw] bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-accent" />{" "}
              Conversation Details
            </DialogTitle>
            {selectedConversation && (
              <DialogDescription>
                Chat with {selectedConversation.user_email || "Unknown User"}{" "}
                (ID: {selectedConversation.id})
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="py-4 max-h-[70vh]">
            {loadingMessages ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-accent mb-4" />
                <p>Loading messages...</p>
              </div>
            ) : selectedConversation && selectedConversation.messages ? (
              <ScrollArea className="h-[calc(70vh-100px)] pr-4">
                <div className="space-y-4">
                  {selectedConversation.messages.map(
                    (msg: EmbeddedMessage, index: number) => (
                      <div
                        key={msg.id || index}
                        className={`flex flex-col p-3 rounded-lg shadow-sm max-w-[85%] ${
                          msg.role === "user"
                            ? "bg-blue-50 self-end ml-auto"
                            : "bg-gray-100 self-start mr-auto"
                        }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-xs font-semibold ${
                              msg.role === "user"
                                ? "text-blue-700"
                                : "text-gray-700"
                            }`}>
                            {msg.role === "user"
                              ? selectedConversation.user_email || "User"
                              : "Bot"}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDate(msg.date?.toString())}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                          {msg.message}
                        </p>
                        {msg.attachedFiles && msg.attachedFiles.length > 0 && (
                          <div className="mt-2 border-t pt-2">
                            <p className="text-xs text-gray-500 mb-1">
                              Attached Files:
                            </p>
                            {msg.attachedFiles.map(
                              (
                                file: { name: string; size: number },
                                fileIndex: number
                              ) => (
                                <Badge
                                  key={file.name + fileIndex}
                                  variant="secondary"
                                  className="mr-1 mb-1 text-xs">
                                  {file.name} ({(file.size / 1024).toFixed(1)}{" "}
                                  KB)
                                </Badge>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-center text-gray-500 py-10">
                No messages to display or an error occurred.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewMessagesDialogOpen(false)}
              className="hover:bg-gray-100">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
