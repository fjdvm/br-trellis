/**
 * Client-side variable substitution for Canned Reply bodies, run at the moment
 * a template is inserted into the composer (never server-side, never at send
 * time) — every supported value is already in the browser when composing.
 *
 * Supported variables (the only three, chosen because they're the values
 * actually available in the reply composer today):
 *  - `{{customer_name}}` → the ticket's linked contact name
 *  - `{{ticket_id}}`     → the ticket identifier in scope
 *  - `{{agent_name}}`    → the signed-in agent's name
 *
 * Missing-value fallback: if `{{customer_name}}` has no value (a ticket with no
 * linked contact), it resolves to the neutral word "there" (e.g.
 * "Hi {{customer_name}}," → "Hi there,") rather than leaving the raw
 * placeholder or blocking insertion. The other variables resolve to an empty
 * string when absent. Unknown `{{...}}` placeholders are left untouched.
 */
export interface CannedReplyVariables {
  customerName: string | null | undefined;
  ticketId: string | null | undefined;
  agentName: string | null | undefined;
}

const CUSTOMER_NAME_FALLBACK = "there";

export function substituteCannedReplyVariables(
  body: string,
  variables: CannedReplyVariables
): string {
  const customerName =
    variables.customerName && variables.customerName.trim().length > 0
      ? variables.customerName
      : CUSTOMER_NAME_FALLBACK;
  const ticketId = variables.ticketId ?? "";
  const agentName = variables.agentName ?? "";

  return body
    .replaceAll("{{customer_name}}", customerName)
    .replaceAll("{{ticket_id}}", ticketId)
    .replaceAll("{{agent_name}}", agentName);
}
