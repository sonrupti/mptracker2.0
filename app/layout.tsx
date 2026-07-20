import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import ConditionalLayout from "@/components/ConditionalLayout";
import { LanguageProvider } from "@/context/LanguageContext";
import GoogleTranslate from '@/components/GoogleTranslate';
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
  title: "LokLens — Parliament Tracker",
  description: "Track your MP. Know your Parliament.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col md:flex-row bg-white text-black dark:bg-black dark:text-white">
        <ThemeProvider>
          <LanguageProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
            {/* Kept inside the providers so it inherits theme context and matches hydration trees */}
            <GoogleTranslate />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}