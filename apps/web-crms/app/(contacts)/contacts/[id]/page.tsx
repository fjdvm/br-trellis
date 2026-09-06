"use client";

import { useParams } from "next/navigation";
import { ContactDetailPage } from "@/features/contacts/contacts/components/contact-detail-page";

export default function Page() {
  const params = useParams();
  const contactId = params.id as string;
  return <ContactDetailPage contactId={contactId} />;
}
