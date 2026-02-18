import type { Metadata } from "next";
import "./globals.css";

// Global metadata used by Next.js for the root document.
export const metadata: Metadata = {
  title: "Smart Bookmark App",
  description: "Private realtime bookmarks with Google auth",
};

// Root layout wrapper applied to every route in the app.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
