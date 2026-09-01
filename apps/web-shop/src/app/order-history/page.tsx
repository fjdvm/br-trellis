import { OrderHistoryPage } from "@/components/features/order-history/OrderHistoryPage";

export const metadata = {
  title: "Order History | Bren Raphael's Ube Jam & Halaya",
  description:
    "A detailed record of your orders — statuses, recipients, payments, and totals.",
};

export default function Page() {
  return <OrderHistoryPage />;
}
