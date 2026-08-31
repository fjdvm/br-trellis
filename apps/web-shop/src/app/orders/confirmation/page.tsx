import { Suspense } from "react";
import { OrderConfirmationPage } from "@/components/features/orders/OrderConfirmationPage";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Order Confirmed | Bren Raphael's Ube Jam & Halaya",
  description: "Your order confirmation and summary.",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      }
    >
      <OrderConfirmationPage />
    </Suspense>
  );
}
