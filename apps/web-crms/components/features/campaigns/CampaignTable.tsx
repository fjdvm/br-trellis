"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollableTable } from "@/components/shared/ScrollableTable";
import { CampaignChannelBadge } from "@/components/features/campaigns/CampaignChannelBadge";
import { CampaignStatusBadge } from "@/components/features/campaigns/CampaignStatusBadge";
import { crmClient } from "@/lib/api/crm-client";
import type { CampaignEngagementMetrics, CampaignListItem } from "@/types/campaign";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

// A short, human-readable campaign reference derived from the id — the
// wireframe surfaces an "ID:" line under each campaign name.
function shortRef(id: string): string {
  return `CMP-${id.slice(0, 8).toUpperCase()}`;
}

// Summarise the campaign's audience for the table's Audience column.
function audienceLabel(campaign: CampaignListItem): string {
  const segment = campaign.targetAudience ? "Segment" : null;
  const extra = campaign.targetEmails?.length ?? 0;
  if (segment && extra > 0) return `${segment} + ${extra} direct`;
  if (segment) return segment;
  if (extra > 0) return `${extra} direct recipient${extra === 1 ? "" : "s"}`;
  return "—";
}

export function CampaignTable({ campaigns }: { campaigns: CampaignListItem[] }) {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Record<string, CampaignEngagementMetrics>>({});

  const ids = campaigns.map((c) => c.id).join(",");
  useEffect(() => {
    if (campaigns.length === 0) {
      return;
    }
    let mounted = true;
    crmClient.campaigns
      .getEngagementMetrics(campaigns.map((c) => c.id))
      .then((list) => {
        if (!mounted) return;
        const map: Record<string, CampaignEngagementMetrics> = {};
        for (const m of list ?? []) {
          map[m.campaignId] = m;
        }
        setMetrics(map);
      })
      .catch(() => mounted && setMetrics({}));
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  if (campaigns.length === 0) {
    return <div className="p-xl text-muted-foreground">No campaigns found.</div>;
  }

  // Only Email campaigns can have an open/click rate; others show a dash.
  function rate(campaign: CampaignListItem, kind: "openRate" | "clickRate"): string {
    if (!campaign.channels.includes("Email")) return "—";
    const m = metrics[campaign.id];
    return m ? `${m[kind]}%` : "—";
  }

  return (
    <ScrollableTable>
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead className="min-w-[240px]">Campaign Name</TableHead>
            <TableHead className="min-w-[160px]">Channels</TableHead>
            <TableHead className="min-w-[120px]">Status</TableHead>
            <TableHead className="min-w-[180px]">Audience</TableHead>
            <TableHead className="min-w-[110px]">Open Rate</TableHead>
            <TableHead className="min-w-[110px]">Click Rate</TableHead>
            <TableHead className="min-w-[140px]">Created Date</TableHead>
            <TableHead className="min-w-[100px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => (
            <TableRow
              key={campaign.id}
              className="cursor-pointer hover:bg-muted/50 group"
              onClick={() => router.push(`/campaigns/${campaign.id}`)}
            >
              <TableCell className="text-base">
                <div className="flex flex-col">
                  <span className="font-medium text-foreground group-hover:underline underline-offset-4">
                    {campaign.title}
                  </span>
                  <span className="text-sm text-muted-foreground">ID: {shortRef(campaign.id)}</span>
                </div>
              </TableCell>
              <TableCell className="text-base">
                <span className="flex flex-wrap gap-1">
                  {campaign.channels.map((c) => (
                    <CampaignChannelBadge key={c} channel={c} />
                  ))}
                </span>
              </TableCell>
              <TableCell className="text-base">
                <CampaignStatusBadge status={campaign.status} />
              </TableCell>
              <TableCell className="text-base text-foreground">{audienceLabel(campaign)}</TableCell>
              <TableCell className="text-base">{rate(campaign, "openRate")}</TableCell>
              <TableCell className="text-base">{rate(campaign, "clickRate")}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(campaign.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <span className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground group-hover:text-foreground">
                  View
                  <ChevronRight className="w-4 h-4" />
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollableTable>
  );
}
