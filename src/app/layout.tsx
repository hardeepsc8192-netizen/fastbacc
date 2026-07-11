import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Baylor Nursing Grad Map",
  description: "Tracking where our nursing cohort landed — hospitals, units, and cities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-[100dvh] flex flex-col overflow-hidden">
        <header className="shrink-0 bg-baylor-green text-white border-b-4 border-baylor-gold">
          <div className="mx-auto max-w-6xl px-4 py-3 sm:py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 min-w-0">
              <span className="text-baylor-gold text-xl sm:text-2xl leading-none shrink-0">
                ✚
              </span>
              <span className="font-semibold text-base sm:text-lg tracking-tight truncate">
                Baylor Nursing Grad Map
              </span>
            </Link>
            <Link
              href="/admin"
              className="shrink-0 text-sm text-white/70 hover:text-baylor-gold transition-colors"
            >
              Admin
            </Link>
          </div>
        </header>
        <main className="flex-1 flex flex-col min-h-0">{children}</main>
        <footer className="shrink-0 bg-baylor-green-dark text-white/60 text-xs">
          <div className="mx-auto max-w-6xl px-4 py-2 sm:py-4">
            Independent, unofficial project made by a Baylor nursing alum to
            keep up with classmates. Not affiliated with, sponsored by, or
            endorsed by Baylor University.
          </div>
        </footer>
      </body>
    </html>
  );
}
