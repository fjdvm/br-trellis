"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Megaphone, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ScrollableTable } from "@/components/shared/scrollable-table";
import { CampaignChannelBadge } from "@/features/campaigns/components/campaign-channel-badge";
import { CampaignStatusBadge } from "@/features/campaigns/components/campaign-status-badge";
import { CampaignQuickStats } from "@/features/campaigns/components/campaign-quick-stats";
import { TemplatesGallery } from "@/features/campaigns/components/templates-gallery";
import { useCampaigns } from "@/features/campaigns/hooks/useCampaigns";
import { campaignsApi } from "@/features/campaigns/services/campaigns-api";
import type { CampaignChannel, CampaignStatus, CampaignEngagementMetrics } from "@/features/campaigns/types";

type ViewMode = "All Campaigns" | "Templates";
type TabValue = "All" | CampaignStatus;
type ChannelFilter = "All" | CampaignChannel;

const TABS: { value: TabValue; label: string }[] = [
  { value: "All", label: "All" },
  { value: "Draft", label: "Draft" },
  { value: "Active", label: "Active" },
  { value: "Ended", label: "Ended" },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

function shortRef(id: string): string {
  return `CMP-${id.slice(0, 8).toUpperCase()}`;
}

export function Campaigns({ initialStatus = "All" }: { initialStatus?: string }) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("All Campaigns");
  const [tab, setTab] = useState<TabValue>(
    initialStatus === "Draft" || initialStatus === "Active" || initialStatus === "Ended"
      ? initialStatus
      : "All"
  );
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("All");
  const [search, setSearch] = useState("");
  const [metrics, setMetrics] = useState<Record<string, CampaignEngagementMetrics>>({});
  const { data: campaigns, isLoading, error, refetch } = useCampaigns();

  const ids = campaigns.map((c) => c.id).join(",");
  useEffect(() => {
    if (campaigns.length === 0) return;
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

  const stats = useMemo(() => {
    const active = campaigns.filter((c) => c.status === "Active").length;
    const draft = campaigns.filter((c) => c.status === "Draft").length;
    const recipients = campaigns.reduce(
      (sum, c) => sum + (c.targetEmails?.length ?? 0),
      0
    );
    return { total: campaigns.length, active, draft, recipients };
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    const query = search.trim().toLowerCase();
    return campaigns.filter((c) => {
      if (tab !== "All" && c.status !== tab) return false;
      if (channelFilter !== "All" && !c.channels.includes(channelFilter as CampaignChannel)) {
        return false;
      }
      if (query && !c.title.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
  }, [campaigns, tab, channelFilter, search]);

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg max-w-container-max mx-auto">
      {/* Header Block with Always-Visible Create Campaign Button */}
      <div className="space-y-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
          <div className="space-y-xs">
            <h1 className="text-headline-md font-bold tracking-tight text-foreground">
              Campaigns
            </h1>
            <p className="text-body-md text-muted-foreground">
              Manage multichannel outreach, lifecycle messages, and promotional broadcasts.
            </p>
          </div>

          <div className="flex items-center gap-sm">
            {/* View Mode Select */}
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <SelectTrigger className="w-[180px] bg-background font-semibold shadow-sm">
                <SelectValue placeholder="View Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Campaigns">All Campaigns</SelectItem>
                <SelectItem value="Templates">Templates</SelectItem>
              </SelectContent>
            </Select>

            {/* Create Campaign Button (Always Visible) */}
            <Button
              onClick={() => router.push("/campaigns/new")}
              className="gap-1.5 shadow-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              Create Campaign
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content View Switch */}
      {viewMode === "All Campaigns" ? (
        <div className="space-y-lg">
          {/* Quick Stats Bar */}
          <CampaignQuickStats
            activeCount={stats.active}
            recipientsCount={stats.recipients}
            draftCount={stats.draft}
            totalCount={stats.total}
          />

          {error && <div className="p-md text-destructive text-base">{error.message}</div>}

          {/* Status Tabs & Channel Chips Deck */}
          <Card className="shadow-none border-border">
            <CardContent className="p-6 space-y-lg">
              <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-md">
                  <TabsList className="w-full lg:w-auto overflow-x-auto justify-start">
                    {TABS.map((t) => (
                      <TabsTrigger key={t.value} value={t.value}>
                        {t.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <div className="flex flex-wrap items-center gap-sm">
                    {/* Channel Filter Chips */}
                    <div className="flex flex-wrap items-center gap-xs">
                      {(["All", "Email", "Banner", "Popup"] as const).map((ch) => {
                        const isActive = channelFilter === ch;
                        return (
                          <button
                            key={ch}
                            type="button"
                            onClick={() => setChannelFilter(ch)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer border ${
                              isActive
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-foreground"
                            }`}
                          >
                            {ch === "All" ? "All (default)" : ch}
                          </button>
                        );
                      })}
                    </div>

                    <div className="relative flex-1 min-w-[200px] sm:w-[240px]">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        aria-label="Search campaigns"
                        placeholder="Search campaigns..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 text-base"
                      />
                    </div>
                  </div>
                </div>

                {TABS.map((t) => (
                  <TabsContent key={t.value} value={t.value} className="mt-lg">
                    {isLoading ? (
                      <div className="h-48 rounded-lg border border-border bg-muted/20 animate-pulse" />
                    ) : filteredCampaigns.length === 0 ? (
                      <div className="p-xl text-center text-muted-foreground text-base border border-dashed rounded-lg">
                        No campaigns found.
                      </div>
                    ) : (
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
                            {filteredCampaigns.map((campaign) => (
                              <TableRow
                                key={campaign.id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => router.push(`/campaigns/${campaign.id}`)}
                              >
                                <TableCell className="font-mono text-muted-foreground">
                                  {shortRef(campaign.id)}
                                </TableCell>
                                <TableCell className="font-medium text-base">{campaign.title}</TableCell>
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
                                <TableCell className="text-base">
                                  {campaign.targetAudience ? "Enterprise Clients" : "Custom list"} (
                                  {campaign.targetEmails?.length ?? 0})
                                </TableCell>
                                <TableCell className="text-base">{formatDate(campaign.createdAt)}</TableCell>
                                <TableCell className="text-base">
                                  {metrics[campaign.id] ? (
                                    <span>
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
                                              await campaignsApi.updateStatus(campaign.id, "Active");
                                              refetch();
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
                                          className="text-base font-medium py-2.5 px-3 cursor-pointer text-destructive"
                                          onClick={async () => {
                                            await campaignsApi.updateStatus(campaign.id, "Ended");
                                            refetch();
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
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Templates Mode Gallery View */
        <TemplatesGallery />
      )}
    </div>
  );
}
