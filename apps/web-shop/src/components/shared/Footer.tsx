"use client";

import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-tertiary text-white mt-auto py-16 border-t border-outline-variant/30">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand story */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.jpeg"
              alt="Bren Raphael's Logo"
              width={36}
              height={36}
              className="w-9 h-9 object-cover shadow-xs border border-on-tertiary/20"
            />
            <div>
              <span className="font-serif font-bold text-lg text-on-tertiary block leading-none">
                Bren Raphael&apos;s
              </span>
              <span className="font-sans text-[10px] uppercase tracking-[0.15em] font-bold text-tertiary-fixed-dim">
                Ube Jam & Halaya
              </span>
            </div>
          </div>
          <p className="font-sans text-sm text-on-tertiary/80 leading-relaxed">
            Artisanal Filipino Ube Jam & Halaya handcrafted with authentic purple yam and traditional heritage recipes.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-sans text-xs uppercase tracking-[0.15em] font-bold text-tertiary-fixed-dim mb-4">
            Quick Links
          </h4>
          <ul className="space-y-3 font-sans text-sm text-on-tertiary/80">
            <li>
              <Link href="/products" className="hover:text-tertiary-fixed-dim transition-colors">
                All Products
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-tertiary-fixed-dim transition-colors">
                FAQ
              </Link>
            </li>
            <li>
              <Link href="/careers" className="hover:text-tertiary-fixed-dim transition-colors">
                Careers
              </Link>
            </li>
          </ul>
        </div>

        {/* Customer Service & Legal */}
        <div>
          <h4 className="font-sans text-xs uppercase tracking-[0.15em] font-bold text-tertiary-fixed-dim mb-4">
            Customer Service & Legal
          </h4>
          <ul className="space-y-3 font-sans text-sm text-on-tertiary/80">
            <li>
              <Link href="/support" className="hover:text-tertiary-fixed-dim transition-colors">
                Support Center
              </Link>
            </li>
            <li>
              <Link href="/returns" className="hover:text-tertiary-fixed-dim transition-colors">
                Return & Refund Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-tertiary-fixed-dim transition-colors">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-tertiary-fixed-dim transition-colors">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>

        {/* Newsletter Signup */}
        <div>
          <h4 className="font-sans text-xs uppercase tracking-[0.15em] font-bold text-tertiary-fixed-dim mb-4">
            Newsletter
          </h4>
          <p className="font-sans text-sm text-on-tertiary/80 mb-4 leading-relaxed">
            Subscribe for fresh batch announcements and special artisanal offers.
          </p>
          <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
            <input
              type="email"
              placeholder="Your email address"
              className="px-4 py-2.5 text-xs border border-on-tertiary/20 bg-tertiary-container/40 text-on-tertiary placeholder:text-on-tertiary/50 w-full focus:outline-none focus:ring-2 focus:ring-secondary-fixed transition-all"
            />
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold rounded-full bg-secondary text-white hover:bg-secondary-container hover:text-on-secondary-container transition-colors cursor-pointer shrink-0"
            >
              Join
            </button>
          </form>
        </div>
      </div>

      {/* Sub-footer bottom bar */}
      <div className="max-w-[1440px] mx-auto px-6 sm:px-8 mt-12 pt-8 border-t border-on-tertiary/10 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-xs text-on-tertiary/60">
        <div>
          © {new Date().getFullYear()}&nbsp;Bren Raphael&apos;s&nbsp;Ube Jam & Halaya Shop. All rights reserved.
        </div>
        <div className="flex gap-6">
          <Link href="/terms" className="hover:text-on-tertiary transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-on-tertiary transition-colors">
            Privacy
          </Link>
          <Link href="/returns" className="hover:text-on-tertiary transition-colors">
            Refunds
          </Link>
        </div>
      </div>
    </footer>
  );
}
