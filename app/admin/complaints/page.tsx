"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  User,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Trash2,
  AlertCircle,
} from "lucide-react";
import {
  getAllComplaints,
  updateComplaintStatus,
  deleteComplaint,
  ComplaintStatus,
  ComplaintPriority,
} from "@/functions/complaintUtils";
import { Complaint as ComplaintBaseType } from "@/functions/complaintUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

type ExtendedComplaint = ComplaintBaseType & {
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  assigned_profiles?: {
    first_name: string;
    last_name: string;
  } | null;
  location?: string;
  image_urls?: string[];
};

export default function ComplaintsAdminPage() {
  const router = useRouter();

  const [complaints, setComplaints] = useState<ExtendedComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [selectedComplaint, setSelectedComplaint] =
    useState<ExtendedComplaint | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<ComplaintStatus>("open");
  const [newPriority, setNewPriority] = useState<string>("medium");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  useEffect(() => {
    const loadComplaints = async () => {
      try {
        const complaintsData = await getAllComplaints();
        if (complaintsData) {
          setComplaints(complaintsData as ExtendedComplaint[]);
        }
      } catch (error) {
        console.error("Error loading complaints:", error);
        toast({
          title: "Error loading complaints",
          description: "You may not have admin permissions to view this page.",
          variant: "destructive",
        });
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    loadComplaints();
  }, [router]);

  const filteredComplaints = complaints
    .filter((complaint) => {
      const matchesSearch =
        complaint.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (complaint.profiles?.email &&
          complaint.profiles.email
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (complaint.profiles?.first_name &&
          complaint.profiles.first_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (complaint.profiles?.last_name &&
          complaint.profiles.last_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (complaint.location &&
          complaint.location.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" || complaint.status === statusFilter;
      const matchesType = typeFilter === "all" || complaint.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      if (
        sortField === "created_at" ||
        sortField === "updated_at" ||
        sortField === "resolved_at"
      ) {
        const aValue =
          (a[sortField as keyof ExtendedComplaint] as string | undefined) || "";
        const bValue =
          (b[sortField as keyof ExtendedComplaint] as string | undefined) || "";

        if (sortDirection === "asc") {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      }

      if (sortField === "priority") {
        const priorityOrder = { urgent: 3, high: 2, medium: 1, low: 0 };
        const aValue =
          priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
        const bValue =
          priorityOrder[b.priority as keyof typeof priorityOrder] || 0;

        if (sortDirection === "asc") {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      }

      const aValue = String(a[sortField as keyof ExtendedComplaint] || "");
      const bValue = String(b[sortField as keyof ExtendedComplaint] || "");

      if (sortDirection === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

  const totalPages = Math.ceil(filteredComplaints.length / pageSize);
  const paginatedComplaints = filteredComplaints.slice(
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

  const handleUpdateStatus = async () => {
    if (!selectedComplaint) return;

    setProcessing(true);

    try {
      const updatedComplaint = await updateComplaintStatus(
        selectedComplaint.id!,
        newStatus,
        resolutionNotes,
        newPriority as ComplaintPriority
      );

      setComplaints(
        complaints.map((complaint) =>
          complaint.id === updatedComplaint.id
            ? { ...complaint, ...updatedComplaint }
            : complaint
        )
      );

      toast({
        title: "Complaint updated",
        description: `Status changed to ${newStatus} and priority set to ${newPriority}.`,
      });

      setUpdateDialogOpen(false);
    } catch (error) {
      console.error("Error updating complaint:", error);
      toast({
        title: "Error updating complaint",
        description: "There was a problem updating the complaint.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteComplaint = async () => {
    if (!selectedComplaint || !selectedComplaint.id) return;

    setDeleting(true);

    try {
      await deleteComplaint(selectedComplaint.id);

      setComplaints(
        complaints.filter((complaint) => complaint.id !== selectedComplaint.id)
      );

      toast({
        title: "Complaint deleted",
        description: "The complaint has been permanently deleted.",
      });

      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting complaint:", error);
      toast({
        title: "Error deleting complaint",
        description: "There was a problem deleting the complaint.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
      case "open":
        return (
          <Badge
            variant="outline"
            className="border-blue-500 text-blue-700 bg-blue-50">
            Open
          </Badge>
        );
      case "under_review":
        return (
          <Badge
            variant="outline"
            className="border-yellow-500 text-yellow-700 bg-yellow-50">
            Under Review
          </Badge>
        );
      case "resolved":
        return (
          <Badge
            variant="outline"
            className="border-green-500 text-green-700 bg-green-50">
            Resolved
          </Badge>
        );
      case "closed":
        return (
          <Badge
            variant="outline"
            className="border-gray-500 text-gray-700 bg-gray-50">
            Closed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string = "medium") => {
    switch (priority) {
      case "urgent":
        return (
          <Badge className="bg-red-500 text-white hover:bg-red-600">
            Urgent
          </Badge>
        );
      case "high":
        return (
          <Badge className="bg-orange-500 text-white hover:bg-orange-600">
            High
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-blue-500 text-white hover:bg-blue-600">
            Medium
          </Badge>
        );
      case "low":
        return (
          <Badge className="bg-green-500 text-white hover:bg-green-600">
            Low
          </Badge>
        );
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-accent mb-4" />
        <p className="text-lg">Loading complaints...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">
            Complaints & Reports Dashboard
          </h1>
          <p className="text-gray-600 mb-4">
            Manage user complaints, reports, and feedback.
          </p>
        </div>
        <Link href="/admin/users">
          <Button
            variant="outline"
            className="mt-2 md:mt-0 hover:bg-accent hover:text-white">
            Back to Admin Dashboard
          </Button>
        </Link>
      </div>

      {/* Filters and search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <Input
            placeholder="Search by user or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white border-gray-300 hover:border-accent focus:border-accent">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-md">
              <SelectItem
                value="all"
                className="text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:text-gray-800 cursor-pointer">
                All Statuses
              </SelectItem>
              <SelectItem
                value="open"
                className="text-blue-700 hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-800 cursor-pointer">
                Open
              </SelectItem>
              <SelectItem
                value="under_review"
                className="text-yellow-700 hover:bg-yellow-50 focus:bg-yellow-50 focus:text-yellow-800 cursor-pointer">
                Under Review
              </SelectItem>
              <SelectItem
                value="resolved"
                className="text-green-700 hover:bg-green-50 focus:bg-green-50 focus:text-green-800 cursor-pointer">
                Resolved
              </SelectItem>
              <SelectItem
                value="closed"
                className="text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:text-gray-800 cursor-pointer">
                Closed
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="bg-white border-gray-300 hover:border-accent focus:border-accent">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-md">
              <SelectItem
                value="all"
                className="text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:text-gray-800 cursor-pointer">
                All Types
              </SelectItem>
              <SelectItem
                value="complaint"
                className="text-red-700 hover:bg-red-50 focus:bg-red-50 focus:text-red-800 cursor-pointer">
                Complaints
              </SelectItem>
              <SelectItem
                value="report"
                className="text-orange-700 hover:bg-orange-50 focus:bg-orange-50 focus:text-orange-800 cursor-pointer">
                Reports
              </SelectItem>
              <SelectItem
                value="feedback"
                className="text-purple-700 hover:bg-purple-50 focus:bg-purple-50 focus:text-purple-800 cursor-pointer">
                Feedback
              </SelectItem>
              <SelectItem
                value="suggestion"
                className="text-teal-700 hover:bg-teal-50 focus:bg-teal-50 focus:text-teal-800 cursor-pointer">
                Suggestions
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => toggleSort("created_at")}
            className="flex-shrink-0 hover:bg-accent/10">
            <ArrowUpDown className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-500">
            {paginatedComplaints.length} of {filteredComplaints.length} items
          </span>
        </div>
      </div>

      {/* Complaints table */}
      <div className="bg-white shadow rounded-lg overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort("type")}>
                  Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort("subject")}>
                  Subject
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort("status")}>
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort("priority")}>
                  Priority
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort("location")}>
                  Location
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort("created_at")}>
                  Submitted
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedComplaints.length > 0 ? (
                paginatedComplaints.map((complaint) => (
                  <tr key={complaint.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {complaint.type}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {complaint.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getStatusBadge(complaint.status as ComplaintStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getPriorityBadge(complaint.priority)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {complaint.location || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {complaint.profiles ? (
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1 text-gray-400" />
                          <span>
                            {complaint.profiles.first_name}{" "}
                            {complaint.profiles.last_name}
                          </span>
                        </div>
                      ) : (
                        "Unknown"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(complaint.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            setNewStatus(
                              (complaint.status as ComplaintStatus) || "open"
                            );
                            setNewPriority(complaint.priority || "medium");
                            setResolutionNotes(
                              complaint.resolution_notes || ""
                            );
                            setUpdateDialogOpen(true);
                          }}
                          className="hover:bg-accent/10">
                          Update
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            setDeleteDialogOpen(true);
                          }}
                          className="hover:bg-red-50 text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-4 text-center text-sm text-gray-500">
                    No complaints found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filteredComplaints.length > pageSize && (
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Update Status Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="bg-white border-0 shadow-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4 mb-4">
            <DialogTitle className="text-xl font-bold text-accent-dark">
              Update Complaint Status
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Change the status and add resolution notes if needed.
            </DialogDescription>
          </DialogHeader>

          {selectedComplaint && (
            <div className="space-y-5 py-2">
              <div className="grid gap-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h3 className="font-semibold text-gray-900">
                  {selectedComplaint.subject}
                </h3>
                <p className="text-sm text-gray-600 mt-1 max-h-24 overflow-y-auto">
                  {selectedComplaint.description}
                </p>
                {selectedComplaint.location && (
                  <p className="text-sm text-gray-500 mt-1">
                    <strong>Location:</strong> {selectedComplaint.location}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Status
                </label>
                <Select
                  value={newStatus}
                  onValueChange={(value) =>
                    setNewStatus(value as ComplaintStatus)
                  }>
                  <SelectTrigger className="bg-white border-gray-300 hover:border-accent focus:border-accent">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-md">
                    <SelectItem
                      value="open"
                      className="text-blue-700 hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-800 cursor-pointer">
                      Open
                    </SelectItem>
                    <SelectItem
                      value="under_review"
                      className="text-yellow-700 hover:bg-yellow-50 focus:bg-yellow-50 focus:text-yellow-800 cursor-pointer">
                      Under Review
                    </SelectItem>
                    <SelectItem
                      value="resolved"
                      className="text-green-700 hover:bg-green-50 focus:bg-green-50 focus:text-green-800 cursor-pointer">
                      Resolved
                    </SelectItem>
                    <SelectItem
                      value="closed"
                      className="text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:text-gray-800 cursor-pointer">
                      Closed
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Priority
                </label>
                <Select
                  value={newPriority}
                  onValueChange={(value) => setNewPriority(value)}>
                  <SelectTrigger className="bg-white border-gray-300 hover:border-accent focus:border-accent">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-md">
                    <SelectItem
                      value="low"
                      className="text-green-700 hover:bg-green-50 focus:bg-green-50 focus:text-green-800 cursor-pointer">
                      Low
                    </SelectItem>
                    <SelectItem
                      value="medium"
                      className="text-blue-700 hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-800 cursor-pointer">
                      Medium
                    </SelectItem>
                    <SelectItem
                      value="high"
                      className="text-orange-700 hover:bg-orange-50 focus:bg-orange-50 focus:text-orange-800 cursor-pointer">
                      High
                    </SelectItem>
                    <SelectItem
                      value="urgent"
                      className="text-red-700 hover:bg-red-50 focus:bg-red-50 focus:text-red-800 cursor-pointer">
                      Urgent
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Resolution Notes
                </label>
                <Textarea
                  placeholder="Add notes about how this was resolved or additional information"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={4}
                  className="bg-white border-gray-300 focus:border-accent resize-none"
                />
              </div>

              {/* Display Images */}
              {selectedComplaint.image_urls &&
                selectedComplaint.image_urls.length > 0 && (
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      Attached Images
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md bg-gray-50">
                      {selectedComplaint.image_urls.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block aspect-square border rounded-md overflow-hidden hover:opacity-80 transition-opacity">
                          <img
                            src={url}
                            alt={`Complaint image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          <DialogFooter className="border-t pt-4 mt-4 gap-3">
            <Button
              variant="outline"
              onClick={() => setUpdateDialogOpen(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50">
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={processing}
              className="bg-accent text-white hover:bg-accent-dark">
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Delete Complaint
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              complaint and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {selectedComplaint && (
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 my-4">
              <p className="font-medium text-gray-800">
                {selectedComplaint.subject}
              </p>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {selectedComplaint.description}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {selectedComplaint.type}
                </Badge>
                {selectedComplaint.profiles && (
                  <span className="text-xs text-gray-500">
                    by {selectedComplaint.profiles.first_name}{" "}
                    {selectedComplaint.profiles.last_name}
                  </span>
                )}
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
              onClick={(e) => {
                e.preventDefault();
                handleDeleteComplaint();
              }}
              disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Complaint"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
