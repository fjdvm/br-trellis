"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  validateContactFields,
  hasErrors,
  type ContactFieldErrors,
} from "@/features/contacts/contacts/schemas/contact-validators";
import type { CompanyListItem } from "@/features/contacts/types";

interface ContactEditFormProps {
  editName: string;
  editEmail: string;
  editPhone: string;
  editCompanyId: string;
  companies: CompanyListItem[];
  isSaving: boolean;
  fieldErrors: ContactFieldErrors;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onCompanyChange: (value: string) => void;
  onFieldErrorsChange: (errors: ContactFieldErrors) => void;
  onSaveRequest: () => void;
}

export function ContactEditForm({
  editName,
  editEmail,
  editPhone,
  editCompanyId,
  companies,
  isSaving,
  fieldErrors,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onCompanyChange,
  onFieldErrorsChange,
  onSaveRequest,
}: ContactEditFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-name">Name *</Label>
        <Input
          id="edit-name"
          value={editName}
          onChange={(e) => { onNameChange(e.target.value); onFieldErrorsChange({ ...fieldErrors, name: undefined }); }}
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
          onChange={(e) => { onEmailChange(e.target.value); onFieldErrorsChange({ ...fieldErrors, email: undefined }); }}
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
          onChange={(e) => { onPhoneChange(e.target.value); onFieldErrorsChange({ ...fieldErrors, phone: undefined }); }}
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
          onChange={(e) => onCompanyChange(e.target.value)}
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
          onFieldErrorsChange(errors);
          if (!hasErrors(errors)) onSaveRequest();
        }}
        disabled={isSaving}
        className="w-full"
      >
        {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        {isSaving ? "Saving…" : "Save Changes"}
      </Button>
    </div>
  );
}
