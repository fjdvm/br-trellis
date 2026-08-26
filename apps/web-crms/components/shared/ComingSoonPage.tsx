import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ComingSoonPageProps {
  title: string;
  description?: string;
}

export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg max-w-7xl mx-auto">
      <div className="space-y-sm">
        <h1 className="text-headline-md font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-body-md text-muted-foreground">{description}</p>
        )}
      </div>

      <Card className="shadow-none border-border">
        <CardContent className="p-lg">
          <div className="flex flex-col items-center justify-center py-2xl text-center">
            <Construction className="w-10 h-10 text-muted-foreground mb-md" />
            <p className="text-body-md font-medium text-foreground">
              Coming Soon
            </p>
            <p className="text-sm text-muted-foreground mt-xs max-w-md">
              This section is under development. Check back later.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
