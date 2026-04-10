import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tilmeld dig som medarbejder — Kryds",
  description: "Opret din profil hos Kryds og få adgang til vagter på byggepladser i hele hovedstadsområdet.",
};

export default function TilmeldLayout({ children }: { children: React.ReactNode }) {
  return children;
}
