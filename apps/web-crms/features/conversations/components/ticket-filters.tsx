import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TicketStatus, TicketWaitingOn, TicketSource } from "@/features/conversations/types";

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

interface TicketFiltersProps {
  statusFilter: TicketStatus | "All";
  statusOptions: readonly (TicketStatus | "All")[];
  onStatusChange: (status: TicketStatus | "All") => void;
  waitingOnFilter: TicketWaitingOn | "All";
  onWaitingOnChange: (waitingOn: TicketWaitingOn | "All") => void;
  sourceFilter: TicketSource | "All";
  onSourceChange: (source: TicketSource | "All") => void;
  showSourceFilter: boolean;
}

export function TicketFilters({
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
    <div className="flex flex-wrap items-center gap-sm">
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
      {showSourceFilter && (
        <Select value={sourceFilter} onValueChange={(val) => onSourceChange(val as TicketSource | "All")}>
          <SelectTrigger className="w-full sm:w-[150px]" aria-label="Filter by source">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            {SOURCE_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option === "All" ? "All sources" : option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
