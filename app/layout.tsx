import type { Metadata } from "next";
import { Barlow_Condensed, Barlow } from "next/font/google";
import "./globals.css";

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
    default: "Kryds — Stærke hænder til byggeprojekter i København",
    template: "%s — Kryds",
  },
  description:
    "Kryds leverer erfarne byggefolk til renovering, maling, havearbejde, montering og byggepladsbemanding i København. Sæt et kryds i kalenderen.",
  keywords: [
    "byggebemanding",
    "KrydsByg",
    "Kryds",
    "håndværkere København",
    "byggefolk",
    "renovering",
    "bemanding",
    "byggepladsbemanding",
    "maling",
    "havearbejde",
    "montering",
    "byggeleder",
    "koordinator",
  ],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Kryds — Stærke hænder til byggeprojekter",
    description:
      "Kryds leverer erfarne byggefolk til renovering, maling, havearbejde, montering og byggepladsbemanding i København. Sæt et kryds i kalenderen.",
    url: "https://krydsbyg.com",
    siteName: "Kryds",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Kryds — Stærke hænder til byggeprojekter i København",
      },
    ],
    type: "website",
    locale: "da_DK",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kryds — Stærke hænder til byggeprojekter",
    description:
      "Kryds leverer erfarne byggefolk til renovering, maling og byggepladsbemanding i København.",
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da" className={`${barlowCondensed.variable} ${barlow.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
