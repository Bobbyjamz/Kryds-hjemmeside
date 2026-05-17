import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import DebugClient from "./DebugClient";

export const dynamic = "force-dynamic";

export default async function AdminDebugPage() {
  // 1. Admin skal være logget ind
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  // 2. Valgfri env-guard: bloker i prod hvis ENABLE_DEBUG ikke er sat
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_DEBUG !== "true") {
    return (
      <main className="min-h-screen bg-black text-cream py-16 px-6">
        <div className="max-w-[600px] mx-auto">
          <p className="font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-2">
            Adgang spærret
          </p>
          <h1 className="font-condensed font-black text-[44px] uppercase tracking-[-.01em] text-cream leading-none mb-6">
            /admin/debug
          </h1>
          <div className="bg-gray border border-yellow/30 rounded-[2px] p-6">
            <p className="text-[14px] text-cream leading-[1.7]">
              Debug-dashboardet er deaktiveret i production. Sæt{" "}
              <code className="text-yellow font-mono bg-black/50 px-2 py-0.5 rounded-[2px]">ENABLE_DEBUG=true</code>{" "}
              i Vercel environment variables når du aktivt debugger, og fjern den igen efter brug.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // 3. Render client-komponenten med password-gate
  const debugPasswordConfigured = !!process.env.DEBUG_PASSWORD;

  return <DebugClient adminUsername={session.username} debugPasswordConfigured={debugPasswordConfigured} />;
}
