import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { LiffProvider } from "@/providers/LiffProvider";

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
    <html lang="zh-TW" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50">
        <LiffProvider>{children}</LiffProvider>
      </body>
    </html>
  );
}
