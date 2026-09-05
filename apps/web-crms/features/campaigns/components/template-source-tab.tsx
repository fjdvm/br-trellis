import React from "react";
import { Badge } from "@/components/ui/badge";
import { Layers } from "lucide-react";
import type { Template } from "@/features/campaigns/types";

interface TemplateSourceTabProps {
  template: Template;
  variables: string[];
}

export function TemplateSourceTab({ template, variables }: TemplateSourceTabProps) {
  return (
    <div className="space-y-4 text-left">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-primary" />
            Detected Template Variables ({variables.length})
          </h4>
        </div>
        {variables.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {variables.map((v) => (
              <Badge key={v} variant="outline" className="font-mono text-xs bg-muted/60 text-foreground border-border px-2 py-1">
                {"{{" + v + "}}"}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">No dynamic variables detected in this template content string.</p>
        )}
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-bold text-foreground">
          {template.format === "Blocks" ? "Configured Template Blocks" : "Raw Content String"}
        </h4>
        {template.format === "Blocks" ? (
          <div className="space-y-2">
            {(() => {
              try {
                const blocks = JSON.parse(template.content);
                if (Array.isArray(blocks)) {
                  return blocks.map((b: { label?: string; type: string }, idx: number) => (
                    <div key={idx} className="p-3 bg-muted/40 border border-border rounded-md text-xs flex items-center justify-between">
                      <span className="font-semibold text-foreground">{b.label || b.type}</span>
                      <Badge variant="outline" className="uppercase text-[10px]">{b.type}</Badge>
                    </div>
                  ));
                }
              } catch (e) {}
              return (
                <pre className="p-md bg-slate-950 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed border border-border">
                  {template.content}
                </pre>
              );
            })()}
          </div>
        ) : (
          <pre className="p-md bg-slate-950 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed border border-border">
            {template.content}
          </pre>
        )}
      </div>
    </div>
  );
}
