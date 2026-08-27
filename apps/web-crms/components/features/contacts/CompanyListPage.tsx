"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Loader2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { crmClient } from "@/lib/api/crm-client";
import type { CompanyListItem } from "@/types/company";
import Link from "next/link";

export function CompanyListPage() {
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const loadCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await crmClient.companies.list(showArchived);
      setCompanies(result);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load companies."
      );
    } finally {
      setIsLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-sm">
          <h1 className="text-headline-md font-bold tracking-tight text-foreground">
            Companies
          </h1>
          <p className="text-body-md text-muted-foreground">
            Manage business organizations affiliated with contacts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showArchived ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? "Hide Archived" : "Show Archived"}
          </Button>
        </div>
      </div>

      <Card className="shadow-none border-border">
        <CardHeader className="pb-md p-lg">
          <CardTitle className="text-title-lg font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            All Companies
          </CardTitle>
        </CardHeader>
        <CardContent className="p-lg pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-xl">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="p-xl text-destructive">{error}</div>
          ) : companies.length === 0 ? (
            <div className="p-xl text-muted-foreground">
              No companies found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[160px]">Name</TableHead>
                  <TableHead className="min-w-[120px]">Buyer Type</TableHead>
                  <TableHead className="min-w-[100px] text-right">Members</TableHead>
                  <TableHead className="min-w-[120px]">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="text-base font-medium">
                      <Link
                        href={`/contacts/companies/${company.id}`}
                        className="hover:underline text-primary"
                      >
                        {company.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-base">
                      <Badge variant="secondary">{company.buyerType}</Badge>
                    </TableCell>
                    <TableCell className="text-base text-right">
                      {company.memberCount}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(company.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
