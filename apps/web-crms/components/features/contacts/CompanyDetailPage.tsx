"use client";

import { useCallback, useEffect, useState } from "react";
import { Archive, Loader2, Pencil, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import type { CompanyDetail } from "@/types/company";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CompanyDetailPageProps {
  companyId: string;
}

export function CompanyDetailPage({ companyId }: CompanyDetailPageProps) {
  const router = useRouter();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBuyerType, setEditBuyerType] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Archive confirmation
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  const loadCompany = useCallback(async () => {
    try {
      const result = await crmClient.companies.getById(companyId);
      setCompany(result);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load company."
      );
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void loadCompany();
  }, [loadCompany]);

  function handleStartEdit() {
    if (!company) return;
    setEditName(company.name);
    setEditBuyerType(company.buyerType);
    setIsEditing(true);
  }

  async function handleSaveEdit() {
    if (!company) return;
    setIsSaving(true);
    try {
      const updated = await crmClient.companies.update(company.id, {
        name: editName,
        buyerType: editBuyerType,
      });
      setCompany(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleArchive() {
    if (!company) return;
    setShowArchiveDialog(false);
    try {
      await crmClient.companies.archive(company.id);
      router.push("/contacts/companies");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive.");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-xl">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="w-full min-h-full py-xl px-lg md:px-xl max-w-7xl mx-auto">
        <div className="p-xl text-destructive">
          {error ?? "Company not found."}
        </div>
      </div>
    );
  }

  const isArchived = company.deletedAt !== null;

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg max-w-7xl mx-auto">
      <div className="space-y-sm">
        <BackButton fallbackHref="/contacts/companies" />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-headline-md font-bold tracking-tight text-foreground">
              {company.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{company.buyerType}</Badge>
              {isArchived && <Badge variant="destructive">Archived</Badge>}
            </div>
          </div>
          {!isArchived && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleStartEdit}>
                <Pencil className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowArchiveDialog(true)}
              >
                <Archive className="w-4 h-4 mr-1" />
                Archive
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <Card className="shadow-none border-border">
          <CardHeader className="pb-md p-lg">
            <CardTitle className="text-title-lg font-bold">
              Edit Company
            </CardTitle>
          </CardHeader>
          <CardContent className="p-lg pt-0 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Name</Label>
              <Input
                id="company-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-buyer-type">Buyer Type</Label>
              <select
                id="company-buyer-type"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={editBuyerType}
                onChange={(e) => setEditBuyerType(e.target.value)}
              >
                <option value="Institutional">Institutional</option>
                <option value="Individual">Individual</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveEdit} disabled={isSaving} size="sm">
                {isSaving && (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                )}
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Primary Contact */}
      {company.primaryContact && (
        <Card className="shadow-none border-border">
          <CardHeader className="pb-md p-lg">
            <CardTitle className="text-title-lg font-bold">
              Primary Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="p-lg pt-0">
            <div className="text-base">
              <p className="font-medium">
                {company.primaryContact.name ?? "—"}
              </p>
              <p className="text-muted-foreground">
                {company.primaryContact.email ?? "—"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contacts Tab */}
      <Card className="shadow-none border-border">
        <CardHeader className="pb-md p-lg">
          <CardTitle className="text-title-lg font-bold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Contacts ({company.contacts.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-lg pt-0">
          {company.contacts.length === 0 ? (
            <div className="p-xl text-muted-foreground">
              No contacts assigned to this company.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">LTV</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {company.contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="text-base font-medium">
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="hover:underline text-primary"
                      >
                        {contact.name ?? "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-base">
                      {contact.email ?? "—"}
                    </TableCell>
                    <TableCell className="text-base">
                      {contact.phone ?? "—"}
                    </TableCell>
                    <TableCell className="text-base text-right">
                      ${contact.lifetimeValue.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Archive Confirmation */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive &quot;{company.name}&quot;? Its
              member contacts will remain linked but the company will be hidden
              from the active list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
