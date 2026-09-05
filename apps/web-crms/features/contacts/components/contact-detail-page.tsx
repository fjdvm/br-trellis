"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, Pencil, Trash2 } from "lucide-react";
import { DetailSkeleton } from "@/components/shared/DetailSkeleton";
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
import type { ContactFieldErrors } from "@/features/contacts/schemas/contact-validators";
import type { ContactDetail } from "@/features/contacts/types";
import type { CompanyListItem } from "@/features/contacts/types";
import { ContactEditForm } from "./contact-edit-form";
import { ContactOrdersCard } from "./contact-orders-card";
import { ContactTimelineCard } from "./contact-timeline-card";
import { ContactCoreFieldsCard, ContactCustomFieldsCard } from "./contact-fields-cards";


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
    return <DetailSkeleton />;
  }

  if (error && !contact) {
    return <div className="p-xl text-destructive">{error}</div>;
  }

  if (!contact) {
    return <div className="p-xl text-muted-foreground">Contact not found.</div>;
  }

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg mx-auto">
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
        <ContactCoreFieldsCard contact={contact} isEditing={isEditing}>
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
        </ContactCoreFieldsCard>

        <ContactCustomFieldsCard contact={contact} />
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

