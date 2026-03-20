import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// Gunakan @ untuk akses folder src langsung
import Header from "./Components/Header";

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-100 text-slate-900 overflow-hidden`}>
        {/* Header dipasang tetap di atas */}
        <div className="fixed top-0 left-0 right-0 z-[100]">
          <Header />
        </div>
        
        {/* Main content diberi padding top agar tidak tertutup Header */}
        <main className="pt-16 h-screen overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}