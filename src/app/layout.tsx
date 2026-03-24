import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistem Registrasi - RAKERNAS V IHGMA",
  description: "Official Event Management System for IHGMA National Meeting 2026",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black overflow-hidden`}>
        {/* Header dihapus dari sini agar tidak tabrakan dengan page.tsx */}
        <main className="h-screen w-screen overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}