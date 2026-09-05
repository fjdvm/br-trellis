"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollableTable } from "@/components/shared/ScrollableTable";
import {
  TablePagination,
  useClientPagination,
} from "@/components/shared/TablePagination";
import { CampaignChannelBadge } from "@/features/campaigns/components/campaign-channel-badge";
import { CampaignStatusBadge } from "@/features/campaigns/components/campaign-status-badge";
import { campaignsApi } from "@/features/campaigns/services/campaigns-api";
import type { CampaignEngagementMetrics, CampaignListItem } from "@/features/campaigns/types";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function shortRef(id: string): string {
  return `CMP-${id.slice(0, 8).toUpperCase()}`;
}

function audienceLabel(campaign: CampaignListItem): string {
  const segment = campaign.targetAudience ? "Enterprise Clients" : null;
  const extra = campaign.targetEmails?.length ?? 0;
  if (segment && extra > 0) return `${segment} (+${extra})`;
  if (segment) return segment;
  if (extra > 0) return `Custom list (${extra})`;
  return "—";
}

export function CampaignTable({
  campaigns,
  onRefetch,
}: {
  campaigns: CampaignListItem[];
  onRefetch?: () => void;
}) {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Record<string, CampaignEngagementMetrics>>({});

  const pagination = useClientPagination(campaigns);

  const ids = campaigns.map((c) => c.id).join(",");
  useEffect(() => {
    if (campaigns.length === 0) {
      return;
    }
    let mounted = true;
    campaignsApi
      .getEngagementMetrics(campaigns.map((c) => c.id))
      .then((list) => {
        if (!mounted) return;
        const map: Record<string, CampaignEngagementMetrics> = {};
        for (const m of list ?? []) {
          map[m.campaignId] = m;
        }
        setMetrics(map);
      })
      .catch(() => {
        if (mounted) setMetrics({});
      });
    return () => {
      mounted = false;
    };
  }, [ids, campaigns]);

  if (campaigns.length === 0) {
    return <div className="p-xl text-muted-foreground text-base">No campaigns found.</div>;
  }

  return (
    <div className="space-y-4">
      <ScrollableTable>
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="min-w-[140px]">Ref #</TableHead>
              <TableHead className="min-w-[200px]">Campaign Title</TableHead>
              <TableHead className="min-w-[120px]">Status</TableHead>
              <TableHead className="min-w-[160px]">Channels</TableHead>
              <TableHead className="min-w-[180px]">Target Audience</TableHead>
              <TableHead className="min-w-[130px]">Created</TableHead>
              <TableHead className="min-w-[160px]">Sent / Delivery</TableHead>
              <TableHead className="w-[48px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.pageItems.map((campaign) => (
              <TableRow
                key={campaign.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/campaigns/${campaign.id}`)}
              >
                <TableCell className="font-mono text-muted-foreground">
                  {shortRef(campaign.id)}
                </TableCell>
                <TableCell className="font-medium">{campaign.title}</TableCell>
                <TableCell>
                  <CampaignStatusBadge status={campaign.status} />
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {campaign.channels.map((ch) => (
                      <CampaignChannelBadge key={ch} channel={ch} />
                    ))}
                  </div>
                </TableCell>
                <TableCell>{audienceLabel(campaign)}</TableCell>
                <TableCell>{formatDate(campaign.createdAt)}</TableCell>
                <TableCell>
                  {"dispatchResult" in campaign && campaign.dispatchResult ? (
                    <span className="text-foreground">
                      {(campaign as any).dispatchResult.processedRecipientCount} sent
                    </span>
                  ) : metrics[campaign.id] ? (
                    <span className="text-foreground">
                      {metrics[campaign.id].sentCount} sent ({metrics[campaign.id].openRate}% open)
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-base font-medium py-2.5 px-3 cursor-pointer"
                        onClick={() => router.push(`/campaigns/${campaign.id}`)}
                      >
                        View Campaign
                      </DropdownMenuItem>
                      {campaign.status === "Draft" && (
                        <>
                          <DropdownMenuItem
                            className="text-base font-medium py-2.5 px-3 cursor-pointer"
                            onClick={async () => {
                              try {
                                await campaignsApi.updateStatus(campaign.id, "Active");
                                onRefetch?.();
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                          >
                            Launch Campaign
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-base font-medium py-2.5 px-3 cursor-pointer"
                            onClick={() => router.push(`/campaigns/${campaign.id}/edit`)}
                          >
                            Edit Campaign
                          </DropdownMenuItem>
                        </>
                      )}
                      {campaign.status === "Active" && (
                        <DropdownMenuItem
                          className="text-base font-medium py-2.5 px-3 cursor-pointer text-destructive focus:text-destructive"
                          onClick={async () => {
                            try {
                              await campaignsApi.updateStatus(campaign.id, "Ended");
                              onRefetch?.();
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                        >
                          End Campaign
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollableTable>

      <TablePagination pagination={pagination} />
    </div>
  );
}
