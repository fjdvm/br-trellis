"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Clock, Loader2, Pencil, ShoppingBag, Trash2 } from "lucide-react";
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
import { BackButton } from "@/components/shared/BackButton";
import {
  validateContactFields,
  hasErrors,
  type ContactFieldErrors,
} from "@/lib/validators/contact-validators";
import type { ContactDetail } from "@/types/contact";
import type { CompanyListItem } from "@/types/company";

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
        name: editName || undefined,
        email: editEmail || undefined,
        phone: editPhone || undefined,
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
      <div className="flex items-center justify-between">
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
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => { setEditName(e.target.value); setFieldErrors((prev) => ({ ...prev, name: undefined })); }}
                    aria-invalid={!!fieldErrors.name}
                    className={fieldErrors.name ? "border-destructive" : ""}
                  />
                  {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editEmail}
                    onChange={(e) => { setEditEmail(e.target.value); setFieldErrors((prev) => ({ ...prev, email: undefined })); }}
                    aria-invalid={!!fieldErrors.email}
                    className={fieldErrors.email ? "border-destructive" : ""}
                  />
                  {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={editPhone}
                    onChange={(e) => { setEditPhone(e.target.value); setFieldErrors((prev) => ({ ...prev, phone: undefined })); }}
                    aria-invalid={!!fieldErrors.phone}
                    className={fieldErrors.phone ? "border-destructive" : ""}
                  />
                  {fieldErrors.phone && <p className="text-xs text-destructive">{fieldErrors.phone}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-company">Company</Label>
                  <select
                    id="edit-company"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={editCompanyId}
                    onChange={(e) => setEditCompanyId(e.target.value)}
                  >
                    <option value="">None</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.buyerType})
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  onClick={() => {
                    const errors = validateContactFields({ name: editName, email: editEmail, phone: editPhone });
                    setFieldErrors(errors);
                    if (!hasErrors(errors)) setShowSaveDialog(true);
                  }}
                  disabled={isSaving}
                  className="w-full"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {isSaving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-md text-base">
                <div className="text-muted-foreground">Name</div>
                <div>{contact.name ?? "—"}</div>
                <div className="text-muted-foreground">Email</div>
                <div>{contact.email ?? "—"}</div>
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

      <Card className="shadow-none border-border">
        <CardHeader className="pb-md p-lg">
          <CardTitle className="text-title-lg font-bold">Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {!contact.orders || contact.orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-xl text-center">
              <ShoppingBag className="w-10 h-10 text-muted-foreground mb-md" />
              <p className="text-base text-muted-foreground">
                No orders yet. Order data synced from the ecommerce platform will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-md">
              {contact.orders.map((order) => (
                <div key={order.id} className="border border-border rounded-lg p-md space-y-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-sm">
                      <span className="font-medium text-base">#{order.platformOrderId}</span>
                      <Badge variant={order.status === "Refunded" ? "destructive" : "outline"}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="text-base text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-base">
                    <span className="font-medium">${order.total.toFixed(2)}</span>
                    {order.refundedAmount > 0 && (
                      <span className="text-destructive ml-2">
                        (−${order.refundedAmount.toFixed(2)} refunded)
                      </span>
                    )}
                  </div>
                  {order.lineItems.length > 0 && (
                    <div className="text-sm text-muted-foreground space-y-xs">
                      {order.lineItems.map((item, idx) => (
                        <div key={idx}>
                          {item.quantity}× {item.productName} @ ${item.unitPrice.toFixed(2)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-none border-border">
        <CardHeader className="pb-md p-lg">
          <CardTitle className="text-title-lg font-bold">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {contact.timelineEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-xl text-center">
              <Clock className="w-10 h-10 text-muted-foreground mb-md" />
              <p className="text-base text-muted-foreground">
                No activity recorded yet. Events from connected modules will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-md">
              {contact.timelineEntries.map((entry) => (
                <div key={entry.id} className="flex items-start gap-md border-l-2 border-border pl-md">
                  <div className="flex-1">
                    <div className="text-base font-medium">{entry.summary}</div>
                    <div className="text-sm text-muted-foreground">
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
