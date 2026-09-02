"use client";

import { useMemo, useState } from "react";
import {
  Users,
  Folder,
  UserPlus,
  FilterX,
  ShieldCheck,
  Mail,
  X,
  ChevronDown,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SegmentListItem } from "@/types/segment";

const NO_SEGMENT = "__none__";

interface Step2AudienceProps {
  segments: SegmentListItem[];
  segmentId: string;
  onSegmentIdChange: (id: string) => void;
  emails: string;
  onEmailsChange: (emails: string) => void;
}

export function Step2Audience({
  segments,
  segmentId,
  onSegmentIdChange,
  emails,
  onEmailsChange,
}: Step2AudienceProps) {
  const [manualExpanded, setManualExpanded] = useState(true);

  const selectedSegment = useMemo(
    () => segments.find((s) => s.id === segmentId),
    [segments, segmentId]
  );

  const parsedEmails = useMemo(() => {
    return emails
      .split(/[,\n]/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0);
  }, [emails]);

  const segmentMemberCount = selectedSegment?.memberCount ?? 0;
  const totalRecipients = segmentMemberCount + parsedEmails.length;

  const removeEmail = (emailToRemove: string) => {
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
            <Badge variant="secondary" className="text-xs">
              Auto-Sync Enabled
            </Badge>
          </div>

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
                {segments.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.memberCount} members)
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
                <div className="h-full bg-primary" style={{ width: "82%" }} title="Decision Makers: 82%" />
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
        <div className="bg-card border border-border p-lg rounded-xl shadow-xs flex flex-col gap-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-sm">
              <Mail className="w-5 h-5 text-foreground" />
              <div className="flex items-center gap-2">
                <h3 className="text-title-lg font-semibold text-foreground">Add specific email addresses</h3>
                <Badge variant="secondary" className="text-xs">Optional</Badge>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setManualExpanded(!manualExpanded)}
              className="h-8 w-8"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${manualExpanded ? "rotate-180" : ""}`} />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Manually append ad-hoc external recipients, advisory leads, or partner distributions not currently cataloged in the core CRM database.
          </p>

          {manualExpanded && (
            <div className="space-y-xs">
              <div className="relative">
                <Textarea
                  id="additional-emails"
                  aria-label="Additional emails"
                  value={emails}
                  onChange={(e) => onEmailsChange(e.target.value)}
                  placeholder="executive-lead@partnercorp.com&#10;procurement-dept@innovate.org"
                  rows={4}
                  className="p-md text-base leading-relaxed"
                />
                <div className="absolute right-3 top-3">
                  <Badge variant="outline" className="text-xs font-mono">
                    {parsedEmails.length} parsed
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Enter one email per line or separate by commas.</span>
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

              {parsedEmails.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {parsedEmails.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted text-xs text-foreground font-medium"
                    >
                      <Mail className="w-3 h-3 text-muted-foreground" />
                      {email}
                      <button
                        type="button"
                        onClick={() => removeEmail(email)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3 h-3 ml-0.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
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
              <div className="h-full bg-primary" style={{ width: `${Math.min(100, (totalRecipients / 25000) * 100)}%` }} />
            </div>
            <span className="text-muted-foreground">Deliverability capacity index: 99.8% optimal</span>
          </div>
        </div>

        <div className="bg-muted/40 border border-border p-md rounded-xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5 text-xs">
            <span className="font-semibold text-foreground">Consent &amp; Privacy Rule</span>
            <p className="text-muted-foreground leading-normal">
              Manual addresses must adhere to enterprise double opt-in guidelines. All recipients will include unsubscribe headers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
