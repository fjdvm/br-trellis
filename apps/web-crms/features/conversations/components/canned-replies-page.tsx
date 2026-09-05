"use client";

import { useCallback, useEffect, useState } from "react";
import { Archive, ArchiveRestore, MessageSquareText } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollableTable } from "@/components/shared/ScrollableTable";
import { crmClient } from "@/lib/api/crm-client";
import { useConversationsCanWrite } from "@/features/conversations/hooks/useConversationsCanWrite";
import { NewCannedCategorySheet } from "@/features/conversations/components/new-canned-category-sheet";
import { CannedReplySheet } from "@/features/conversations/components/canned-reply-sheet";
import type {
  CannedReplyCategoryListItem,
  CannedReplyListItem,
} from "@/features/campaigns/types";

/** Sentinel value for the "all categories" option in the filter Select. */
const ALL_CATEGORIES = "__all__";

/**
 * Canned Replies management screen (#111 + #112). Replaces the ComingSoonPage
 * stub at /conversations/canned-replies. A single list of shared, org-wide
 * Canned Replies with a category filter and an archived-items toggle.
 * Categories back the filter and the create/edit forms but aren't managed as
 * their own table here. Create/edit/archive/restore controls appear only for
 * agents with Conversations.canWrite (or SuperUser); everyone who can already
 * reach this route sees the read-only list.
 */
export function CannedRepliesPage() {
  const canWrite = useConversationsCanWrite();
  const [categories, setCategories] = useState<CannedReplyCategoryListItem[]>([]);
  const [replies, setReplies] = useState<CannedReplyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORIES);
  const [pendingArchive, setPendingArchive] = useState<CannedReplyListItem | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const categoryId = categoryFilter === ALL_CATEGORIES ? undefined : categoryFilter;
      const [cats, reps] = await Promise.all([
        crmClient.cannedReplyCategories.list(showArchived),
        crmClient.cannedReplies.list(showArchived, categoryId),
      ]);
      setCategories(cats);
      setReplies(reps);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load canned replies.");
    } finally {
      setIsLoading(false);
    }
  }, [showArchived, categoryFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  // Only active categories can receive new/edited replies (and populate the filter).
  const activeCategories = categories.filter((c) => c.deletedAt === null);

  async function restoreReply(id: string) {
    try {
      await crmClient.cannedReplies.restore(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore.");
    }
  }

  async function confirmArchive() {
    const pending = pendingArchive;
    setPendingArchive(null);
    if (!pending) return;
    try {
      await crmClient.cannedReplies.archive(pending.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive.");
    }
  }

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-sm">
          <h1 className="text-headline-md font-bold tracking-tight text-foreground">
            Canned Replies
          </h1>
          <p className="text-body-md text-muted-foreground">
            Shared, reusable reply templates organized by category.
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
          {canWrite && (
            <>
              <NewCannedCategorySheet onCreated={() => void load()} />
              <CannedReplySheet categories={activeCategories} onSaved={() => void load()} />
            </>
          )}
        </div>
      </div>

      {error && <div className="p-md text-destructive text-base">{error}</div>}

      <Card className="shadow-none border-border">
        <CardHeader className="pb-md p-lg flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-title-lg font-bold flex items-center gap-2">
            <MessageSquareText className="w-5 h-5" />
            Canned Replies
          </CardTitle>
          {/* Category filter — replaces the separate Categories table. */}
          <div className="w-[220px]">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger aria-label="Filter by category" className="text-base">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
                {activeCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-lg pt-0">
          {isLoading ? (
            <TableSkeleton columns={canWrite ? 4 : 3} />
          ) : replies.length === 0 ? (
            <div className="p-xl text-muted-foreground">No canned replies found.</div>
          ) : (
            <ScrollableTable>
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="min-w-[180px]">Name</TableHead>
                    <TableHead className="min-w-[140px]">Category</TableHead>
                    <TableHead className="min-w-[280px]">Body</TableHead>
                    {canWrite && <TableHead className="min-w-[200px] text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {replies.map((reply) => {
                    const isArchived = reply.deletedAt !== null;
                    return (
                      <TableRow key={reply.id}>
                        <TableCell className="text-base font-medium">
                          <span className="flex items-center gap-2">
                            {reply.name}
                            {isArchived && <Badge variant="destructive">Archived</Badge>}
                          </span>
                        </TableCell>
                        <TableCell className="text-base">
                          <Badge variant="secondary">{reply.categoryName}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[360px] truncate">
                          {reply.body}
                        </TableCell>
                        {canWrite && (
                          <TableCell className="text-right">
                            <span className="flex items-center justify-end gap-2">
                              {!isArchived && (
                                <CannedReplySheet
                                  categories={activeCategories}
                                  reply={reply}
                                  onSaved={() => void load()}
                                />
                              )}
                              {isArchived ? (
                                <Button variant="outline" size="sm" onClick={() => void restoreReply(reply.id)}>
                                  <ArchiveRestore className="w-4 h-4 mr-1" />
                                  Restore
                                </Button>
                              ) : (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setPendingArchive(reply)}
                                >
                                  <Archive className="w-4 h-4 mr-1" />
                                  Archive
                                </Button>
                              )}
                            </span>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollableTable>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={pendingArchive !== null}
        onOpenChange={(open) => !open && setPendingArchive(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Canned Reply</AlertDialogTitle>
            <AlertDialogDescription>
              Archive &quot;{pendingArchive?.name}&quot;? It will stop appearing in the
              insertion picker but its history is preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmArchive}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
