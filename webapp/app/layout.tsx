import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import "./globals.css";
import { Providers } from "@/components/providers";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-giftcircle",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GiftCircle — Collective Support, Beautifully Gathered",
    template: "%s | GiftCircle",
  },
  description:
    "Create transparent community gift circles for life's celebrations and moments of care.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${plusJakarta.variable} scroll-smooth`}>
      <body className="flex min-h-screen flex-col bg-surface font-sans text-on-surface antialiased">
        <Providers>
          <SiteHeader />
          <div className="flex-1 pt-20">{children}</div>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
