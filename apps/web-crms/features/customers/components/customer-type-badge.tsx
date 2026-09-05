import React from "react";
import { Badge } from "@/components/ui/badge";

export function CustomerTypeBadge({ type }: { type: string }) {
  return <Badge variant="outline">{type}</Badge>;
}
