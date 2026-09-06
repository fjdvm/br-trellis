"use client";

import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ContactDetail } from "@/features/contacts/types";

interface ContactTimelineCardProps {
  entries: ContactDetail["timelineEntries"];
}

export function ContactTimelineCard({ entries }: ContactTimelineCardProps) {
  return (
    <Card className="shadow-none border-border">
      <CardHeader className="pb-md p-lg">
        <CardTitle className="text-title-lg font-bold">Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-xl text-center">
            <Clock className="w-10 h-10 text-muted-foreground mb-md" />
            <p className="text-base text-muted-foreground">
              No activity recorded yet. Events from connected modules will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-md">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-start gap-md border-l-2 border-border pl-md">
                <div className="flex-1">
                  <div className="text-base font-medium">{entry.summary}</div>
                  <div className="text-sm text-muted-foreground">
                    {entry.sourceModule} · {entry.entryType} · {new Date(entry.occurredAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
