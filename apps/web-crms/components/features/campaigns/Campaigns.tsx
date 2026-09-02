"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
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
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CampaignTable } from "@/components/features/campaigns/CampaignTable";
import { useCampaigns } from "@/hooks/useCampaigns";
import type { CampaignChannel, CampaignStatus } from "@/types/campaign";

type TabValue = "All" | CampaignStatus;
type ChannelFilter = "Any" | CampaignChannel;

const TABS: { value: TabValue; label: string }[] = [
  { value: "All", label: "All" },
  { value: "Draft", label: "Draft" },
  { value: "Active", label: "Active" },
  { value: "Ended", label: "Ended" },
];

const CHANNEL_FILTERS: ChannelFilter[] = ["Any", "Email", "Banner", "Popup"];

/**
 * Campaigns list (#159). Multichannel campaign directory: a quick-stats bar,
 * a status/channel/search filter deck, and the campaigns table. The status
 * tabs are the primary lifecycle filter (All / Draft / Active / Ended).
 */
export function Campaigns({ initialStatus = "All" }: { initialStatus?: TabValue }) {
  const router = useRouter();
  const [tab, setTab] = useState<TabValue>(initialStatus);
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState<ChannelFilter>("Any");
  const { data: campaigns, isLoading, error } = useCampaigns();

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

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg max-w-7xl mx-auto">
      {/* Breadcrumb + header */}
      <div className="space-y-sm">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>Marketing &amp; Campaigns</BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Directory</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-md">
          <div className="space-y-sm">
            <h1 className="text-headline-md font-bold tracking-tight text-foreground">
              Campaigns
            </h1>
            <p className="text-body-md text-muted-foreground max-w-2xl">
              Manage multichannel outreach across email, banner, and popup channels.
            </p>
          </div>
          <Button onClick={() => router.push("/campaigns/new")}>
            <Plus className="w-4 h-4 mr-1" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Quick-stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        <StatCard label="Active Campaigns" value={stats.active} hint="Currently broadcasting" />
        <StatCard
          label="Total Recipients"
          value={stats.recipients.toLocaleString()}
          hint="Direct email targets"
        />
        <StatCard label="Draft Campaigns" value={stats.draft} hint="Pending launch" />
        <StatCard label="Total Campaigns" value={stats.total} hint="All lifecycle states" />
      </div>

      {error && <div className="p-md text-destructive text-base">{error.message}</div>}

      <Card className="shadow-none border-border">
        <CardContent className="p-lg space-y-lg">
          <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
            {/* Filter deck: status tabs + channel filter + search */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-md">
              <TabsList>
                {TABS.map((t) => (
                  <TabsTrigger key={t.value} value={t.value}>
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className="flex flex-wrap items-center gap-sm">
                <Select value={channel} onValueChange={(v) => setChannel(v as ChannelFilter)}>
                  <SelectTrigger aria-label="Channel filter" className="w-[150px]">
                    <SelectValue placeholder="Channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNEL_FILTERS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c === "Any" ? "Any channel" : c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    aria-label="Search campaigns"
                    placeholder="Search campaigns..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 w-[220px]"
                  />
                </div>
              </div>
            </div>

            {TABS.map((t) => (
              <TabsContent key={t.value} value={t.value} className="mt-lg">
                {isLoading ? (
                  <TableSkeleton columns={5} />
                ) : (
                  <CampaignTable campaigns={filtered} />
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <Card className="shadow-none border-border">
      <CardContent className="p-md flex flex-col gap-sm">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex items-baseline justify-between gap-sm">
          <span className="text-headline-md font-bold text-foreground">{value}</span>
          <span className="text-sm text-muted-foreground">{hint}</span>
        </div>
      </CardContent>
    </Card>
  );
}
