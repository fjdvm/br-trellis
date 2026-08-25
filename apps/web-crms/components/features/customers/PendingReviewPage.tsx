import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CustomerIdentityTabs } from "@/components/features/customers/CustomerIdentityTabs";
import { PendingReviewTable } from "@/components/features/customers/PendingReviewTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PendingReviewPage() {
  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-2xl max-w-7xl mx-auto">
      <div>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="space-y-md">
        <div className="space-y-sm">
          <h1 className="text-headline-md font-bold tracking-tight text-foreground">
            Customers
          </h1>
          <p className="text-body-md text-muted-foreground">
            Review possible duplicate Customer identities without interrupting ingest.
          </p>
        </div>
        <CustomerIdentityTabs active="pending-review" />
      </div>

      <Card className="shadow-none border-border flex flex-col">
        <CardHeader className="pb-md p-lg">
          <CardTitle className="text-title-lg font-bold">Pending identity matches</CardTitle>
        </CardHeader>
        <CardContent className="py-md pt-0 overflow-x-auto">
          <PendingReviewTable />
        </CardContent>
      </Card>
    </div>
  );
}
