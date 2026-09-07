"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Calendar, Users } from "lucide-react";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { companiesApi } from "@/features/contacts/companies/services/companies-api";
import {
  TablePagination,
  useClientPagination,
} from "@/components/shared/table-pagination";
import { formatName } from "@/lib/format-display";
import type { CompanyListItem } from "@/features/contacts/types";
import { NewCompanySheet } from "@/features/contacts/companies/components/new-company-sheet";
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
        err instanceof Error ? err.message : "Unable to load companies.",
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
        <CardContent className="p-lg pt-0 space-y-md">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                {pagination.pageItems.map((company) => (
                  <Card
                    key={company.id}
                    className="shadow-none border border-border/70 hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer flex flex-col justify-between"
                    onClick={() =>
                      router.push(`/contacts/companies/${company.id}`)
                    }
                  >
                    <CardHeader className="p-md sm:p-lg pb-xs space-y-xs">
                      <div className="flex items-start justify-between gap-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center font-bold text-foreground shrink-0 border border-border">
                            <Building2 className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <CardTitle className="text-base font-bold">
                              <Link
                                href={`/contacts/companies/${company.id}`}
                                className="hover:underline text-foreground"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {formatName(company.name)}
                              </Link>
                            </CardTitle>
                            <Badge variant="secondary" className="mt-1">
                              {company.buyerType}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-md sm:p-lg pt-sm space-y-sm text-base">
                      <div className="flex items-center justify-between border-t border-border/60 pt-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5 text-base">
                          <Users className="w-4 h-4" />
                          Members
                        </span>
                        <span className="font-semibold text-foreground">
                          {company.memberCount}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          Created
                        </span>
                        <span>
                          {new Date(company.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <TablePagination pagination={pagination} itemLabel="companies" />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
