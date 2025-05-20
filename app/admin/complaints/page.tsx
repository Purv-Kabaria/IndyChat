"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Loader2, User, 
  ChevronLeft, ChevronRight, ArrowUpDown
} from "lucide-react";
import { 
  getAllComplaints, 
  updateComplaintStatus, 
  Complaint, 
  ComplaintStatus 
} from "@/lib/complaints";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

type ExtendedComplaint = Complaint & {
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  assigned_profiles?: {
    first_name: string;
    last_name: string;
  } | null;
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
  
  // Selected complaint for actions
  const [selectedComplaint, setSelectedComplaint] = useState<ExtendedComplaint | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<ComplaintStatus>("open");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  
  // Pagination states
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
        console.error('Error loading complaints:', error);
        toast({
          title: "Error loading complaints",
          description: "You may not have admin permissions to view this page.",
          variant: "destructive",
        });
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    loadComplaints();
  }, [router]);

  // Filter and sort complaints
  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = 
      complaint.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (complaint.profiles?.email && complaint.profiles.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (complaint.profiles?.first_name && complaint.profiles.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (complaint.profiles?.last_name && complaint.profiles.last_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || complaint.status === statusFilter;
    const matchesType = typeFilter === "all" || complaint.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  }).sort((a, b) => {
    // Handle date fields
    if (sortField === 'created_at' || sortField === 'updated_at' || sortField === 'resolved_at') {
      const aValue = a[sortField as keyof ExtendedComplaint] as string | undefined || '';
      const bValue = b[sortField as keyof ExtendedComplaint] as string | undefined || '';
      
      if (sortDirection === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    }
    
    // Handle priority
    if (sortField === 'priority') {
      const priorityOrder = { 'urgent': 3, 'high': 2, 'medium': 1, 'low': 0 };
      const aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
      const bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
      
      if (sortDirection === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    }
    
    // Default string comparison
    const aValue = String(a[sortField as keyof ExtendedComplaint] || '');
    const bValue = String(b[sortField as keyof ExtendedComplaint] || '');
    
    if (sortDirection === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredComplaints.length / pageSize);
  const paginatedComplaints = filteredComplaints.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Handle page navigation
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedComplaint) return;
    
    setProcessing(true);
    
    try {
      const updatedComplaint = await updateComplaintStatus(
        selectedComplaint.id!,
        newStatus,
        resolutionNotes
      );
      
      setComplaints(complaints.map(complaint => 
        complaint.id === updatedComplaint.id ? {...complaint, ...updatedComplaint} : complaint
      ));
      
      toast({
        title: "Status updated",
        description: `Complaint status has been updated to ${newStatus}.`,
      });
      
      setUpdateDialogOpen(false);
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error updating status",
        description: "There was a problem updating the complaint status.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50">Open</Badge>;
      case 'under_review':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">Under Review</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">Resolved</Badge>;
      case 'closed':
        return <Badge variant="outline" className="border-gray-500 text-gray-700 bg-gray-50">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string = 'medium') => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-500">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-500">High</Badge>;
      case 'medium':
        return <Badge className="bg-blue-500">Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-500">Low</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  // Format date for display
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
          <h1 className="text-2xl font-bold mb-2">Complaints & Reports Dashboard</h1>
          <p className="text-gray-600 mb-4">Manage user complaints, reports, and feedback.</p>
        </div>
        <Link href="/admin">
          <Button variant="outline" className="mt-2 md:mt-0">
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
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="complaint">Complaints</SelectItem>
              <SelectItem value="report">Reports</SelectItem>
              <SelectItem value="feedback">Feedback</SelectItem>
              <SelectItem value="suggestion">Suggestions</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => toggleSort('created_at')}
            className="flex-shrink-0"
          >
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
                  onClick={() => toggleSort('id')}
                >
                  ID
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort('type')}
                >
                  Type
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort('subject')}
                >
                  Subject
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort('status')}
                >
                  Status
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort('priority')}
                >
                  Priority
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  User
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort('created_at')}
                >
                  Submitted
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedComplaints.length > 0 ? (
                paginatedComplaints.map((complaint) => (
                  <tr key={complaint.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {complaint.id?.substring(0, 8)}...
                    </td>
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
                      {complaint.profiles ? (
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1 text-gray-400" />
                          <span>{complaint.profiles.first_name} {complaint.profiles.last_name}</span>
                        </div>
                      ) : (
                        "Unknown"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(complaint.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedComplaint(complaint);
                          setNewStatus(complaint.status as ComplaintStatus || 'open');
                          setResolutionNotes(complaint.resolution_notes || '');
                          setUpdateDialogOpen(true);
                        }}
                      >
                        Update
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
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
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Update Status Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Complaint Status</DialogTitle>
            <DialogDescription>
              Change the status and add resolution notes if needed.
            </DialogDescription>
          </DialogHeader>
          
          {selectedComplaint && (
            <div className="space-y-4 py-2">
              <div className="grid gap-2">
                <h3 className="font-semibold">{selectedComplaint.subject}</h3>
                <p className="text-sm text-gray-500 mt-1 max-h-24 overflow-y-auto">
                  {selectedComplaint.description}
                </p>
              </div>
              
              <div className="grid gap-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={newStatus} onValueChange={(value) => setNewStatus(value as ComplaintStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <label className="text-sm font-medium">Resolution Notes</label>
                <Textarea
                  placeholder="Add notes about how this was resolved or additional information"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={processing}>
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
    </div>
  );
} 