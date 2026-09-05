import { PendingReviewTable } from "@/features/customers/components/pending-review-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PendingReviewPage() {
  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg mx-auto">
      <div className="space-y-sm">
        <h1 className="text-headline-md font-bold tracking-tight text-foreground">
          Pending Review
        </h1>
        <p className="text-body-md text-muted-foreground">
          Review possible duplicate customer identities without interrupting ingest.
        </p>
      </div>

      <Card className="shadow-none border-border">
        <CardHeader className="pb-md p-lg">
          <CardTitle className="text-title-lg font-bold">Pending identity matches</CardTitle>
        </CardHeader>
        <CardContent className="p-lg pt-0">
          <PendingReviewTable />
        </CardContent>
      </Card>
    </div>
  );
}
