import type { Metadata } from "next";
import { Geist_Mono, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/providers/providers";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EduGrade — Hệ thống quản lý trung tâm giáo dục",
  description: "EduGrade Education Center Management Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={cn(
        "h-full antialiased",
        geistMono.variable,
        beVietnamPro.variable,
      )}
    >
      {/* Browser extensions can add attributes to body before React hydrates. */}
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col font-sans bg-background text-foreground"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
