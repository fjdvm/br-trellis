import type { Metadata } from "next";
import { Hanken_Grotesk, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { RedirectToLogin } from "@/components/shared/RedirectToLogin";
import { AppShell } from "@/components/shared/AppShell";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OOS — Order & Operations",
  description: "Order & Operations System Management Portal",
};

const THIS_SYSTEM_CODE = "OOS";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (session == null) {
    return (
      <html lang="en" className={`${hankenGrotesk.variable} ${geistMono.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col">
          <RedirectToLogin />
        </body>
      </html>
    );
  }

  const hasAccess = session.systems?.includes(THIS_SYSTEM_CODE) ?? false;

  return (
    <html lang="en" className={`${hankenGrotesk.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-screen bg-background text-foreground font-sans">
        {hasAccess ? (
          <SessionProvider session={session}>
            <AppShell>
              {children}
            </AppShell>
          </SessionProvider>
        ) : (
          <div className="p-10 font-mono">
            <h1 className="text-xl font-bold text-red-600">Access Denied</h1>
            <p className="mt-2">
              You are logged in as {session.user?.name}, but you don&apos;t have access to {THIS_SYSTEM_CODE}.
            </p>
          </div>
        )}
      </body>
    </html>
  );
}
