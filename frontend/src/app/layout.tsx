// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "@/components/locale/LocaleProvider";
import ToastProvider from "@/components/toastify/ToastProvider";
import ThemeScript from "@/components/theme/ThemeScript";

export const metadata: Metadata = {
  title: "eWP",
  description: "E-commerce",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className="font-sans">
      <body>
        <LocaleProvider>
          <ThemeScript />
          <ToastProvider />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
