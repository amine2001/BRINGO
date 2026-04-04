import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";

import {
  LANGUAGE_COOKIE_NAME,
  THEME_COOKIE_NAME,
  resolveAppLanguage,
  resolveLanguageDirection,
  resolveThemePreference,
} from "@/lib/settings/preferences";

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
  title: {
    default: "Last Mile Control Tower",
    template: "%s | Last Mile Control Tower",
  },
  description:
    "API-driven order monitoring, Telegram automation, and admin control for last-mile operations.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const language = resolveAppLanguage(cookieStore.get(LANGUAGE_COOKIE_NAME)?.value);
  const theme = resolveThemePreference(cookieStore.get(THEME_COOKIE_NAME)?.value);
  const direction = resolveLanguageDirection(language);

  return (
    <html
      lang={language}
      dir={direction}
      data-theme={theme}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
