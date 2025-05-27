// src/app/layout.tsx
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import AuthProvider from "./(providers)/AuthProvider";

export const metadata: Metadata = {
  title: "Bellavista",
  description: "Your luxury staycation destination",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // THE WHITESPACE IS LIKELY BETWEEN THIS <html> TAG AND THE <head> (implicit or explicit) or <body> TAG
    <html
      lang="en"
      suppressHydrationWarning={true}
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      {/* Any accidental space or newline HERE would cause the error before the <head> or <body> */}
      {/* Or if you have an explicit <head> tag, check between <html> and <head> */}
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
