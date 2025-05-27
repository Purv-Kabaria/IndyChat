"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  updateComplaintStatus,
  ComplaintStatus,
  ComplaintPriority,
} from "@/functions/complaintUtils";
import type { Complaint as ComplaintBaseType } from "@/functions/complaintUtils";
import Image from "next/image";

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

interface EditComplaintDialogProps {
  complaint: ExtendedComplaint | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onComplaintUpdated: () => void;
}

export function EditComplaintDialog({
  complaint,
  isOpen,
  onOpenChange,
  onComplaintUpdated,
}: EditComplaintDialogProps) {
  const [newStatus, setNewStatus] = React.useState<ComplaintStatus>("open");
  const [newPriority, setNewPriority] = React.useState<string>("medium");
  const [resolutionNotes, setResolutionNotes] = React.useState("");
  const [isProcessingUpdate, setIsProcessingUpdate] = React.useState(false);

  React.useEffect(() => {
    if (complaint) {
      setNewStatus(complaint.status as ComplaintStatus);
      setNewPriority(complaint.priority || "medium");
      setResolutionNotes(complaint.resolution_notes || "");
    }
  }, [complaint]);

  const handleUpdateStatus = async () => {
    if (!complaint || !complaint.id) return;

    setIsProcessingUpdate(true);

    try {
      await updateComplaintStatus(
        complaint.id,
        newStatus,
        resolutionNotes,
        newPriority as ComplaintPriority
      );

      toast({
        title: "Complaint updated",
        description: `Status changed to ${newStatus} and priority set to ${newPriority}.`,
      });
      onComplaintUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating complaint:", error);
      toast({
        title: "Error updating complaint",
        description:
          (error as Error).message ||
          "There was a problem updating the complaint.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingUpdate(false);
    }
  };

  if (!complaint) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-0 shadow-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4 mb-4">
          <DialogTitle className="text-xl font-bold text-accent-dark">
            Update Complaint Status
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Change the status and add resolution notes if needed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid gap-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h3 className="font-semibold text-gray-900">{complaint.subject}</h3>
            <p className="text-sm text-gray-600 mt-1 max-h-24 overflow-y-auto">
              {complaint.description}
            </p>
            {complaint.location && (
              <p className="text-sm text-gray-500 mt-1">
                <strong>Location:</strong> {complaint.location}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <Select
              value={newStatus}
              onValueChange={(value) => setNewStatus(value as ComplaintStatus)}>
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

          {complaint.image_urls && complaint.image_urls.length > 0 && (
            <div className="grid gap-2">
              <label className="text-sm font-medium text-gray-700">
                Attached Images
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md bg-gray-50">
                {complaint.image_urls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-square border rounded-md overflow-hidden hover:opacity-80 transition-opacity relative">
                    <Image
                      src={url}
                      alt={`Complaint image ${index + 1}`}
                      layout="fill"
                      objectFit="cover"
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4 mt-4 gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-300 text-gray-700 hover:bg-gray-50">
            Cancel
          </Button>
          <Button
            onClick={handleUpdateStatus}
            disabled={isProcessingUpdate}
            className="bg-accent text-white hover:bg-accent-dark">
            {isProcessingUpdate ? (
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
  );
}
