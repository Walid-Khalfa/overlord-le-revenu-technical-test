import { Suspense } from "react";
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { MobileNav, MobileNavFallback } from "@/components/mobile-nav";

/* Typography of the mockup: Playfair Display for titles, Inter for the body. */
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const playfair = Playfair_Display({
  variable: "--font-playfair",
  weight: ["700", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Communauté — Le Revenu",
    template: "%s — Communauté | Le Revenu",
  },
  description:
    "La communauté des lecteurs du Revenu : posez vos questions d'argent, partagez vos expériences et échangez avec la rédaction.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
        {/* usePathname is request-time state: the static fallback keeps the
            shell prerenderable, the highlighted nav streams in. */}
        <Suspense fallback={<MobileNavFallback />}>
          <MobileNav />
        </Suspense>
      </body>
    </html>
  );
}
