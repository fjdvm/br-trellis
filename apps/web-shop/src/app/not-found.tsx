import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home, ShoppingBag } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6 animate-pulse">
        <FileQuestion className="w-10 h-10" />
      </div>
      <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2 block">
        404 Error
      </span>
      <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground mb-4">
        Page Not Found
      </h1>
      <p className="text-muted-foreground text-sm max-w-md mb-8 leading-relaxed">
        Sorry, the page you are looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track to finding your favorite Ube Jam!
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild variant="default" className="rounded-xl font-bold bg-primary text-white hover:bg-primary-dark shadow-sm">
          <Link href="/">
            <Home className="w-4 h-4 mr-2" /> Return to Home
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-xl font-bold text-foreground border-border hover:bg-surface-low">
          <Link href="/products">
            <ShoppingBag className="w-4 h-4 mr-2" /> Browse Shop
          </Link>
        </Button>
      </div>
    </div>
  );
}
