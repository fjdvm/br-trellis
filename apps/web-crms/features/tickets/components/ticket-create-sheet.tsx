import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ticketsApi } from "@/features/conversations/services/conversations-api";

export function TicketCreateSheet({
  onSuccess,
  onShowToast,
}: {
  onSuccess?: () => void;
  onShowToast?: (msg: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ticketsApi.create(
        { title, description, imageUrl: "" },
        "00000000-0000-0000-0000-000000000001"
      );
      onShowToast?.("Ticket created");
      onSuccess?.();
      setOpen(false);
    } catch (err) {
      onShowToast?.("Failed to create ticket");
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Create Ticket</Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Create Support Ticket</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label htmlFor="ticket-title">Ticket Title *</label>
              <Input id="ticket-title" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="ticket-desc">Description *</label>
              <Textarea id="ticket-desc" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <Button type="submit" className="w-full">Submit Ticket</Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
