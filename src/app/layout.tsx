import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import "./design.css";
import ErrorBoundary from "./_components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "記帳",
  description: "LINE 記帳 App",
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
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
