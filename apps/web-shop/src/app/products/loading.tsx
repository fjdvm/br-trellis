import { Loader2 } from "lucide-react";

export default function CatalogLoading() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="relative flex items-center justify-center p-4 rounded-full bg-primary/5 border border-primary/10">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
      <p className="text-sm font-bold text-primary uppercase tracking-wider animate-pulse">
        Loading Products...
      </p>
    </main>
  );
}
