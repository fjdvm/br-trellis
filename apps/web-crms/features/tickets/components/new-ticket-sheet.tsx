"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { contactsApi } from "@/features/contacts/contacts/services/contacts-api";
import { conversationTicketsApi } from "@/features/conversations/services/conversations-api";
import { formatName, formatEmail } from "@/lib/format-display";
import type { ContactListItem } from "@/features/contacts/types";

interface NewTicketSheetProps {
  /** Called after a ticket is successfully created (e.g. to refetch the list). */
  onCreated?: () => void;
}

/** Human label for a contact option: title-cased name, else email, else id. */
function contactOptionLabel(contact: ContactListItem): string {
  return (
    formatName(contact.name) ??
    formatEmail(contact.email) ??
    `Contact ${contact.id}`
  );
}

/**
 * Create a new Conversations ticket. Subject is required; a Contact is
 * optional (an unlinked ticket is valid). Mirrors the AddContactSheet pattern.
 * On success it closes, resets the form, and calls `onCreated` so the caller
 * can refetch. Backed by POST /api/v1/tickets (CreateTicketDto); the server
 * sets the initial Unclaimed / WaitingOn=None state.
 */
export function NewTicketSheet({ onCreated }: NewTicketSheetProps) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [contactId, setContactId] = useState<string>("");
  const [contacts, setContacts] = useState<ContactListItem[]>([]);
  const [subjectError, setSubjectError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load contacts for the optional picker only once the sheet is opened.
  useEffect(() => {
    if (open) {
      contactsApi
        .list()
        .then(setContacts)
        .catch(() => {});
    }
  }, [open]);

  function resetForm() {
    setSubject("");
    setContactId("");
    setSubjectError(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = subject.trim();
    if (!trimmed) {
      setSubjectError("Subject is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await conversationTicketsApi.create({
        subject: trimmed,
        contactId: contactId || undefined,
      });
      resetForm();
      setOpen(false);
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ticket.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <SheetTrigger asChild>
        <Button size="sm" className="flex items-center justify-center">
          <Plus className="w-4 h-4" />
          <span>New Ticket</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col h-full">
        <SheetHeader className="pb-4">
          <SheetTitle>New Ticket</SheetTitle>
          <SheetDescription>
            Create a support ticket. Subject is required; linking a contact is
            optional.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 gap-6 overflow-y-auto"
        >
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticket-subject">Subject *</Label>
              <Input
                id="ticket-subject"
                placeholder="Short summary of the issue"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  if (subjectError) setSubjectError(null);
                }}
                autoFocus
                aria-invalid={!!subjectError}
                className={subjectError ? "border-destructive" : ""}
              />
              {subjectError && (
                <p className="text-xs text-destructive">{subjectError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-contact">Contact</Label>
              <select
                id="ticket-contact"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
              >
                <option value="">None</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {contactOptionLabel(c)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <SheetFooter className="mt-auto pt-4 border-t border-border">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              {isSubmitting ? "Creating…" : "Create Ticket"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
