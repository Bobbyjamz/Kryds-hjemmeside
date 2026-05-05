import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/auth";
import MobileAdminNav from "./_mobile-nav";
import AdminControls from "./_admin-controls";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="bg-black text-cream min-h-screen min-[700px]:flex">
      {/* ── Sidebar (desktop ≥ 700px) ── */}
      <aside className="hidden min-[700px]:flex w-[240px] bg-black2 border-r border-[rgba(242,238,230,0.07)] flex-col sticky top-0 h-screen">
        <Link href="/" className="p-6 border-b border-[rgba(242,238,230,0.07)] flex items-center gap-3 hover:bg-[rgba(245,196,0,.03)] transition-colors" title="Tilbage til forsiden">
          <svg width="36" height="36" viewBox="0 0 90 90" className="text-cream">
            <line x1="14" y1="14" x2="76" y2="76" stroke="#F5C400" strokeWidth="18" strokeLinecap="round" />
            <line x1="76" y1="14" x2="14" y2="76" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
          </svg>
          <div>
            <p className="font-condensed font-black text-[15px] uppercase tracking-[.04em] text-cream leading-none">Kryds</p>
            <p className="font-condensed text-[10px] tracking-[.18em] uppercase text-muted leading-none mt-1">Admin</p>
          </div>
        </Link>
        <nav className="flex-1 p-4">
          <ul className="flex flex-col gap-1">
            {[
              { href: "/admin", label: "Dashboard" },
              { href: "/admin/medarbejdere", label: "Medarbejdere" },
              { href: "/admin/vagter", label: "Vagter" },
              { href: "/admin/feed", label: "Feed" },
              { href: "/admin/council", label: "Council" },
              { href: "/admin/kunder", label: "Kunder" },
              { href: "/admin/sarah", label: "Sarah ✦" },
              { href: "/admin/leads", label: "Leads ◆" },
              { href: "/admin/tilbud", label: "Tilbud" },
            ].map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="block font-condensed font-semibold text-[12px] tracking-[.15em] uppercase text-muted hover:text-cream hover:bg-[rgba(245,196,0,.05)] px-3 py-3 rounded-[2px] transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-[rgba(242,238,230,0.07)]">
          <AdminControls />
          <p className="text-[11px] text-muted mt-3 mb-2">Logget ind som <span className="text-cream">{session.username}</span></p>
          <form action="/api/admin/logout" method="POST">
            <button
              type="submit"
              className="w-full bg-transparent border border-[rgba(242,238,230,.1)] text-muted hover:text-cream hover:border-cream font-condensed font-semibold text-[11px] tracking-[.15em] uppercase px-3 py-2 rounded-[2px] transition-colors"
            >
              Log ud
            </button>
          </form>
        </div>
      </aside>

      {/* ── Mobile header + hamburger (< 700px) ── */}
      <MobileAdminNav username={session.username} />

      <main
        className="flex-1 p-10 max-[900px]:p-6 max-[700px]:p-4 overflow-x-hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}
      >
        {children}
      </main>
    </div>
  );
}
