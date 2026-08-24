import type { Metadata } from "next";
import { Bebas_Neue, Geist_Mono, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const heading = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

const body = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WillowTree Web — Borderlands 1 Save Editor",
  description:
    "Edit Borderlands 1 and GOTY Enhanced save files in the browser. Change money, level, skills, ammo, weapons, and missions without installing WillowTree#.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${heading.variable} ${body.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
