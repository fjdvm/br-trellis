import React from "react";
import { Mail, ChevronDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ManualEmailInputProps {
  emailsRequired: boolean;
  parsedEmails: string[];
  manualExpanded: boolean;
  setManualExpanded: (v: boolean) => void;
  inputValue: string;
  setInputValue: (v: string) => void;
  emailError: string | null;
  setEmailError: (v: string | null) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleBlur: () => void;
  removeEmail: (email: string) => void;
  onEmailsChange: (emails: string) => void;
}

export function ManualEmailInput({
  emailsRequired,
  parsedEmails,
  manualExpanded,
  setManualExpanded,
  inputValue,
  setInputValue,
  emailError,
  setEmailError,
  handleKeyDown,
  handleBlur,
  removeEmail,
  onEmailsChange,
}: ManualEmailInputProps) {
  return (
    <div
      className={`bg-card border p-lg rounded-xl shadow-xs flex flex-col gap-md ${
        emailsRequired && parsedEmails.length === 0
          ? "border-destructive"
          : "border-border"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-sm">
          <Mail className="w-5 h-5 text-foreground" />
          <div className="flex items-center gap-2">
            <h3 className="text-title-lg font-semibold text-foreground">
              Add specific email addresses
              {emailsRequired && <span className="text-destructive ml-0.5">*</span>}
            </h3>
          </div>
        </div>
        {!emailsRequired && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setManualExpanded(!manualExpanded)}
            className="h-8 w-8"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${manualExpanded ? "rotate-180" : ""}`} />
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        {emailsRequired
          ? "No segment selected — you must add at least one recipient email address to proceed."
          : "Manually append ad-hoc external recipients, advisory leads, or partner distributions not currently cataloged in the core CRM database."}
      </p>

      {(manualExpanded || emailsRequired) && (
        <div className="space-y-xs">
          <div
            className={`min-h-[100px] p-md border rounded-md bg-background focus-within:ring-1 flex flex-wrap items-center gap-2 relative ${
              emailsRequired && parsedEmails.length === 0
                ? "border-destructive focus-within:ring-destructive"
                : "border-input focus-within:ring-ring"
            }`}
          >
            {parsedEmails.map((email) => (
              <Badge
                key={email}
                variant="secondary"
                className="flex items-center gap-1.5 px-3 py-1 text-sm rounded-full bg-muted/80 text-foreground border border-border"
              >
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{email}</span>
                <button
                  type="button"
                  onClick={() => removeEmail(email)}
                  className="ml-0.5 rounded-full hover:bg-muted p-0.5 text-muted-foreground hover:text-foreground focus:outline-none"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </Badge>
            ))}
            <input
              id="additional-emails"
              aria-label="Additional emails"
              aria-required={emailsRequired}
              type="text"
              inputMode="email"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (emailError) setEmailError(null);
              }}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              placeholder={parsedEmails.length === 0 ? "Type valid email (e.g. user@domain.com) and press enter..." : "Add email..."}
              className="flex-1 min-w-[200px] bg-transparent text-base outline-none placeholder:text-muted-foreground"
            />
            <div className="absolute right-3 top-3">
              <Badge variant="outline" className="text-xs font-mono">
                {parsedEmails.length} added
              </Badge>
            </div>
          </div>

          {emailError && (
            <p className="text-xs text-destructive font-medium mt-1">
              {emailError}
            </p>
          )}

          {emailsRequired && parsedEmails.length === 0 && !emailError && (
            <p className="text-xs text-destructive font-medium mt-1">
              At least one email address is required when no segment is selected.
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Press space, comma, or enter to add email badge.</span>
            {parsedEmails.length > 0 && (
              <button
                type="button"
                onClick={() => onEmailsChange("")}
                className="text-foreground underline hover:text-primary font-medium"
              >
                Clear list
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
