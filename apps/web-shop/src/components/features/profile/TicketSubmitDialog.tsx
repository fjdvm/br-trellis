"use client";

import { useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supportApi } from "@/lib/api/support-api";
import { TicketImageUploader, type ImageFileItem } from "./TicketImageUploader";
import { Loader2 } from "lucide-react";

interface TicketSubmitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onSuccess: (ticketId?: string) => void;
}

export function TicketSubmitDialog({
  isOpen,
  onClose,
  userId,
  onSuccess,
}: TicketSubmitDialogProps) {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string })?.accessToken;
  const [subject, setSubject] = useState("");
  const [type, setType] = useState<string>("Inquiry");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<ImageFileItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!subject.trim()) {
      setErrorMessage("Subject is required.");
      return;
    }
    if (!description.trim()) {
      setErrorMessage("Description is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const imagePreviews = images.map((img) => img.file.name);

      const res = await supportApi.createTicket({
        title: subject.trim(),
        type,
        description: description.trim(),
        userId,
        images: imagePreviews,
        token,
      });

      if (res.success) {
        setSubject("");
        setType("Inquiry");
        setDescription("");
        setImages([]);
        onSuccess(res.id);
        onClose();
      } else {
        setErrorMessage(res.error || "Failed to submit ticket. Please try again.");
      }
    } catch {
      setErrorMessage("An error occurred while creating your ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-white p-6 border border-border shadow-xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-extrabold text-foreground">
            Submit Support Ticket
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Let us know your inquiry, request, or complaint. Our support team will get back to you shortly.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="p-3 bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="ticket-subject" className="text-xs font-bold text-foreground">
              Subject <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ticket-subject"
              placeholder="e.g. Inquiry regarding order status"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ticket-type" className="text-xs font-bold text-foreground">
              Type <span className="text-destructive">*</span>
            </Label>
            <Select value={type} onValueChange={setType} disabled={isSubmitting}>
              <SelectTrigger id="ticket-type">
                <SelectValue placeholder="Select ticket type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inquiry">Inquiry</SelectItem>
                <SelectItem value="Request">Request</SelectItem>
                <SelectItem value="Complain">Complain</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ticket-description" className="text-xs font-bold text-foreground">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="ticket-description"
              placeholder="Describe your concern or issue in detail..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <TicketImageUploader
            images={images}
            onChange={setImages}
            disabled={isSubmitting}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg text-xs bg-primary text-white hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Submitting...
                </>
              ) : (
                "Submit Ticket"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
