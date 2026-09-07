import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionButtonProps {
  label: string;
  icon: LucideIcon;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
  variant?: "default" | "outline" | "destructive";
}

export function ActionButton({
  label,
  icon: Icon,
  loading,
  disabled,
  onClick,
  variant = "default",
}: ActionButtonProps) {
  return (
    <Button variant={variant} size="sm" onClick={onClick} disabled={disabled}>
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Icon className="w-4 h-4" />
      )}
      <span className="ml-1">{label}</span>
    </Button>
  );
}
