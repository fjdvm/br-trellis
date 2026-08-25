"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Clock, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import { crmClient } from "@/lib/api/crm-client";
import type { ContactDetail } from "@/types/contact";

interface ContactDetailPageProps {
  contactId: string;
}

export function ContactDetailPage({ contactId }: ContactDetailPageProps) {
  const router = useRouter();
  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    async function loadContact() {
      try {
        const result = await crmClient.contacts.getById(contactId);
        if (isCurrent) {
          setContact(result);
          setEditName(result.name ?? "");
          setEditEmail(result.email ?? "");
          setEditPhone(result.phone ?? "");
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load contact.");
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    void loadContact();
    return () => {
      isCurrent = false;
    };
  }, [contactId]);

  async function handleSaveConfirmed() {
    setShowSaveDialog(false);
    setIsSaving(true);
    try {
      const updated = await crmClient.contacts.update(contactId, {
        name: editName || undefined,
        email: editEmail || undefined,
        phone: editPhone || undefined,
      });
      setContact(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteConfirmed() {
    setShowDeleteDialog(false);
    setIsDeleting(true);
    try {
      await crmClient.contacts.delete(contactId);
      router.push("/contacts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete.");
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return <div className="p-xl text-muted-foreground">Loading contact…</div>;
  }

  if (error && !contact) {
    return <div className="p-xl text-destructive">{error}</div>;
  }

  if (!contact) {
    return <div className="p-xl text-muted-foreground">Contact not found.</div>;
  }

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-2xl max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href="/contacts" className="hidden sm:inline-flex">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Contacts
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Pencil className="w-4 h-4" />
            <span className="ml-1">{isEditing ? "Cancel" : "Edit"}</span>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4" />
            <span className="ml-1">{isDeleting ? "Deleting…" : "Delete"}</span>
          </Button>
        </div>
      </div>

      <div className="space-y-sm">
        <h1 className="text-headline-md font-bold tracking-tight text-foreground">
          {contact.name ?? "Unnamed contact"}
        </h1>
        <p className="text-body-md text-muted-foreground">
          {contact.email ?? "No email"} · {contact.phone ?? "No phone"}
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-lg md:grid-cols-2">
        <Card className="shadow-none border-border">
          <CardHeader className="pb-md p-lg">
            <CardTitle className="text-title-lg font-bold">Core fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-md">
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => setShowSaveDialog(true)}
                  disabled={isSaving}
                  className="w-full"
                >
                  {isSaving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-md text-sm">
                <div className="text-muted-foreground">Name</div>
                <div>{contact.name ?? "—"}</div>
                <div className="text-muted-foreground">Email</div>
                <div>{contact.email ?? "—"}</div>
                <div className="text-muted-foreground">Phone</div>
                <div>{contact.phone ?? "—"}</div>
                <div className="text-muted-foreground">Sentiment Score</div>
                <div>{contact.sentimentScore != null ? contact.sentimentScore : "—"}</div>
              </div>
            )}

            {contact.company && (
              <>
                <Separator />
                <div className="flex items-center gap-sm text-sm">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Company:</span>
                  <span className="font-medium">{contact.company.name}</span>
                </div>
              </>
            )}

            {contact.sourceReferences.length > 0 && (
              <>
                <Separator />
                <div className="space-y-sm">
                  <div className="text-sm text-muted-foreground">Known sources</div>
                  <div className="flex flex-wrap gap-sm">
                    {contact.sourceReferences.map((ref) => (
                      <Badge key={`${ref.sourceSystem}:${ref.sourceId}`} variant="outline">
                        {ref.sourceSystem} · {ref.sourceId}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none border-border">
          <CardHeader className="pb-md p-lg">
            <CardTitle className="text-title-lg font-bold">Custom fields</CardTitle>
          </CardHeader>
          <CardContent>
            {contact.customFields.length === 0 ? (
              <div className="text-sm text-muted-foreground">No custom fields defined.</div>
            ) : (
              <div className="grid grid-cols-2 gap-md text-sm">
                {contact.customFields.map((field) => (
                  <div key={field.definitionId} className="contents">
                    <div className="text-muted-foreground">{field.name}</div>
                    <div>{renderFieldValue(field)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-none border-border">
        <CardHeader className="pb-md p-lg">
          <CardTitle className="text-title-lg font-bold">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {contact.timelineEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-xl text-center">
              <Clock className="w-10 h-10 text-muted-foreground mb-md" />
              <p className="text-sm text-muted-foreground">
                No activity recorded yet. Events from connected modules will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-md">
              {contact.timelineEntries.map((entry) => (
                <div key={entry.id} className="flex items-start gap-md border-l-2 border-border pl-md">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{entry.summary}</div>
                    <div className="text-xs text-muted-foreground">
                      {entry.sourceModule} · {entry.entryType} · {new Date(entry.occurredAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {contact.name ?? "this contact"}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteConfirmed}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save Confirmation Dialog */}
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update this contact&apos;s information?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveConfirmed}>
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function renderFieldValue(field: ContactDetail["customFields"][number]): string {
  if (field.selectedOption) return field.selectedOption.label;
  if (field.textValue != null) return field.textValue;
  if (field.numberValue != null) return String(field.numberValue);
  if (field.dateValue != null) return new Date(field.dateValue).toLocaleDateString();
  if (field.boolValue != null) return field.boolValue ? "Yes" : "No";
  return "—";
}
