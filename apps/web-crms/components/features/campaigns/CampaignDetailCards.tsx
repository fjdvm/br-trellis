import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CampaignChannelBadge } from "@/components/features/campaigns/CampaignChannelBadge";
import type {
  CampaignAnalytics,
  CampaignChannelContent,
  CampaignDispatchResult,
} from "@/types/campaign";

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

// The top metadata summary card shown across all detail states: audience,
// total recipients, created date, and last activity.
export function CampaignMetaSummary({
  segmentName,
  recipientCount,
  additionalEmails,
  createdAt,
  updatedAt,
}: {
  segmentName: string | null;
  recipientCount: number;
  additionalEmails?: string[];
  createdAt: string;
  updatedAt?: string | null;
}) {
  return (
    <Card className="shadow-none border-border">
      <CardContent className="p-lg space-y-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
          <MetaItem label="Audience Segment" value={segmentName ?? "No segment"} />
          <MetaItem label="Total Recipients" value={`${recipientCount.toLocaleString()} contacts`} />
          <MetaItem label="Created" value={formatDate(createdAt)} />
          <MetaItem label="Last Activity" value={formatDate(updatedAt)} />
        </div>
        {additionalEmails && additionalEmails.length > 0 && (
          <div className="pt-md border-t border-border text-base">
            <span className="text-muted-foreground">Additional emails: </span>
            {additionalEmails.join(", ")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-title-lg font-semibold text-foreground truncate">{value}</span>
    </div>
  );
}

// A single configured-channel content card (subject/heading/body/links).
export function ChannelContentCard({ content }: { content: CampaignChannelContent }) {
  return (
    <Card className="shadow-none border-border">
      <CardHeader className="p-lg pb-md flex flex-row items-center gap-2">
        <CardTitle className="text-title-lg font-bold">Content</CardTitle>
        <CampaignChannelBadge channel={content.channel} />
      </CardHeader>
      <CardContent className="p-lg pt-0 space-y-sm text-base">
        {content.subject && (
          <div>
            <span className="text-muted-foreground">Subject: </span>
            {content.subject}
          </div>
        )}
        {content.heading && (
          <div>
            <span className="text-muted-foreground">Heading: </span>
            {content.heading}
          </div>
        )}
        {content.body && <p className="whitespace-pre-wrap">{content.body}</p>}
        {content.imageUrl && (
          <div className="text-sm text-muted-foreground">Image: {content.imageUrl}</div>
        )}
        {content.linkUrl && (
          <div className="text-sm text-muted-foreground">Link: {content.linkUrl}</div>
        )}
        {content.ctaText && (
          <div className="text-sm text-muted-foreground">
            CTA: {content.ctaText} → {content.ctaUrl ?? "—"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Dispatch outcome (recipients / sent / failed + errors).
export function DispatchResultCard({ result }: { result: CampaignDispatchResult }) {
  return (
    <Card className="shadow-none border-border">
      <CardHeader className="p-lg pb-md">
        <CardTitle className="text-title-lg font-bold">Dispatch Result</CardTitle>
      </CardHeader>
      <CardContent className="p-lg pt-0 space-y-sm text-base">
        <div className="flex flex-wrap gap-lg">
          <div>
            <span className="text-muted-foreground">Recipients: </span>
            {result.totalRecipients}
          </div>
          <div>
            <span className="text-muted-foreground">Sent: </span>
            {result.sentCount}
          </div>
          <div>
            <span className="text-muted-foreground">Failed: </span>
            {result.failedCount}
          </div>
        </div>
        {result.errors.length > 0 && (
          <ul className="text-sm text-destructive list-disc pl-5">
            {result.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// Engagement analytics (open/click rates + link performance).
export function AnalyticsCard({ analytics }: { analytics: CampaignAnalytics }) {
  return (
    <Card className="shadow-none border-border">
      <CardHeader className="p-lg pb-md">
        <CardTitle className="text-title-lg font-bold">Engagement Analytics</CardTitle>
      </CardHeader>
      <CardContent className="p-lg pt-0 space-y-md text-base">
        <div className="flex flex-wrap gap-lg">
          <div>
            <span className="text-muted-foreground">Open Rate: </span>
            {analytics.openRate}%
          </div>
          <div>
            <span className="text-muted-foreground">Click Rate: </span>
            {analytics.clickRate}%
          </div>
          <div>
            <span className="text-muted-foreground">Opened: </span>
            {analytics.openedCount}
          </div>
          <div>
            <span className="text-muted-foreground">Clicked: </span>
            {analytics.clickedCount}
          </div>
        </div>
        {analytics.linkPerformance.length > 0 && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Link performance</p>
            <ul className="text-sm space-y-1">
              {analytics.linkPerformance.map((l) => (
                <li key={l.destinationUrl} className="flex justify-between gap-4">
                  <span className="truncate">{l.destinationUrl}</span>
                  <span className="text-muted-foreground whitespace-nowrap">
                    {l.totalClicks} clicks ({l.shareOfTotalClicks}%)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
