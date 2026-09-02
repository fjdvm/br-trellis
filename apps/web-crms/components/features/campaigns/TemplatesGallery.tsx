"use client";

import { useState } from "react";
import { LayoutTemplate } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTemplates } from "@/hooks/useTemplates";
import type { CampaignChannel, Template } from "@/types/campaign";

const CHANNELS: CampaignChannel[] = ["Email", "Banner", "Popup"];

/**
 * Read-only Templates gallery (#158). Lists the seeded, dev/business-curated
 * Templates grouped by Channel with a live preview per Template. There is no
 * create/edit/delete UI this round — Templates are not user-authorable.
 */
export function TemplatesGallery() {
  const { data: templates, isLoading, error } = useTemplates();
  const [channel, setChannel] = useState<CampaignChannel>("Email");

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg max-w-7xl mx-auto">
      <div className="space-y-sm">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>Marketing &amp; Campaigns</BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Templates</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-headline-md font-bold tracking-tight text-foreground">
          Content Templates
        </h1>
        <p className="text-body-md text-muted-foreground max-w-2xl">
          Browse the available pre-defined content templates for each channel.
        </p>
      </div>

      {error && <div className="p-md text-destructive text-base">{error.message}</div>}

      {isLoading ? (
        <div
          data-testid="templates-gallery-loading"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg"
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <Tabs value={channel} onValueChange={(v) => setChannel(v as CampaignChannel)}>
          <TabsList>
            {CHANNELS.map((c) => (
              <TabsTrigger key={c} value={c}>
                {c}
              </TabsTrigger>
            ))}
          </TabsList>

          {CHANNELS.map((c) => {
            const forChannel = templates.filter((t) => t.channel === c);
            return (
              <TabsContent key={c} value={c} className="mt-lg">
                {forChannel.length === 0 ? (
                  <div className="p-xl text-muted-foreground">
                    No templates available for this channel.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
                    {forChannel.map((t) => (
                      <TemplateCard key={t.id} template={t} />
                    ))}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
}

function TemplateCard({ template }: { template: Template }) {
  return (
    <Card className="shadow-none border-border overflow-hidden">
      <CardHeader className="pb-md p-lg flex flex-row items-start justify-between gap-2">
        <CardTitle className="text-title-lg font-bold flex items-center gap-2">
          <LayoutTemplate className="w-5 h-5" />
          {template.name}
        </CardTitle>
        <Badge variant="secondary">{template.channel}</Badge>
      </CardHeader>
      <CardContent className="p-lg pt-0 space-y-md">
        {template.description && (
          <p className="text-sm text-muted-foreground">{template.description}</p>
        )}
        {/* A sandboxed, non-interactive preview of the template's HTML content.
            Read-only: pointer events are disabled so the gallery is browse-only. */}
        <div
          data-testid={`template-preview-${template.id}`}
          className="border border-border rounded-md p-md bg-muted/30 max-h-56 overflow-auto pointer-events-none text-sm"
          dangerouslySetInnerHTML={{ __html: template.content }}
        />
      </CardContent>
    </Card>
  );
}
