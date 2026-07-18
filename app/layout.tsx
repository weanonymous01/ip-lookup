import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "IP Intelligence Lookup - weanonymous.in",
  description:
    "Paste any IP address or domain to instantly see geolocation, ISP, ASN, and threat flags like proxy, VPN, and Tor exit detection. Free, no login required.",
  keywords: [
    "IP lookup",
    "IP address",
    "geolocation",
    "ISP lookup",
    "VPN detection",
    "proxy detection",
    "cybersecurity tool",
    "threat intelligence",
  ],
  openGraph: {
    title: "IP Intelligence Lookup",
    description:
      "Check any IP - location, ISP, and threat flags instantly. Free tool by weanonymous.in",
    type: "website",
  },
  other: {
    "leaflet-css": "",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        {/* Leaflet CSS — must be in head for map rendering */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
