"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ShoppingBag, Headphones, User, LogIn, Menu, X, ChevronRight, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { totalItems, openCart, isOpen: isCartOpen, closeCart } = useCart();

  const hasUser = Boolean((session as { user?: unknown })?.user);
  const isAuthenticated = status === "authenticated" || hasUser;

  // Close mobile menu when route changes
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

  // Lock body scroll when mobile menu is active
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Shop" },
    { href: "/careers", label: "Careers" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-outline-variant/60 transition-colors relative">
        <div
          className={`max-w-[1440px] mx-auto px-4 sm:px-8 h-20 flex items-center justify-between transition-[filter] duration-300 ${
            isCartOpen ? "blur-md" : "blur-none"
          }`}
        >
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/logo.jpeg"
              alt="Bren Raphael's Ube Jam & Halaya Logo"
              width={42}
              height={42}
              className="w-10 h-10 object-cover shadow-xs transition-transform group-hover:scale-105"
            />
            <div>
              <span className="font-serif font-bold text-lg leading-tight tracking-tight block text-primary group-hover:text-primary-container transition-colors">
                Bren Raphael&apos;s
              </span>
              <span className="font-sans text-[10px] uppercase tracking-[0.15em] font-bold text-secondary block">
                Ube Jam & Halaya
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 font-sans text-sm font-semibold text-on-surface">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative py-1 transition-colors hover:text-primary ${
                    isActive ? "text-primary font-bold" : "text-on-surface-variant"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-fade-in" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Actions & Mobile Hamburger Toggle */}
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <Button
                asChild
                variant="ghost"
                size="icon"
                aria-label="Contact Support"
                className="text-on-surface-variant hover:text-primary hover:bg-surface-container-high hidden sm:flex"
              >
                <Link href="/support">
                  <Headphones className="w-5 h-5" />
                </Link>
              </Button>
            )}

            {isAuthenticated && (
              <Button
                asChild
                variant="ghost"
                size="icon"
                aria-label="Order History"
                className="text-on-surface-variant hover:text-primary hover:bg-surface-container-high hidden sm:flex"
              >
                <Link href="/order-history">
                  <History className="w-5 h-5" />
                </Link>
              </Button>
            )}

            {isAuthenticated && (
              <Button
                asChild
                variant="ghost"
                size="icon"
                aria-label="My Profile"
                className="text-on-surface-variant hover:text-primary hover:bg-surface-container-high hidden sm:flex"
              >
                <Link href="/profile">
                  <User className="w-5 h-5" />
                </Link>
              </Button>
            )}

            {!isAuthenticated && (
              <Button
                asChild
                variant="ghost"
                size="icon"
                aria-label="Sign In"
                className="text-on-surface-variant hover:text-primary hover:bg-surface-container-high hidden sm:flex"
              >
                <Link href="/signin">
                  <LogIn className="w-5 h-5" />
                </Link>
              </Button>
            )}

            <Button
              size="icon"
              onClick={openCart}
              aria-label="Shopping Cart"
              className="relative bg-primary text-white hover:bg-primary-container transition-colors shadow-xs"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-secondary-container text-on-secondary-container text-[11px] font-bold min-w-5 h-5 px-1 flex items-center justify-center border-2 border-surface">
                  {totalItems}
                </span>
              )}
            </Button>

            {/* Hamburger Button for Mobile / Small Screens */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
              className="md:hidden text-on-surface hover:bg-surface-container-high p-2"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-primary" /> : <Menu className="w-6 h-6 text-primary" />}
            </Button>
          </div>
        </div>

        {/* Cart-open overlay: darkens the header and closes the cart on click */}
        {isCartOpen && (
          <div
            className="absolute inset-0 z-50 cursor-pointer bg-inverse-surface/60 transition-opacity animate-fade-in"
            onClick={closeCart}
            aria-hidden="true"
          />
        )}

        {/* Mobile Sidebar Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden flex">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Sidebar Drawer Container */}
          <div className="relative ml-auto w-[85vw] max-w-xs bg-surface-container-lowest h-dvh shadow-2xl flex flex-col z-10 border-l border-outline-variant animate-slide-left">
            {/* Sidebar Header */}
            <div className="p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.jpeg"
                  alt="Logo"
                  width={36}
                  height={36}
                  className="w-9 h-9 object-cover shadow-xs"
                />
                <div>
                  <span className="font-serif font-bold text-sm block text-primary">
                    Bren Raphael&apos;s
                  </span>
                  <span className="font-sans text-[10px] uppercase tracking-[0.15em] font-bold text-secondary block">
                    Ube Jam & Halaya
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:bg-surface-container-high text-on-surface-variant"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Sidebar Navigation Links */}
            <nav className="flex-1 p-6 space-y-2 overflow-y-auto font-sans">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-5 py-3.5 rounded-full text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-primary text-white shadow-xs"
                        : "text-on-surface hover:bg-surface-container-high hover:text-primary"
                    }`}
                  >
                    <span>{link.label}</span>
                    <ChevronRight className={`w-4 h-4 ${isActive ? "text-on-primary" : "text-outline"}`} />
                  </Link>
                );
              })}

              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-5 py-3.5 rounded-full text-sm font-semibold transition-all ${
                  pathname === "/contact"
                    ? "bg-primary text-white shadow-xs"
                    : "text-on-surface hover:bg-surface-container-high hover:text-primary"
                }`}
              >
                <span>Contact Support</span>
                <ChevronRight className={`w-4 h-4 ${pathname === "/contact" ? "text-on-primary" : "text-outline"}`} />
              </Link>

              {isAuthenticated ? (
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-5 py-3.5 rounded-full text-sm font-semibold transition-all ${
                    pathname === "/profile"
                      ? "bg-primary text-white shadow-xs"
                      : "text-on-surface hover:bg-surface-container-high hover:text-primary"
                  }`}
                >
                  <span>My Profile</span>
                  <ChevronRight className={`w-4 h-4 ${pathname === "/profile" ? "text-on-primary" : "text-outline"}`} />
                </Link>
              ) : (
                <Link
                  href="/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-5 py-3.5 rounded-full text-sm font-semibold transition-all ${
                    pathname === "/signin"
                      ? "bg-primary text-white shadow-xs"
                      : "text-on-surface hover:bg-surface-container-high hover:text-primary"
                  }`}
                >
                  <span>Sign In</span>
                  <ChevronRight className={`w-4 h-4 ${pathname === "/signin" ? "text-on-primary" : "text-outline"}`} />
                </Link>
              )}
            </nav>

            {/* Sidebar Footer Action */}
            <div className="p-6 border-t border-outline-variant bg-surface-container-low space-y-3">
              <Link
                href="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full bg-primary text-white font-semibold py-3 px-6 flex items-center justify-center gap-2 shadow-xs text-sm hover:bg-primary-container transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                Browse Catalog
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
