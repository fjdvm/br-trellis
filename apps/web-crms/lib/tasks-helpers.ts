export function formatTimeAgo(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function getSeverityBadgeClass(severity: string) {
  switch (severity) {
    case "critical":
      return "bg-badge-destructive text-badge-destructive-foreground border-badge-destructive/30 font-bold";
    case "high":
      return "bg-badge-orange text-badge-orange-foreground border-badge-orange/30 font-semibold";
    case "medium":
      return "bg-badge-warning text-badge-warning-foreground border-badge-warning/30 font-medium";
    default:
      return "bg-badge-info text-badge-info-foreground border-badge-info/30 font-medium";
  }
}
