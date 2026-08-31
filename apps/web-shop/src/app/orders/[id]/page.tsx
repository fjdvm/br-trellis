import { OrderDetailPage } from "@/components/features/orders/OrderDetailPage";

export const metadata = {
  title: "Order Details | Bren Raphael's Ube Jam & Halaya",
  description: "View order details and track your delivery.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <OrderDetailPage orderId={id} />;
}
