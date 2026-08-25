import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ContactTabs } from "@/components/features/contacts/ContactTabs";
import { ContactListTable } from "@/components/features/contacts/ContactListTable";
import { AddContactSheet } from "@/components/features/contacts/AddContactSheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ContactListPage() {
  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-2xl max-w-7xl mx-auto">
      <div className="hidden sm:block">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
        <div className="space-y-sm">
          <h1 className="text-headline-md font-bold tracking-tight text-foreground">
            Contacts
          </h1>
          <p className="text-body-md text-muted-foreground">
            View unified contact profiles and the source systems they are known from.
          </p>
        </div>
        <AddContactSheet onCreated={() => window.location.reload()} />
      </div>

      <ContactTabs active="contacts" />

      <Card className="shadow-none border-border flex flex-col">
        <CardHeader className="pb-md p-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
          <CardTitle className="text-title-lg font-bold">Contact registry</CardTitle>
        </CardHeader>
        <CardContent className="py-md pt-0 overflow-x-auto">
          <ContactListTable />
        </CardContent>
      </Card>
    </div>
  );
}
