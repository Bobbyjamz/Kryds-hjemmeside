import type { Metadata } from "next";
import PriserClient from "./PriserClient";

export const metadata: Metadata = {
  title: "Priser — Kryds | Gennemsigtig bemandingspris",
  description:
    "Se Kryds' priser for byggebemanding i København. Enkelt gebyr oven på medarbejderens timeløn — ingen skjulte omkostninger.",
};

export default function PriserPage() {
  return <PriserClient />;
}
