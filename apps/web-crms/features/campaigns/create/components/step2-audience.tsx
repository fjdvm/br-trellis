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
import { AudienceLedgerCard } from "../../details/components/audience-ledger-card";
import { ManualEmailInput } from "./manual-email-input";
import type { SegmentListItem } from "@/features/segments";
import { useAudienceCounts } from "../hooks/useAudienceCounts";

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
        <ManualEmailInput
          emailsRequired={emailsRequired}
          parsedEmails={parsedEmails}
          manualExpanded={manualExpanded}
          setManualExpanded={setManualExpanded}
          inputValue={inputValue}
          setInputValue={setInputValue}
          emailError={emailError}
          setEmailError={setEmailError}
          handleKeyDown={handleKeyDown}
          handleBlur={handleBlur}
          removeEmail={removeEmail}
          onEmailsChange={onEmailsChange}
        />

      </div>

      {/* Right Column: Audience Ledger */}
      <AudienceLedgerCard
        totalRecipients={totalRecipients}
        segmentMemberCount={segmentMemberCount}
        parsedEmailsCount={parsedEmails.length}
      />
    </div>
  );
}
