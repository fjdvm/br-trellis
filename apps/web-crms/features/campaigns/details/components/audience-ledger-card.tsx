import React from "react";
import { Users, Folder, UserPlus, FilterX } from "lucide-react";

interface AudienceLedgerCardProps {
  totalRecipients: number;
  segmentMemberCount: number;
  parsedEmailsCount: number;
}

export function AudienceLedgerCard({
  totalRecipients,
  segmentMemberCount,
  parsedEmailsCount,
}: AudienceLedgerCardProps) {
  return (
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
            <span className="font-semibold text-foreground">+{parsedEmailsCount}</span>
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
            <div
              className="h-full bg-gradient-to-r from-slate-950 via-purple-900 to-violet-600"
              style={{ width: `${Math.min(100, (totalRecipients / 25000) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
