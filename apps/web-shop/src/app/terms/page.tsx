export const metadata = {
  title: "Terms of Service | Bren Raphael's Ube Jam & Halaya",
  description: "Terms of service and user agreements for Bren Raphael's Ube Jam & Halaya online store.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen py-12 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="border-b border-border pb-6">
          <span className="text-xs font-bold uppercase tracking-widest text-primary block mb-2">
            Legal & Compliance
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
            Terms of Service
          </h1>
          <p className="text-xs text-muted-foreground mt-2">
            Last updated: July 2026
          </p>
        </div>

        <div className="prose prose-slate max-w-none space-y-6 text-sm text-foreground/80 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">1. Introduction</h2>
            <p>
              Welcome to Bren Raphael&apos;s Ube Jam & Halaya Shop. By accessing or using our website and purchasing our artisanal products, you agree to be bound by these Terms of Service. Please read them carefully.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">2. Products & Orders</h2>
            <p>
              All products are subject to availability. Because our Ube Jam and Halaya are handcrafted in small batches using premium purple yam, batch quantities are limited. We reserve the right to limit the quantity of items purchased per customer or order.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">3. Pricing & Payment</h2>
            <p>
              Prices for our products are subject to change without notice. Payments must be rendered in full at the time of placing an order through our supported payment gateways.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">4. Shipping & Perishable Product Handling</h2>
            <p>
              Our Ube products contain real dairy and zero artificial preservatives. Customers are responsible for ensuring someone is available to receive delivery and immediately refrigerate the products upon arrival to maintain freshness.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">5. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the Republic of the Philippines.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
