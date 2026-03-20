import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { AuthProvider } from "@/hooks/useAuth";
import AppShell from "@/components/AppShell";
import ErrorBoundary from "@/components/ErrorBoundary";
import { strings } from "@/constants/strings";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: strings.appName,
  description: "A calm, focused weekly planner for desktop and mobile.",
  // PWA — makes the app installable on mobile home screens
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: strings.appName,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#007aff",
};

/**
 * Inline script to apply saved theme before first paint.
 * Prevents the white flash when the user has dark/blue theme saved.
 */
const themeScript = `
(function(){
  try {
    var p = JSON.parse(localStorage.getItem('weekplanner_preferences'));
    if (p && p.theme) document.documentElement.setAttribute('data-theme', p.theme);
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className={`${geistSans.variable} antialiased`}>
        <ErrorBoundary>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
