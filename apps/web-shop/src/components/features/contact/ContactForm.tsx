"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import { useSession } from "next-auth/react";
import { ReceiptText, Mail, ChevronDown, Upload, ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api/api-client";

export function ContactForm() {
  const { data: session } = useSession();

  const sessionEmail = session?.user?.email || "";

  const [formData, setFormData] = useState({
    orderRef: "#UBE-10492",
    email: "",
    category: "",
    message: "",
  });
  const [lastSyncedEmail, setLastSyncedEmail] = useState("");

  // Sync email from session when it becomes available (React pattern: derive state from props)
  if (sessionEmail && sessionEmail !== lastSyncedEmail) {
    setLastSyncedEmail(sessionEmail);
    setFormData((prev) => ({ ...prev, email: sessionEmail }));
  }

  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.email || !formData.category || !formData.message) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post("/contact", {
        orderRef: formData.orderRef,
        email: formData.email,
        category: formData.category,
        message: formData.message,
      });
      setIsSuccess(true);
      setFormData({ orderRef: "#UBE-10492", email: session?.user?.email || "", category: "", message: "" });
      setFile(null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to submit ticket. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-surface-container p-8 md:p-12 shadow-xs border border-outline-variant/20 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary mb-3" />
        <h3 className="font-serif font-bold text-2xl text-primary">Ticket Submitted!</h3>
        <p className="mt-2 body-md text-on-surface-variant max-w-md mx-auto">
          Thank you for reaching out. Our support team has received your ticket and will respond to your email address shortly.
        </p>
        <button
          onClick={() => setIsSuccess(false)}
          className="mt-6 px-8 py-3 bg-primary text-white rounded-full font-sans text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Submit Another Ticket
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface-container p-8 md:p-12 shadow-xs border border-outline-variant/20 relative overflow-hidden">
      {/* Decorative background blob */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-fixed-dim/20 blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-6">
        {errorMessage && (
          <div className="flex items-center gap-2 border border-error/20 bg-error-container p-4 text-xs text-on-error-container">
            <AlertCircle className="h-4 w-4 shrink-0 text-error" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order Reference */}
          <div className="flex flex-col gap-2">
            <label className="label-upper text-on-surface-variant" htmlFor="orderRef">
              Order Reference
            </label>
            <div className="relative">
              <ReceiptText className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
              <input
                id="orderRef"
                type="text"
                value={formData.orderRef}
                onChange={(e) => setFormData({ ...formData, orderRef: e.target.value })}
                className="w-full pl-12 pr-4 py-4 bg-surface border border-outline-variant text-on-surface body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <label className="label-upper text-on-surface-variant" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
              <input
                id="email"
                type="email"
                required
                placeholder="hello@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-12 pr-4 py-4 bg-surface border border-outline-variant text-on-surface body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Subject Category */}
        <div className="flex flex-col gap-2">
          <label className="label-upper text-on-surface-variant" htmlFor="category">
            Subject Category
          </label>
          <div className="relative">
            <select
              id="category"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-4 bg-surface border border-outline-variant text-on-surface body-md appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-2xs pr-12 cursor-pointer"
            >
              <option value="" disabled>
                Select an issue category
              </option>
              <option value="order_issue">Order Issue / Status</option>
              <option value="return_exchange">Return / Exchange</option>
              <option value="product_inquiry">Product Inquiry</option>
              <option value="billing">Billing Issue</option>
              <option value="other">Other</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none w-5 h-5" />
          </div>
        </div>

        {/* Message */}
        <div className="flex flex-col gap-2">
          <label className="label-upper text-on-surface-variant" htmlFor="message">
            Message
          </label>
          <textarea
            id="message"
            required
            rows={5}
            placeholder="Please describe your issue in detail..."
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full px-5 py-4 .5rem] bg-surface border border-outline-variant text-on-surface body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-2xs resize-y min-h-[120px]"
          />
        </div>

        {/* File Upload */}
        <div className="flex flex-col gap-2">
          <label className="label-upper text-on-surface-variant">Attachments (Optional)</label>
          <div className="border-2 border-dashed border-outline-variant .5rem] p-6 text-center hover:bg-surface-variant/50 transition-colors cursor-pointer group">
            <input
              id="fileUpload"
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-surface-container-highest flex items-center justify-center text-primary group-hover:bg-primary-fixed transition-colors">
                <Upload className="w-5 h-5" />
              </div>
              <span className="font-sans text-sm font-semibold text-primary">
                {file ? file.name : "Click to upload files"}
              </span>
              <span className="body-md text-on-surface-variant text-sm">PNG, JPG, or PDF up to 10MB</span>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 text-white font-sans text-sm font-semibold py-4 px-8 rounded-full shadow-xs hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Ticket
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
