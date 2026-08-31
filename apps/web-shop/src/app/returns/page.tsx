export const metadata = {
  title: "Return & Refund Policy | Bren Raphael's Ube Jam & Halaya",
  description: "Return and refund policy for artisanal perishable products at Bren Raphael's Ube Jam & Halaya.",
};

export default function ReturnsPage() {
  return (
    <main className="min-h-screen py-12 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="border-b border-border pb-6">
          <span className="text-xs font-bold uppercase tracking-widest text-primary block mb-2">
            Customer Care
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
            Return & Refund Policy
          </h1>
          <p className="text-xs text-muted-foreground mt-2">
            Last updated: July 2026
          </p>
        </div>

        <div className="prose prose-slate max-w-none space-y-6 text-sm text-foreground/80 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">1. Perishable Goods Policy</h2>
            <p>
              Due to the perishable nature of our artisanal Ube Jam and Halaya products, we cannot accept returns once products have been delivered.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">2. Damaged or Defective Items</h2>
            <p>
              If your shipment arrives damaged, unsealed, or compromised, please notify our customer support team within 24 hours of delivery. Please provide photos of the damaged container and packaging.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">3. Refunds & Replacements</h2>
            <p>
              Upon verification of a valid claim for damaged goods or fulfillment error, we will issue a full refund or send a fresh replacement jar at no additional cost.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">4. Order Cancellation</h2>
            <p>
              Orders may be cancelled within 2 hours of placement or before fulfillment processing begins. Once an order is handed to our courier partner, cancellations are no longer possible.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
