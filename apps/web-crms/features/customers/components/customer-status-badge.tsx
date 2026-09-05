import React from "react";
import { Badge } from "@/components/ui/badge";

export function CustomerStatusBadge({ status }: { status: string }) {
  const variant = status === "Active" ? "default" : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}
