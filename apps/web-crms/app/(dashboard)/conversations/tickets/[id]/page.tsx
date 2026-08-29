import { BackButton } from "@/components/shared/BackButton";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Placeholder ticket detail page.
 *
 * This round (Conversations feature 1) ships the ticket *list* only. The
 * claim/status-transition, WaitingOn, and message-thread UI that will live on
 * this detail page arrive in later rounds (#64/#65/#66). This stub exists so
 * the list's row-click navigation lands on a real route instead of a dead link.
 */
export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg max-w-7xl mx-auto">
      <BackButton fallbackHref="/conversations/tickets" />
      <div className="space-y-sm">
        <h1 className="text-headline-md font-bold tracking-tight text-foreground">
          Ticket
        </h1>
        <p className="text-body-md text-muted-foreground">
          Ticket ID: {id}
        </p>
      </div>

      <Card className="shadow-none border-border">
        <CardContent className="p-lg">
          <div className="flex flex-col items-center justify-center py-2xl text-center">
            <Construction className="w-10 h-10 text-muted-foreground mb-md" />
            <p className="text-body-md font-medium text-foreground">
              Ticket detail coming in a later round
            </p>
            <p className="text-sm text-muted-foreground mt-xs">
              Claim, status changes, waiting-on, and the message thread will
              appear here as those features are built.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
