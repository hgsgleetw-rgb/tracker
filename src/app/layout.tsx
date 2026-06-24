import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import "./design.css";
import ErrorBoundary from "./_components/ErrorBoundary";
import { LiffProvider } from "@/providers/LiffProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "記帳",
  description: "LINE 記帳 App",
  appleWebApp: {
    capable: true,
    title: "記帳",
    statusBarStyle: "black-translucent",
  },
};

// viewport-fit=cover lets content draw under the notch so the translucent
// status bar works; the headers pad with env(safe-area-inset-top).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Match the hero's top colour so the status-bar / notch area blends in.
  themeColor: "#1B3A66",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className={`${geistSans.variable} h-dvh antialiased`}>
      <body className="h-full overflow-hidden">
        <ErrorBoundary>
          <LiffProvider>{children}</LiffProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
