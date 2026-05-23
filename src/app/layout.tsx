import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Playfair_Display } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://love-sick-tawny.vercel.app";

export const metadata: Metadata = {
  title: "Love Sick — Romance is Creation, not Consumption",
  description:
    "For two people: rate love languages, see your compatibility overlap, answer deep-cut questions together, and get AI insights on how to grow — not what to buy.",
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: "Love Sick — Romance is Creation, not Consumption",
    description:
      "Know how you love. See how you match. Five love languages, a shared dashboard, and AI insights for two.",
    url: APP_URL,
    siteName: "Love Sick",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Love Sick — Romance is Creation, not Consumption",
    description:
      "Know how you love. See how you match. Five love languages, a shared dashboard, and AI insights for two.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0a0812",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} min-h-screen antialiased page-enter min-w-0 overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
