import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TicketStatus, TicketWaitingOn, TicketSource } from "@/features/tickets";

const WAITING_ON_OPTIONS: readonly (TicketWaitingOn | "All")[] = [
  "All",
  "Agent",
  "Customer",
  "None",
];

const SOURCE_OPTIONS: readonly (TicketSource | "All")[] = [
  "All",
  "Manual",
  "Ecommerce",
];

export type PrimaryViewOption = "All" | "Urgent" | "Closed";

interface TicketFiltersProps {
  viewFilter?: PrimaryViewOption;
  onViewChange?: (view: PrimaryViewOption) => void;
  statusFilter: TicketStatus | "All";
  statusOptions: readonly (TicketStatus | "All")[];
  onStatusChange: (status: TicketStatus | "All") => void;
  waitingOnFilter: TicketWaitingOn | "All";
  onWaitingOnChange: (waitingOn: TicketWaitingOn | "All") => void;
  sourceFilter: TicketSource | "All";
  onSourceChange: (source: TicketSource | "All") => void;
  showSourceFilter: boolean;
}

interface TicketFiltersSourceTabsProps {
  sourceFilter: TicketSource | "All";
  onSourceChange: (source: TicketSource | "All") => void;
}

export function TicketFiltersSourceTabs({
  sourceFilter,
  onSourceChange,
}: TicketFiltersSourceTabsProps) {
  return (
    <Tabs
      value={sourceFilter}
      onValueChange={(val) => onSourceChange(val as TicketSource | "All")}
    >
      <TabsList aria-label="Filter by source">
        {SOURCE_OPTIONS.map((option) => (
          <TabsTrigger key={option} value={option}>
            {option}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

export function TicketFilters({
  viewFilter,
  onViewChange,
  statusFilter,
  statusOptions,
  onStatusChange,
  waitingOnFilter,
  onWaitingOnChange,
  sourceFilter,
  onSourceChange,
  showSourceFilter,
}: TicketFiltersProps) {
  return (
    <div className="w-full flex flex-col gap-sm">
      <div className="flex flex-wrap items-center justify-start sm:justify-end gap-sm">
        {viewFilter && onViewChange && (
          <Select
            value={viewFilter}
            onValueChange={(val) => onViewChange(val as PrimaryViewOption)}
          >
            <SelectTrigger className="w-full sm:w-[220px]" aria-label="View filter">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Urgent">Urgent (default)</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Select value={statusFilter} onValueChange={(val) => onStatusChange(val as TicketStatus | "All")}>
          <SelectTrigger className="w-full sm:w-[160px]" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option === "All" ? "All statuses" : option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={waitingOnFilter} onValueChange={(val) => onWaitingOnChange(val as TicketWaitingOn | "All")}>
          <SelectTrigger className="w-full sm:w-[170px]" aria-label="Filter by waiting on">
            <SelectValue placeholder="Waiting On" />
          </SelectTrigger>
          <SelectContent>
            {WAITING_ON_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option === "All" ? "All (waiting on)" : option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {showSourceFilter && (
        <div className="flex justify-start">
          <TicketFiltersSourceTabs
            sourceFilter={sourceFilter}
            onSourceChange={onSourceChange}
          />
        </div>
      )}
    </div>
  );
}
