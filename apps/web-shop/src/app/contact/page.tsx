import type { Metadata } from "next";
import { MessageSquare, Phone } from "lucide-react";
import { ContactForm } from "@/components/features/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact Support | Bren Raphael's Ube Jam & Halaya Shop",
  description: "Submit a support ticket or get in touch with our artisanal care team.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-surface py-[120px] px-5 md:px-[64px]">
      <main className="max-w-3xl mx-auto w-full">
        {/* Header */}
        <div className="mb-12 text-center md:text-left">
          <h1 className="font-serif text-primary text-3xl md:text-5xl font-normal mb-4">
            <span className="hidden md:inline">Submit a Ticket</span>
            <span className="inline md:hidden block text-center">Contact Support</span>
          </h1>
          <p className="body-lg text-on-surface-variant max-w-xl">
            We&apos;re here to help. Please provide details about your issue below, and our support team will get back to you shortly.
          </p>
        </div>

        {/* Form Card */}
        <ContactForm />

        {/* Immediate Assistance Section */}
        <div className="mt-12 text-center space-y-4">
          <p className="body-md text-on-surface-variant font-medium">Need immediate assistance?</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="#chat"
              className="inline-flex items-center gap-2 px-6 py-3 border border-outline-variant bg-surface text-primary font-sans text-sm font-semibold hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-2xs"
            >
              <MessageSquare className="w-4 h-4" />
              Live Chat
            </a>
            <a
              href="tel:+639171234567"
              className="inline-flex items-center gap-2 px-6 py-3 border border-outline-variant bg-surface text-primary font-sans text-sm font-semibold hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-2xs"
            >
              <Phone className="w-4 h-4" />
              Call Us
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
