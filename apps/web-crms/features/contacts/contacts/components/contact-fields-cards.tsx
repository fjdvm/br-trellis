import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Building2 } from "lucide-react";
import { formatName, formatEmail } from "@/lib/format-display";
import type { ContactDetail } from "@/features/contacts/types";

interface ContactCoreFieldsCardProps {
  contact: ContactDetail;
  isEditing: boolean;
  children?: React.ReactNode;
}

export function ContactCoreFieldsCard({
  contact,
  isEditing,
  children,
}: ContactCoreFieldsCardProps) {
  return (
    <Card className="shadow-none border-border">
      <CardHeader className="pb-md p-lg">
        <CardTitle className="text-title-lg font-bold">Core fields</CardTitle>
      </CardHeader>
      <CardContent className="space-y-md">
        {isEditing ? (
          children
        ) : (
          <div className="grid grid-cols-2 gap-md text-base">
            <div className="text-muted-foreground">Name</div>
            <div>{formatName(contact.name) ?? "—"}</div>
            <div className="text-muted-foreground">Email</div>
            <div>{formatEmail(contact.email) ?? "—"}</div>
            <div className="text-muted-foreground">Phone</div>
            <div>{contact.phone ?? "—"}</div>
            <div className="text-muted-foreground">Sentiment Score</div>
            <div>{contact.sentimentScore != null ? contact.sentimentScore : "—"}</div>
            <div className="text-muted-foreground">Lifetime Value</div>
            <div>{contact.lifetimeValue != null ? `$${contact.lifetimeValue.toFixed(2)}` : "$0.00"}</div>
          </div>
        )}

        {contact.company && (
          <>
            <Separator />
            <div className="flex items-center gap-sm text-base">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Company:</span>
              <span className="font-medium">{contact.company.name}</span>
            </div>
          </>
        )}

        {contact.sourceReferences.length > 0 && (
          <>
            <Separator />
            <div className="space-y-sm">
              <div className="text-base text-muted-foreground">Known sources</div>
              <div className="flex flex-wrap gap-sm">
                {contact.sourceReferences.map((ref) => (
                  <Badge key={`${ref.sourceSystem}:${ref.sourceId}`} variant="outline">
                    {ref.sourceSystem} · {ref.sourceId}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function ContactCustomFieldsCard({ contact }: { contact: ContactDetail }) {
  return (
    <Card className="shadow-none border-border">
      <CardHeader className="pb-md p-lg">
        <CardTitle className="text-title-lg font-bold">Custom fields</CardTitle>
      </CardHeader>
      <CardContent>
        {contact.customFields.length === 0 ? (
          <div className="text-base text-muted-foreground">No custom fields defined.</div>
        ) : (
          <div className="grid grid-cols-2 gap-md text-base">
            {contact.customFields.map((field) => (
              <div key={field.definitionId} className="contents">
                <div className="text-muted-foreground">{field.name}</div>
                <div>{renderFieldValue(field)}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function renderFieldValue(field: ContactDetail["customFields"][number]): string {
  if (field.selectedOption) return field.selectedOption.label;
  if (field.textValue != null) return field.textValue;
  if (field.numberValue != null) return String(field.numberValue);
  if (field.dateValue != null) return new Date(field.dateValue).toLocaleDateString();
  if (field.boolValue != null) return field.boolValue ? "Yes" : "No";
  return "—";
}
