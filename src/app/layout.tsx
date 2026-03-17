import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import { strings } from "@/constants/strings";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: strings.appName,
  description: "A calm, focused weekly planner for desktop and mobile.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <body className={`${geistSans.variable} antialiased`}>
        <Sidebar />
        {/* Main content area: offset on desktop for sidebar, bottom padding on mobile for nav */}
        <main className="min-h-screen pb-16 md:pb-0 md:pl-56">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
