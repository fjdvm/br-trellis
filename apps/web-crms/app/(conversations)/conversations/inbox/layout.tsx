import { ConversationsInbox } from "@/features/conversations";

/**
 * Shared layout for the Conversations Inbox and its open-conversation route
 * (`/conversations/inbox` and `/conversations/inbox/[id]`).
 *
 * Rendering `ConversationsInbox` here — rather than inside each page — keeps the
 * split messenger view (the left worklist AND the right message thread) mounted
 * across navigations between `[id]` values. Selecting a conversation only pushes
 * a new `[id]`, which swaps the (empty) child `page`, not this layout, so the
 * inbox list and the thread's header/composer stay still; the message pane reads
 * the new id from the URL and reloads just its content. The `children` slot is
 * the matched page, kept in the tree so route transitions resolve normally.
 */
export default function InboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ConversationsInbox />
      {/* The matched page renders nothing visible; the layout owns the UI. */}
      <div hidden>{children}</div>
    </>
  );
}
