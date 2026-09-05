"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { crmClient } from "@/lib/api/crm-client";

/** Buyer types mirror the backend `BuyerType` enum (api-crms/Enums/BuyerType.cs). */
const BUYER_TYPES = ["Institutional", "Individual"] as const;

interface NewCompanySheetProps {
  /** Called after a company is successfully created (e.g. to refetch the list). */
  onCreated?: () => void;
}

/**
 * Create a new Company. Name is required; Buyer Type defaults to Institutional.
 * Mirrors the NewTicketSheet pattern: on success it closes, resets the form,
 * and calls `onCreated` so the caller can refetch. Backed by POST
 * /api/v1/companies (CreateCompanyInput).
 */
export function NewCompanySheet({ onCreated }: NewCompanySheetProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [buyerType, setBuyerType] = useState<string>("Institutional");
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setName("");
    setBuyerType("Institutional");
    setNameError(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Company name is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await crmClient.companies.create({ name: trimmed, buyerType });
      resetForm();
      setOpen(false);
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create company.");
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
          <span>Add Company</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col h-full">
        <SheetHeader className="pb-4">
          <SheetTitle>Add Company</SheetTitle>
          <SheetDescription>
            Create a business organization. Name is required.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 gap-6 overflow-y-auto"
        >
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Name *</Label>
              <Input
                id="company-name"
                placeholder="Acme Corp"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError(null);
                }}
                autoFocus
                aria-invalid={!!nameError}
                className={nameError ? "border-destructive" : ""}
              />
              {nameError && (
                <p className="text-xs text-destructive">{nameError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-buyer-type">Buyer Type</Label>
              <Select value={buyerType} onValueChange={setBuyerType}>
                <SelectTrigger id="company-buyer-type" aria-label="Buyer type">
                  <SelectValue placeholder="Buyer type" />
                </SelectTrigger>
                <SelectContent>
                  {BUYER_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <SheetFooter className="mt-auto pt-4 border-t border-border">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              {isSubmitting ? "Creating…" : "Create Company"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
