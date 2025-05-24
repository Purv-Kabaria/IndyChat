"use client";

import { useState } from 'react';
import { submitComplaint, ComplaintType } from '@/functions/complaintUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, FileText, MessageSquare, Lightbulb } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface ComplaintFormProps {
  onComplete?: () => void;
  initialType?: ComplaintType;
}

export function ComplaintForm({ onComplete, initialType = 'complaint' }: ComplaintFormProps) {
  const [type, setType] = useState<ComplaintType>(initialType);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !description.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a subject and description.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      await submitComplaint({
        user_id: '', // Will be set by the submitComplaint function
        type,
        subject,
        description,
      });
      
      toast({
        title: "Submission successful",
        description: `Your ${type} has been submitted successfully.`,
      });
      
      // Reset form
      setSubject("");
      setDescription("");
      
      // Call onComplete if provided
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Error submitting complaint:", error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const typeLabels = {
    complaint: "Complaint",
    report: "Report an Issue",
    feedback: "Feedback",
    suggestion: "Suggestion"
  };

  const typeIcons = {
    complaint: <AlertCircle className="h-4 w-4" />,
    report: <FileText className="h-4 w-4" />,
    feedback: <MessageSquare className="h-4 w-4" />,
    suggestion: <Lightbulb className="h-4 w-4" />
  };
  
  return (
    <Card className="w-full max-w-md mx-auto border border-accent/10 shadow-md bg-white overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-accent to-accent/90 text-white">
        <CardTitle className="text-xl font-bold">Submit a {typeLabels[type]}</CardTitle>
        <CardDescription className="text-white/80 mt-1">
          Let us know about your concerns or suggestions.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-3">
            <Label htmlFor="type" className="text-sm font-medium text-gray-700">
              Type of submission
            </Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Object.entries(typeLabels).map(([value, label]) => (
                <div 
                  key={value} 
                  className={`
                    flex flex-col items-center justify-center p-3 rounded-lg border 
                    cursor-pointer transition-colors duration-200 relative
                    ${type === value 
                      ? 'border-accent bg-accent/5 shadow-sm' 
                      : 'border-gray-200 hover:border-accent/50 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => setType(value as ComplaintType)}
                >
                  <div className={`
                    p-2 rounded-full ${type === value ? 'bg-accent text-white' : 'bg-gray-100 text-gray-500'}
                  `}>
                    {typeIcons[value as keyof typeof typeIcons]}
                  </div>
                  <span className="mt-2 text-xs font-medium text-center">
                    {label}
                  </span>
                  <input 
                    type="radio" 
                    name="complaintType" 
                    value={value} 
                    checked={type === value} 
                    onChange={() => {}} 
                    className="sr-only"
                  />
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
              Subject
            </Label>
            <Input
              id="subject"
              placeholder="Brief summary of your issue"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full border-gray-300 focus:border-accent focus:ring-accent"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Please provide details about your issue, including any relevant information that might help us address it."
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full border-gray-300 focus:border-accent focus:ring-accent resize-none"
            />
            <p className="text-xs text-gray-500 italic mt-1">
              Please be as specific as possible to help us address your {type} promptly.
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between border-t border-gray-100 px-4 sm:px-6 py-4 bg-gray-50">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onComplete}
            className="border-gray-300 text-gray-700 hover:bg-gray-100 w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={loading}
            className="bg-accent hover:bg-accent/90 text-white w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              type === 'complaint' ? "Submit Complaint" : 
              type === 'report' ? "Submit Report" :
              type === 'feedback' ? "Submit Feedback" :
              "Submit Suggestion"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 