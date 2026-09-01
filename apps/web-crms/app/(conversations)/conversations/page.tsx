import { redirect } from "next/navigation";

/**
 * The Conversations section opens on its Inbox. `/conversations` itself carries
 * no view, so redirect to the nested Inbox route where the messenger lives.
 */
export default function Page() {
  redirect("/conversations/inbox");
}
