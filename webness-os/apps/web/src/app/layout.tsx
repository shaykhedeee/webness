import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "Webness - Websites, Apps, and Growth Systems Built to Perform",
  description:
    "Webness is a founder-led digital systems studio building premium websites, apps, portals, marketing systems, and Signal Room diagnostics for businesses that need their digital presence to perform.",
  keywords: [
    "Webness",
    "Digital Systems Studio",
    "Premium Websites",
    "Web Application Development",
    "Growth Systems",
    "Signal Scan Diagnostics",
    "B2B Operations",
    "Tech Agency",
  ],
  openGraph: {
    title: "Webness - Premium Websites, Apps, and Growth Systems",
    description:
      "Apply for a Signal Scan, then turn website, app, marketing, and operational bottlenecks into a prioritized build and growth system.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={outfit.variable} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#020617" />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
