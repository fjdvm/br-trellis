/**
 * A single open conversation (`/conversations/inbox/[id]`). The inbox UI —
 * including the open message thread — is rendered once by the shared
 * `inbox/layout.tsx`, which reads the selected id from the URL. Keeping that
 * layout mounted across `[id]` navigations is what stops the whole screen from
 * reloading when another conversation is opened, so this page renders nothing.
 */
export default function Page() {
  return null;
}
