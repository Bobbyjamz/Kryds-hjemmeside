import type { Metadata } from "next";
import { Barlow_Condensed, Barlow } from "next/font/google";
import "./globals.css";
import BackToHome from "@/components/BackToHome";
import CookieBanner from "@/components/CookieBanner";
import PageTracker from "@/components/PageTracker";
import ScrollToTop from "@/components/ScrollToTop";
import { ToastProvider } from "@/components/Toast";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-barlow",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://krydsbyg.com"),
  title: {
    default: "KrydsByg — Bemanding til byggeri i København",
    template: "%s — Kryds",
  },
  description:
    "Hurtig, kompetent bemanding til bygge- og anlægsprojekter. Tømrer, murer, stillads, VVS, el og mere. Ring +45 42 77 88 66.",
  alternates: {
    canonical: "https://krydsbyg.com",
  },
  keywords: [
    "byggebemanding", "KrydsByg", "Kryds", "håndværkere København",
    "byggefolk", "renovering", "bemanding", "byggepladsbemanding",
    "maling", "havearbejde", "montering", "byggeleder",
    "koordinator", "vikarbureau København", "byggevikar",
  ],
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Kryds — Stærke hænder til byggeprojekter",
    description:
      "Kryds leverer erfarne byggefolk til renovering, maling, havearbejde, montering og byggepladsbemanding i København. Sæt et kryds i kalenderen.",
    url: "https://krydsbyg.com",
    siteName: "Kryds",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "Kryds" }],
    type: "website",
    locale: "da_DK",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kryds — Stærke hænder til byggeprojekter",
    description: "Kryds leverer erfarne byggefolk til renovering, maling og byggepladsbemanding i København.",
    images: ["/og-image.svg"],
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Kryds ApS",
  "alternateName": "KrydsByg",
  "description": "Kryds leverer erfarne byggefolk til renovering, maling, havearbejde, montering og byggepladsbemanding i København.",
  "url": "https://krydsbyg.com",
  "telephone": "+4542778866",
  "email": "Kontakt@KrydsByg.com",
  "address": { "@type": "PostalAddress", "addressLocality": "København", "addressCountry": "DK" },
  "geo": { "@type": "GeoCoordinates", "latitude": 55.6761, "longitude": 12.5683 },
  "openingHoursSpecification": [{
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
    "opens": "07:00", "closes": "17:00",
  }],
  "priceRange": "$$",
  "currenciesAccepted": "DKK",
  "areaServed": { "@type": "City", "name": "København" },
  "sameAs": ["https://krydsbyg.com"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="da"
      data-theme="dark"
      suppressHydrationWarning
      className={`${barlowCondensed.variable} ${barlow.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Restore theme before first paint to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('kryds-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <ToastProvider>
              <BackToHome />
              <PageTracker />
              <div className="animate-fadeIn">{children}</div>
              <ScrollToTop />
              <CookieBanner />
            </ToastProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
