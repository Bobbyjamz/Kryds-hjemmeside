import type { Lead } from "@/lib/types";

/** Kontakter på salgssiden (/admin/salg) håndteres manuelt — automatisk outreach må aldrig røre dem. */
export function tilladtForAutomatik(lead: Lead): boolean {
  return !lead.salg;
}
