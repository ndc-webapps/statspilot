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
  title: "StatsPilot — Analytics for your projects",
  description: "Vercel-style analytics dashboard for monitoring multiple projects side-by-side.",
};

const themeScript = `
try {
  var saved = localStorage.getItem("statspilot-theme");
  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if ((saved && saved === "dark") || (!saved && prefersDark)) {
    document.documentElement.classList.add("dark");
  }
} catch (_) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="h-full bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">{children}</body>
    </html>
  );
}
