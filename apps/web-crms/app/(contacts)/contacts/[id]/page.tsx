"use client";

import { useParams } from "next/navigation";
import { ContactDetailPage } from "@/components/features/contacts/ContactDetailPage";

export default function Page() {
  const params = useParams();
  const contactId = params.id as string;
  return <ContactDetailPage contactId={contactId} />;
}
