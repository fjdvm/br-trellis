export const metadata = {
  title: "Privacy Policy | Bren Raphael's Ube Jam & Halaya",
  description: "Privacy policy detailing how Bren Raphael's handles personal data and privacy.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen py-12 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="border-b border-border pb-6">
          <span className="text-xs font-bold uppercase tracking-widest text-primary block mb-2">
            Legal & Compliance
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
            Privacy Policy
          </h1>
          <p className="text-xs text-muted-foreground mt-2">
            Last updated: July 2026
          </p>
        </div>

        <div className="prose prose-slate max-w-none space-y-6 text-sm text-foreground/80 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us when placing an order, creating an account, subscribing to our newsletter, or contacting customer support. This includes your name, email address, phone number, shipping address, and payment information.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">2. How We Use Your Information</h2>
            <p>
              We use your personal information to process orders, fulfill shipments, communicate order updates, send marketing newsletters (if opted in), and improve our product offerings and online shopping experience.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">3. Information Sharing</h2>
            <p>
              We do not sell or rent your personal information to third parties. We share data only with trusted service providers necessary to operate our business, such as payment processors and courier services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">4. Data Security</h2>
            <p>
              We implement reasonable security measures to protect your personal information against unauthorized access, alteration, or disclosure.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">5. Contact Us</h2>
            <p>
              If you have questions regarding this Privacy Policy, please contact our support team.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
