"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, RefreshCw, Download } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CampaignTable } from "@/features/campaigns/components/campaign-table";
import { CampaignQuickStats } from "@/features/campaigns/components/campaign-quick-stats";
import { useCampaigns } from "@/features/campaigns/hooks/useCampaigns";
import type { CampaignChannel, CampaignStatus } from "@/features/campaigns/types";

type TabValue = "All" | CampaignStatus;
type ChannelFilter = "Any" | CampaignChannel;

const TABS: { value: TabValue; label: string }[] = [
  { value: "All", label: "All" },
  { value: "Draft", label: "Draft" },
  { value: "Active", label: "Active" },
  { value: "Ended", label: "Ended" },
];

const CHANNEL_FILTERS: ChannelFilter[] = ["Any", "Email", "Banner", "Popup"];

export function Campaigns({ initialStatus = "All" }: { initialStatus?: TabValue }) {
  const router = useRouter();
  const [tab, setTab] = useState<TabValue>(initialStatus);
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState<ChannelFilter>("Any");
  const { data: campaigns, isLoading, error, refetch } = useCampaigns();

  const stats = useMemo(() => {
    const active = campaigns.filter((c) => c.status === "Active").length;
    const draft = campaigns.filter((c) => c.status === "Draft").length;
    const recipients = campaigns.reduce(
      (sum, c) => sum + (c.targetEmails?.length ?? 0),
      0
    );
    return { total: campaigns.length, active, draft, recipients };
  }, [campaigns]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return campaigns.filter((c) => {
      if (tab !== "All" && c.status !== tab) return false;
      if (channel !== "Any" && !c.channels.includes(channel)) return false;
      if (query && !c.title.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [campaigns, tab, channel, search]);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(campaigns, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `campaigns-report-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg max-w-container-max mx-auto">
      {/* Header Block */}
      <div className="space-y-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-md">
          <div className="space-y-xs">
            <h1 className="text-headline-md font-bold tracking-tight text-foreground">
              Campaigns
            </h1>
            <p className="text-body-md text-muted-foreground">
              Manage multichannel outreach, lifecycle messages, and promotional broadcasts across all connected endpoints.
            </p>
          </div>
          <div className="flex items-center gap-sm">
            <Button onClick={() => router.push("/campaigns/new")} className="gap-1.5 shadow-sm">
              <Plus className="w-4 h-4" />
              Create Campaign
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar (Wireframe Bento Metric Cards) */}
      <CampaignQuickStats
        activeCount={stats.active}
        recipientsCount={stats.recipients}
        draftCount={stats.draft}
        totalCount={stats.total}
      />

      {error && <div className="p-md text-destructive text-base">{error.message}</div>}

      {/* Filter Deck & Data Table Card */}
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
                <Select value={channel} onValueChange={(v) => setChannel(v as ChannelFilter)}>
                  <SelectTrigger aria-label="Channel filter" className="w-[160px]">
                    <SelectValue placeholder="Channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNEL_FILTERS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c === "Any" ? "Channel: Any" : `Channel: ${c}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative flex-1 min-w-[200px] sm:w-[240px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    aria-label="Search campaigns"
                    placeholder="Search campaigns..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            {TABS.map((t) => (
              <TabsContent key={t.value} value={t.value} className="mt-lg">
                {isLoading ? (
                  <TableSkeleton columns={6} />
                ) : (
                  <CampaignTable campaigns={filtered} onRefetch={refetch} />
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
