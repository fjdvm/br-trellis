"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CampaignTable } from "@/components/features/campaigns/CampaignTable";
import { useCampaigns } from "@/hooks/useCampaigns";
import type { CampaignStatus } from "@/types/campaign";

type TabValue = "All" | CampaignStatus;

const TABS: { value: TabValue; label: string }[] = [
  { value: "All", label: "All Campaigns" },
  { value: "Draft", label: "Draft" },
  { value: "Active", label: "Active" },
  { value: "Ended", label: "Ended" },
];

/**
 * Campaigns list (#159). The single list view backing the sidebar's All /
 * Active Campaigns / Published Posts entries — the same underlying list
 * filtered by status. "Published Posts" == status Ended.
 */
export function Campaigns({ initialStatus = "All" }: { initialStatus?: TabValue }) {
  const router = useRouter();
  const [tab, setTab] = useState<TabValue>(initialStatus);
  const { data: campaigns, isLoading, error } = useCampaigns();

  const filtered = useMemo(() => {
    if (tab === "All") return campaigns;
    return campaigns.filter((c) => c.status === tab);
  }, [campaigns, tab]);

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-sm">
          <h1 className="text-headline-md font-bold tracking-tight text-foreground flex items-center gap-2">
            <Megaphone className="w-6 h-6" />
            Campaigns
          </h1>
          <p className="text-body-md text-muted-foreground">
            Create and manage marketing campaigns across email, banner and popup channels.
          </p>
        </div>
        <Button onClick={() => router.push("/campaigns/new")}>
          <Plus className="w-4 h-4 mr-1" />
          Create Campaign
        </Button>
      </div>

      {error && <div className="p-md text-destructive text-base">{error.message}</div>}

      <Card className="shadow-none border-border">
        <CardContent className="p-lg">
          <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
            <TabsList>
              {TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {TABS.map((t) => (
              <TabsContent key={t.value} value={t.value}>
                {isLoading ? (
                  <TableSkeleton columns={4} />
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
