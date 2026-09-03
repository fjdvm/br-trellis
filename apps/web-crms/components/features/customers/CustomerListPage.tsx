import { CustomerListTable } from "@/components/features/customers/CustomerListTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CustomerListPage() {
  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg mx-auto">
      <div className="space-y-sm">
        <h1 className="text-headline-md font-bold tracking-tight text-foreground">
          Customers
        </h1>
        <p className="text-body-md text-muted-foreground">
          Unified customer profiles and source system origins.
        </p>
      </div>

      <Card className="shadow-none border-border">
        <CardHeader className="pb-md p-lg">
          <CardTitle className="text-title-lg font-bold">Customer registry</CardTitle>
        </CardHeader>
        <CardContent className="p-lg pt-0">
          <CustomerListTable />
        </CardContent>
      </Card>
    </div>
  );
}
