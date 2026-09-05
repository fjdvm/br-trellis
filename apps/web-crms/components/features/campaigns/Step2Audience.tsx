"use client";

import { useMemo, useState } from "react";
import {
  Users,
  Folder,
  UserPlus,
  FilterX,
  Mail,
  X,
  ChevronDown,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { SegmentListItem } from "@/types/segment";
import { useAudienceCounts } from "@/hooks/useAudienceCounts";

const NO_SEGMENT = "__none__";

export const SYSTEM_PRESET_SEGMENTS: SegmentListItem[] = [
  {
    id: "all",
    name: "All",
    type: "System",
    isSystemDefined: true,
    memberCount: 0,
    rule: null,
  },
  {
    id: "ecommerce",
    name: "Ecommerce",
    type: "System",
    isSystemDefined: true,
    memberCount: 0,
    rule: null,
  },
  {
    id: "companies",
    name: "Companies",
    type: "System",
    isSystemDefined: true,
    memberCount: 0,
    rule: null,
  },
  {
    id: "contacts",
    name: "Contacts",
    type: "System",
    isSystemDefined: true,
    memberCount: 0,
    rule: null,
  },
];

interface Step2AudienceProps {
  segments: SegmentListItem[];
  segmentId: string;
  onSegmentIdChange: (id: string) => void;
  emails: string;
  onEmailsChange: (emails: string) => void;
  emailsRequired?: boolean;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim().toLowerCase());
}

