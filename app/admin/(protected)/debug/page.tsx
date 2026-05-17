import { getAdminSession } from "@/lib/auth";
import DebugClient from "./DebugClient";

export const dynamic = "force-dynamic";

export default async function AdminDebugPage() {
  // Admin-session er allerede garanteret af (protected)/layout.tsx,
  // men vi henter brugernavnet til UI'et.
  const session = await getAdminSession();
  const adminUsername = session?.username ?? "admin";

  return <DebugClient adminUsername={adminUsername} />;
}
