export type InboxFilter = "All" | "Claimed" | "Ongoing" | "Read" | "Unread";

export const INBOX_FILTER_LABELS: Record<InboxFilter, string> = {
  All: "All",
  Claimed: "Claimed",
  Ongoing: "Ongoing",
  Read: "Read",
  Unread: "Unread",
};
