"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { BackButton } from "@/components/shared/BackButton";
import { formatName, formatEmail } from "@/lib/format-display";
import type { ContactFieldErrors } from "@/lib/validators/contact-validators";
import type { ContactDetail } from "@/types/contact";
import type { CompanyListItem } from "@/types/company";
import { ContactEditForm } from "./ContactEditForm";
import { ContactOrdersCard } from "./ContactOrdersCard";
import { ContactTimelineCard } from "./ContactTimelineCard";

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
  const [editCompanyId, setEditCompanyId] = useState<string>("");
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({});

  useEffect(() => {
    if (isEditing && companies.length === 0) {
      crmClient.companies.list(false).then(setCompanies).catch(() => {});
    }
  }, [isEditing, companies.length]);

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
          setEditCompanyId(result.company?.id ?? "");
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
        name: editName.trim() || undefined,
        email: editEmail.trim() || undefined,
        phone: editPhone.trim() || undefined,
        companyId: editCompanyId || undefined,
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
    return (
      <div className="flex items-center justify-center py-xl">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !contact) {
    return <div className="p-xl text-destructive">{error}</div>;
  }

  if (!contact) {
    return <div className="p-xl text-muted-foreground">Contact not found.</div>;
  }

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg max-w-7xl mx-auto">
      <BackButton fallbackHref="/contacts" />
      <div className="space-y-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-headline-md font-bold tracking-tight text-foreground">
            {formatName(contact.name) ?? "Unnamed contact"}
          </h1>
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
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              <span className="ml-1">{isDeleting ? "Deleting…" : "Delete"}</span>
            </Button>
          </div>
        </div>
        <p className="text-body-md text-muted-foreground">
          {formatEmail(contact.email) ?? "No email"} · {contact.phone ?? "No phone"}
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
              <ContactEditForm
                editName={editName}
                editEmail={editEmail}
                editPhone={editPhone}
                editCompanyId={editCompanyId}
                companies={companies}
                isSaving={isSaving}
                fieldErrors={fieldErrors}
                onNameChange={setEditName}
                onEmailChange={setEditEmail}
                onPhoneChange={setEditPhone}
                onCompanyChange={setEditCompanyId}
                onFieldErrorsChange={setFieldErrors}
                onSaveRequest={() => setShowSaveDialog(true)}
              />
            ) : (
              <div className="grid grid-cols-2 gap-md text-base">
                <div className="text-muted-foreground">Name</div>
                <div>{contact.name ?? "—"}</div>
                <div className="text-muted-foreground">Email</div>
                <div>{formatEmail(contact.email) ?? "—"}</div>
                <div className="text-muted-foreground">Phone</div>
                <div>{contact.phone ?? "—"}</div>
                <div className="text-muted-foreground">Sentiment Score</div>
                <div>{contact.sentimentScore != null ? contact.sentimentScore : "—"}</div>
                <div className="text-muted-foreground">Lifetime Value</div>
                <div>{contact.lifetimeValue != null ? `$${contact.lifetimeValue.toFixed(2)}` : "$0.00"}</div>
              </div>
            )}

            {contact.company && (
              <>
                <Separator />
                <div className="flex items-center gap-sm text-base">
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
                  <div className="text-base text-muted-foreground">Known sources</div>
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
              <div className="text-base text-muted-foreground">No custom fields defined.</div>
            ) : (
              <div className="grid grid-cols-2 gap-md text-base">
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

      <ContactOrdersCard orders={contact.orders} />
      <ContactTimelineCard entries={contact.timelineEntries} />

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
