"use client";

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
import type { CampaignListItem } from "@/types/campaign";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export function CampaignTable({ campaigns }: { campaigns: CampaignListItem[] }) {
  const router = useRouter();

  if (campaigns.length === 0) {
    return <div className="p-xl text-muted-foreground">No campaigns found.</div>;
  }

  return (
    <ScrollableTable>
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead className="min-w-[220px]">Title</TableHead>
            <TableHead className="min-w-[160px]">Channels</TableHead>
            <TableHead className="min-w-[120px]">Status</TableHead>
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
