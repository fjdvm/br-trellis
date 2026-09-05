"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
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
import { companiesApi } from "@/features/contacts/services/companies-api";
import { ScrollableTable } from "@/components/shared/ScrollableTable";
import {
  TablePagination,
  useClientPagination,
} from "@/components/shared/TablePagination";
import { formatName } from "@/lib/format-display";
import type { CompanyListItem } from "@/features/contacts/types";
import { NewCompanySheet } from "@/features/contacts/components/new-company-sheet";
import Link from "next/link";

export function CompanyListPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const loadCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await companiesApi.list(showArchived);
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

  const pagination = useClientPagination(companies);

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg mx-auto">
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
          <NewCompanySheet onCreated={() => void loadCompanies()} />
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
            <TableSkeleton columns={4} />
          ) : error ? (
            <div className="p-xl text-destructive">{error}</div>
          ) : companies.length === 0 ? (
            <div className="p-xl text-muted-foreground">
              No companies found.
            </div>
          ) : (
            <>
            <ScrollableTable>
              <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="min-w-[160px]">Name</TableHead>
                  <TableHead className="min-w-[120px]">Buyer Type</TableHead>
                  <TableHead className="min-w-[100px] text-right">Members</TableHead>
                  <TableHead className="min-w-[120px]">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.pageItems.map((company) => (
                  <TableRow
                    key={company.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/contacts/companies/${company.id}`)}
                  >
                    <TableCell className="text-base font-medium">
                      <Link
                        href={`/contacts/companies/${company.id}`}
                        className="hover:underline text-primary"
                      >
                        {formatName(company.name)}
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
            </ScrollableTable>
            <TablePagination pagination={pagination} itemLabel="companies" />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
