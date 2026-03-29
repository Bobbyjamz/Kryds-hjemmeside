import type { Metadata } from "next";
import { Barlow_Condensed, Barlow } from "next/font/google";
import "./globals.css";
import CustomCursor from "@/components/CustomCursor";

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
  title: "Kryds — Stærke hænder til byggeprojekter",
  description:
    "Kryds leverer erfarne byggefolk til renovering, maling, havearbejde, montering og byggepladsbemanding i København. Sæt et kryds i kalenderen.",
  icons: {
    icon: "/favicon.svg",
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
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
