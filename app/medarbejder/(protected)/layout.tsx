import { redirect } from "next/navigation";
import Link from "next/link";
import { getEmployeeSession } from "@/lib/auth";
import { findEmployeeById } from "@/lib/db";
import MedarbejderBottomNav from "./_nav";

export default async function MedarbejderProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getEmployeeSession();
  if (!session) {
    redirect("/medarbejder/login");
  }
  const employee = await findEmployeeById(session.employeeId);
  if (!employee) {
    redirect("/medarbejder/login");
  }

  return (
    <div className="bg-black text-cream min-h-screen">
      <header className="sticky top-0 z-30 bg-black2 border-b border-[rgba(242,238,230,0.07)] backdrop-blur">
        <div className="max-w-[1100px] mx-auto px-4 min-[700px]:px-6 py-3 min-[700px]:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 min-[700px]:gap-3 no-underline hover:opacity-80 transition-opacity" title="Tilbage til forsiden">
            <svg width="28" height="28" viewBox="0 0 90 90" className="text-cream min-[700px]:w-8 min-[700px]:h-8">
              <line x1="14" y1="14" x2="76" y2="76" stroke="#F5C400" strokeWidth="18" strokeLinecap="round" />
              <line x1="76" y1="14" x2="14" y2="76" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
            </svg>
            <div>
              <p className="font-condensed font-black text-[14px] min-[700px]:text-[15px] uppercase tracking-[.04em] text-cream leading-none">Kryds</p>
              <p className="font-condensed text-[9px] min-[700px]:text-[10px] tracking-[.18em] uppercase text-muted leading-none mt-1">Medarbejder</p>
            </div>
          </Link>
          <div className="flex items-center gap-3 min-[700px]:gap-4">
            <p className="text-[13px] text-muted max-[500px]:hidden">
              <span className="text-cream">{employee.name}</span>
            </p>
            <form action="/api/medarbejder/logout" method="POST">
              <button
                type="submit"
                className="bg-transparent border border-[rgba(242,238,230,.12)] text-muted hover:text-cream hover:border-cream font-condensed font-semibold text-[10px] min-[700px]:text-[11px] tracking-[.15em] uppercase px-3 min-[700px]:px-4 rounded-[4px] transition-colors"
                style={{ minHeight: 36 }}
              >
                Log ud
              </button>
            </form>
          </div>
        </div>
      </header>
      <main
        className="max-w-[1100px] mx-auto px-4 min-[700px]:px-6 py-6 min-[700px]:py-10"
        style={{ paddingBottom: "calc(84px + env(safe-area-inset-bottom, 0px))" }}
      >
        {children}
      </main>
      <MedarbejderBottomNav />
    </div>
  );
}
