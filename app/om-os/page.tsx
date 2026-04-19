import type { Metadata } from "next";
import OmOsClient from "./OmOsClient";

export const metadata: Metadata = {
  title: "Om os — Kryds | Stærke hænder, stærkt sammenhold",
  description:
    "Mød folkene bag Kryds. Stiftet af Krystian Seweryn Balasz og drevet sammen med Karl Kristian Ravn — fordi vi tror på at hjælpe hinanden.",
};

export default function OmOsPage() {
  return <OmOsClient />;
}
