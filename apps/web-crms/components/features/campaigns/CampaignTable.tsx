"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

export function CampaignTable({ campaigns }: { campaigns: CampaignListItem[] }) {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Record<string, CampaignEngagementMetrics>>({});

  const ids = campaigns.map((c) => c.id).join(",");
  useEffect(() => {
    if (campaigns.length === 0) {
      setMetrics({});
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
            <TableHead className="min-w-[220px]">Title</TableHead>
            <TableHead className="min-w-[160px]">Channels</TableHead>
            <TableHead className="min-w-[120px]">Status</TableHead>
            <TableHead className="min-w-[110px]">Open Rate</TableHead>
            <TableHead className="min-w-[110px]">Click Rate</TableHead>
            <TableHead className="min-w-[140px]">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => (
            <TableRow
              key={campaign.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => router.push(`/campaigns/${campaign.id}`)}
            >
              <TableCell className="text-base font-medium">{campaign.title}</TableCell>
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
              <TableCell className="text-base">{rate(campaign, "openRate")}</TableCell>
              <TableCell className="text-base">{rate(campaign, "clickRate")}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(campaign.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollableTable>
  );
}
