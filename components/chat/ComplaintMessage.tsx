"use client";

import { useState } from "react";
import { ComplaintForm } from "@/components/chat/ComplaintForm";
import { ComplaintType } from "@/functions/complaintUtils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, FileText, MessageSquare, Lightbulb } from "lucide-react";

interface ComplaintMessageProps {
  type?: ComplaintType;
  onComplete: () => void;
  userId: string;
}

export function ComplaintMessage({
  type = "complaint",
  onComplete,
  userId,
}: ComplaintMessageProps) {
  const [showForm, setShowForm] = useState(false);

  const handleSubmitComplete = () => {
    setShowForm(false);
    onComplete();
  };

  const typeLabels = {
    complaint: "File a Complaint",
    report: "Report an Issue",
    feedback: "Provide Feedback",
    suggestion: "Make a Suggestion",
  };

  const typeIcons = {
    complaint: <AlertCircle className="h-4 w-4 mr-2" />,
    report: <FileText className="h-4 w-4 mr-2" />,
    feedback: <MessageSquare className="h-4 w-4 mr-2" />,
    suggestion: <Lightbulb className="h-4 w-4 mr-2" />,
  };

  const messages = {
    complaint:
      "I'm sorry to hear you're having an issue. Would you like to file a formal complaint?",
    report: "Would you like to report this issue to our team?",
    feedback: "Would you like to provide feedback to help us improve?",
    suggestion: "Would you like to make a suggestion for improvements?",
  };

  if (!showForm) {
    return (
      <Card className="p-5 w-full max-w-md border border-accent/10 shadow-sm bg-white rounded-xl overflow-hidden">
        <div className="flex items-start space-x-3 mb-4">
          <div
            className={`p-2 rounded-full flex-shrink-0 bg-accent/10 text-accent`}>
            {typeIcons[type]}
          </div>
          <p className="text-sm text-gray-700">{messages[type]}</p>
        </div>
        <div className="flex flex-col sm:flex-row w-full gap-2">
          <Button
            onClick={() => setShowForm(true)}
            className="bg-accent hover:bg-accent/90 text-white w-full sm:w-auto">
            {typeIcons[type]}
            {typeLabels[type]}
          </Button>
          <Button
            variant="outline"
            onClick={onComplete}
            className="border-gray-300 hover:bg-gray-50 text-gray-700 w-full sm:w-auto">
            No, thanks
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <ComplaintForm
      initialType={type}
      onComplete={handleSubmitComplete}
      userId={userId}
    />
  );
}
