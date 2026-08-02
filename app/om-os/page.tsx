import type { Metadata } from "next";
import OmOsClient from "./OmOsClient";

export const metadata: Metadata = {
  title: "Om os — Kryds | Stærke hænder, stærkt sammenhold",
  description:
    "Mød manden bag Kryds. Stiftet og drevet af Krystian Seweryn Balasz — fordi vi tror på at hjælpe hinanden.",
};

export default function OmOsPage() {
  return <OmOsClient />;
}
