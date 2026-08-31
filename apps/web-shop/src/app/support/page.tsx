import type { Metadata } from "next";
import { SupportClientPage } from "@/components/features/support/SupportClientPage";

export const metadata: Metadata = {
  title: "Customer Support | Bren Raphael's Ube Jam & Halaya Shop",
  description: "Get in touch with Bren Raphael's customer support team. Submit inquiries, requests, or complaints regarding your order or account.",
};

export default function SupportPage() {
  return (
    <div className="container mx-auto px-4 py-4">
      <SupportClientPage />
    </div>
  );
}