export function Step2Audience({
  segments,
  segmentId,
  onSegmentIdChange,
  emails,
  onEmailsChange,
  emailsRequired = false,
}: Step2AudienceProps) {
  const [manualExpanded, setManualExpanded] = useState(true);
  const [inputValue, setInputValue] = useState(() => emails ?? "");
  const [emailError, setEmailError] = useState<string | null>(null);

  const { data: audienceCounts, isError: isAudienceCountsError } = useAudienceCounts();

  const combinedSegments = useMemo(() => {
    const presetCountMap: Record<string, number> = {
      all: audienceCounts?.all ?? 0,
      contacts: audienceCounts?.contacts ?? 0,
      companies: audienceCounts?.companies ?? 0,
      ecommerce: audienceCounts?.ecommerce ?? 0,
    };

    const customFiltered = segments.filter(
      (s) => !SYSTEM_PRESET_SEGMENTS.some((p) => p.id === s.id)
    );
    const presetsWithRealCounts = SYSTEM_PRESET_SEGMENTS.map((p) => ({
      ...p,
      memberCount: presetCountMap[p.id] ?? p.memberCount,
    }));
    return [...presetsWithRealCounts, ...customFiltered];
  }, [segments, audienceCounts]);

  const selectedSegment = useMemo(
    () => combinedSegments.find((s) => s.id === segmentId),
    [combinedSegments, segmentId]
  );

  const parsedEmails = useMemo(() => {
    return emails
      .split(/[,\n]/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0 && isValidEmail(e));
  }, [emails]);

  const segmentMemberCount = selectedSegment?.memberCount ?? 0;
  const totalRecipients = segmentMemberCount + parsedEmails.length;

  const addEmail = (rawText: string) => {
    const trimmed = rawText.trim().replace(/^,+|,+$/g, "");
    if (!trimmed) return;

    if (!isValidEmail(trimmed)) {
      setEmailError(`"${trimmed}" is not a valid email address (e.g. user@example.com)`);
      return;
    }

    setEmailError(null);
    if (!parsedEmails.includes(trimmed.toLowerCase())) {
      const newEmails = [...parsedEmails, trimmed.toLowerCase()].join("\n");
      onEmailsChange(newEmails);
    }
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " " || e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addEmail(inputValue);
    } else if (e.key === "Backspace" && !inputValue && parsedEmails.length > 0) {
      removeEmail(parsedEmails[parsedEmails.length - 1]);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addEmail(inputValue);
    }
  };

  const removeEmail = (emailToRemove: string) => {
    setEmailError(null);
    const updated = parsedEmails.filter((e) => e !== emailToRemove).join("\n");
    onEmailsChange(updated);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl items-start">
      {/* Left Column: Core Audience Configuration */}
      <div className="lg:col-span-8 flex flex-col gap-lg">
        {/* Part 1: Primary Segment Selection */}
        <div className="bg-card border border-border p-lg rounded-xl shadow-xs flex flex-col gap-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-sm">
              <Users className="w-5 h-5 text-foreground" />
              <h3 className="text-title-lg font-semibold text-foreground">Primary CRM Segment</h3>
            </div>
          </div>

          {isAudienceCountsError && (
            <Alert variant="destructive">
              <AlertTitle>Couldn't load audience counts</AlertTitle>
              <AlertDescription>
                Unable to retrieve member counts for preset customer segments. Please check your network connection or try again later.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-xs">
            <Label htmlFor="segment-select" className="text-sm font-medium">
              Customer Segment
            </Label>
            <Select value={segmentId} onValueChange={onSegmentIdChange}>
              <SelectTrigger id="segment-select" aria-label="Segment" className="w-full h-10">
                <SelectValue placeholder="Select a segment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_SEGMENT}>No segment (Manual emails only)</SelectItem>
                {combinedSegments.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({isAudienceCountsError && SYSTEM_PRESET_SEGMENTS.some((p) => p.id === s.id) ? "count unavailable" : `${s.memberCount} members`})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedSegment && (
              <div className="flex items-center justify-between mt-xs text-xs text-muted-foreground">
                <p>
                  <strong className="text-foreground">Segment criteria:</strong> {selectedSegment.rule ? "Custom rule active" : "Targeted cohort"}
                </p>
                <span>Updated recently</span>
              </div>
            )}
          </div>

          {/* Segment Breakdown Mini-Viz */}
          {selectedSegment && (
            <div className="bg-muted/40 p-md rounded-lg flex flex-col gap-sm border border-border/50">
              <div className="flex items-center justify-between text-xs">
                <span className="uppercase tracking-wider font-semibold text-muted-foreground">
                  Segment Health &amp; Reachability
                </span>
                <span className="font-semibold text-foreground">
                  {selectedSegment.memberCount} Qualified Contacts
                </span>
              </div>
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden flex">
                <div className="h-full bg-gradient-to-r from-slate-950 via-purple-900 to-violet-600" style={{ width: "82%" }} title="Decision Makers: 82%" />
                <div className="h-full bg-secondary" style={{ width: "14%" }} title="Tech Evaluators: 14%" />
                <div className="h-full bg-muted-foreground/40" style={{ width: "4%" }} title="Operations: 4%" />
              </div>
              <div className="flex items-center gap-md text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary" /> Decision Makers (82%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-secondary" /> Tech Evaluators (14%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40" /> Operations (4%)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Part 2: Secondary Manual Email Input */}
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
            {/* Only allow collapsing when not required */}
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

      </div>

      {/* Right Column: Audience Ledger */}
      <div className="lg:col-span-4 flex flex-col gap-lg sticky top-24">
        <div className="bg-card border border-border p-lg rounded-xl shadow-md flex flex-col gap-lg">
          <div className="flex items-center justify-between pb-xs border-b border-border/50">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-foreground" />
              <span className="text-title-lg font-semibold text-foreground">Audience Ledger</span>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Summary
            </span>
          </div>

          <div className="p-lg bg-muted/30 rounded-xl flex flex-col items-center justify-center text-center gap-1 border border-border/40">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              Total Estimated Recipients
            </span>
            <span className="text-display-lg font-bold text-foreground">
              {totalRecipients.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">Ready for delivery dispatch</span>
          </div>

          <div className="flex flex-col gap-2 py-xs text-base">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
                <Folder className="w-4 h-4" />
                CRM Segment
              </span>
              <span className="font-semibold text-foreground">{segmentMemberCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
                <UserPlus className="w-4 h-4" />
                Manual Additions
              </span>
              <span className="font-semibold text-foreground">+{parsedEmails.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
                <FilterX className="w-4 h-4" />
                Suppression List Match
              </span>
              <span className="font-semibold text-muted-foreground">-0</span>
            </div>
          </div>

          <div className="p-md bg-muted/40 rounded-lg flex flex-col gap-1.5 border border-border/50 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Daily Tier Quota</span>
              <span className="font-semibold text-foreground">{totalRecipients} / 25,000</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-slate-950 via-purple-900 to-violet-600" style={{ width: `${Math.min(100, (totalRecipients / 25000) * 100)}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
