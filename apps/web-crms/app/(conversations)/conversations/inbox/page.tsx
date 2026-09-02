/**
 * The Conversations Inbox with no conversation selected. The inbox UI itself is
 * rendered once by the shared `inbox/layout.tsx` so it persists across
 * navigations to `/conversations/inbox/[id]`; this page therefore renders
 * nothing — its only job is to match the `/conversations/inbox` route.
 */
export default function Page() {
  return null;
}
