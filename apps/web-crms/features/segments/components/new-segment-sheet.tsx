"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { segmentsApi } from "../services/segments-api";
import type { SegmentListItem } from "../types/segment";

interface NewSegmentSheetProps {
  /** Called after a segment is successfully created or updated. */
  onCreated?: () => void;
  segmentToEdit?: SegmentListItem | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NewSegmentSheet({
  onCreated,
  segmentToEdit,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: NewSegmentSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (next: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(next);
    } else {
      setInternalOpen(next);
    }
  };

  const [name, setName] = useState(segmentToEdit?.name ?? "");
  const [type, setType] = useState<"Static" | "Dynamic">((segmentToEdit?.type as any) ?? "Dynamic");
  const [matchMode, setMatchMode] = useState<"MatchAll" | "MatchAny">(
    (segmentToEdit?.rule?.matchMode as any) ?? "MatchAll"
  );
  const [ruleField, setRuleField] = useState(
    segmentToEdit?.rule?.conditions?.[0]?.field ?? "LifetimeValue"
  );
  const [ruleOperator, setRuleOperator] = useState(
    segmentToEdit?.rule?.conditions?.[0]?.operator ?? "greater_than"
  );
  const [ruleValue, setRuleValue] = useState(
    segmentToEdit?.rule?.conditions?.[0]?.value ?? "1000"
  );

  const [nameError, setNameError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (segmentToEdit) {
      setName(segmentToEdit.name);
      setType((segmentToEdit.type as any) ?? "Dynamic");
      setMatchMode((segmentToEdit.rule?.matchMode as any) ?? "MatchAll");
      setRuleField(segmentToEdit.rule?.conditions?.[0]?.field ?? "LifetimeValue");
      setRuleOperator(segmentToEdit.rule?.conditions?.[0]?.operator ?? "greater_than");
      setRuleValue(segmentToEdit.rule?.conditions?.[0]?.value ?? "1000");
    }
  }, [segmentToEdit]);

  function resetForm() {
    setName("");
    setType("Dynamic");
    setMatchMode("MatchAll");
    setRuleField("LifetimeValue");
    setRuleOperator("greater_than");
    setRuleValue("1000");
    setNameError(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Segment name is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const rulePayload =
      type === "Dynamic"
        ? {
            matchMode,
            conditions: [
              {
                field: ruleField,
                operator: ruleOperator,
                value: ruleValue,
              },
            ],
          }
        : null;

    try {
      if (segmentToEdit) {
        await segmentsApi.update(segmentToEdit.id, {
          name: trimmed,
          type,
          rule: rulePayload,
        });
      } else {
        await segmentsApi.create({
          name: trimmed,
          type,
          rule: rulePayload,
        });
      }
      resetForm();
      setOpen(false);
      onCreated?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : segmentToEdit
          ? "Failed to update segment."
          : "Failed to create segment."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      {!isControlled && (
        <SheetTrigger asChild>
          <Button size="sm" className="flex items-center justify-center">
            <Plus className="w-4 h-4" />
            <span>Add Segment</span>
          </Button>
        </SheetTrigger>
      )}
      <SheetContent className="flex flex-col h-full">
        <SheetHeader className="pb-4">
          <SheetTitle>{segmentToEdit ? "Edit Segment" : "Add Segment"}</SheetTitle>
          <SheetDescription>
            {segmentToEdit
              ? "Update segment details and rule criteria."
              : "Create a customer segment for targeting and audience grouping."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 gap-6 overflow-y-auto"
        >
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="segment-name">Segment Name *</Label>
              <Input
                id="segment-name"
                placeholder="e.g. VIP Customers"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError(null);
                }}
                autoFocus
                aria-invalid={!!nameError}
                className={nameError ? "border-destructive" : ""}
              />
              {nameError && (
                <p className="text-xs text-destructive">{nameError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="segment-type">Segment Type</Label>
              <Select value={type} onValueChange={(val) => setType(val as "Static" | "Dynamic")}>
                <SelectTrigger id="segment-type" aria-label="Segment type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dynamic">Dynamic (Rule-based)</SelectItem>
                  <SelectItem value="Static">Static (Manual)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {type === "Dynamic" && (
              <div className="p-md border border-border rounded-lg space-y-md bg-muted/30">
                <p className="text-sm font-semibold text-foreground">Rule Criteria</p>

                <div className="space-y-2">
                  <Label htmlFor="match-mode">Match Mode</Label>
                  <Select
                    value={matchMode}
                    onValueChange={(val) => setMatchMode(val as "MatchAll" | "MatchAny")}
                  >
                    <SelectTrigger id="match-mode" aria-label="Match mode">
                      <SelectValue placeholder="Match mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MatchAll">Match All Conditions</SelectItem>
                      <SelectItem value="MatchAny">Match Any Condition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rule-field">Target Field</Label>
                  <Select value={ruleField} onValueChange={setRuleField}>
                    <SelectTrigger id="rule-field" aria-label="Target field">
                      <SelectValue placeholder="Target field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LifetimeValue">Lifetime Value</SelectItem>
                      <SelectItem value="SentimentScore">Sentiment Score</SelectItem>
                      <SelectItem value="Status">Contact Status</SelectItem>
                      <SelectItem value="BuyerType">Buyer Type</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rule-operator">Operator</Label>
                  <Select value={ruleOperator} onValueChange={setRuleOperator}>
                    <SelectTrigger id="rule-operator" aria-label="Operator">
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="greater_than">Greater than</SelectItem>
                      <SelectItem value="less_than">Less than</SelectItem>
                      <SelectItem value="equals">Equals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rule-value">Value</Label>
                  <Input
                    id="rule-value"
                    placeholder="e.g. 1000"
                    value={ruleValue}
                    onChange={(e) => setRuleValue(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <SheetFooter className="mt-auto pt-4 border-t border-border">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              {isSubmitting
                ? segmentToEdit
                  ? "Saving…"
                  : "Creating…"
                : segmentToEdit
                ? "Save Changes"
                : "Create Segment"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
