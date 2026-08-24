import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WillowTree# — Borderlands 1 Save Editor",
  description:
    "Browser port of WillowTree#. Open, edit, and convert Borderlands 1 PC, PS3, and Xbox 360 saves without uploading them.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
