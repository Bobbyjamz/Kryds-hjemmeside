import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { readShifts } from "@/lib/db";
import type { Shift } from "@/lib/types";

export const metadata: Metadata = {
  title: "Ledige vagter — Kryds | Åbne byggevagter i København",
  description:
    "Se alle åbne vagter hos KrydsByg lige nu. Log ind som medarbejder for at tage en vagt, eller tilmeld dig som ny byggefolk.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatDanishRange(startISO: string, endISO: string): { date: string; time: string } {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const dateFmt = new Intl.DateTimeFormat("da-DK", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeFmt = new Intl.DateTimeFormat("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return {
    date: dateFmt.format(start),
    time: `${timeFmt.format(start)} – ${timeFmt.format(end)}`,
  };
}

export default async function VagterPage() {
  const allShifts = await readShifts();
  const openShifts = allShifts
    .filter((s) => s.status === "OPEN")
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  return (
    <>
      <Nav />
      <main className="bg-black min-h-screen pt-[120px] pb-[100px] px-[52px] max-[900px]:px-5 max-[900px]:pt-[100px] max-[900px]:pb-[70px]">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-condensed font-semibold text-[13px] tracking-[.1em] uppercase text-muted no-underline transition-colors hover:text-yellow mb-8"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Tilbage
        </Link>

        {/* Hero */}
        <div className="text-center max-w-[760px] mx-auto mb-[60px]">
          <div className="eyebrow flex items-center justify-center gap-[10px] font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-5">
            <span className="inline-block w-[18px] h-[1px] bg-yellow" />
            Ledige vagter
            <span className="inline-block w-[18px] h-[1px] bg-yellow" />
          </div>
          <h1 className="font-condensed font-black text-[clamp(38px,5vw,64px)] uppercase leading-[.95] tracking-[-.01em] text-cream mb-5">
            Åbne vagter <span className="text-yellow">lige nu</span>
          </h1>
          <p className="text-[17px] leading-[1.75] text-muted max-w-[560px] mx-auto">
            Her ser du alle åbne vagter. Log ind som medarbejder for at tage en vagt — eller tilmeld dig som ny hos KrydsByg.
          </p>
          <div className="flex gap-3 justify-center mt-7 flex-wrap">
            <Link
              href="/medarbejder/login"
              className="font-condensed font-extrabold text-[13px] tracking-[.12em] uppercase bg-yellow text-black px-6 py-[12px] rounded-[2px] no-underline transition-colors hover:bg-yellow2"
            >
              Log ind som medarbejder
            </Link>
            <Link
              href="/tilmeld"
              className="font-condensed font-extrabold text-[13px] tracking-[.12em] uppercase border border-[var(--border)] text-cream px-6 py-[12px] rounded-[2px] no-underline transition-colors hover:border-yellow hover:text-yellow"
            >
              Ny medarbejder? Tilmeld dig
            </Link>
          </div>
          <p className="text-[12px] text-muted mt-5 tracking-[.04em]">
            {openShifts.length === 0
              ? "Ingen åbne vagter lige nu"
              : `${openShifts.length} ${openShifts.length === 1 ? "åben vagt" : "åbne vagter"}`}
          </p>
        </div>

        {/* Shifts grid */}
        {openShifts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="max-w-[1240px] mx-auto grid grid-cols-3 gap-[18px] max-[1050px]:grid-cols-2 max-[720px]:grid-cols-1">
            {openShifts.map((shift) => (
              <ShiftCard key={shift.id} shift={shift} />
            ))}
          </div>
        )}

        {/* CTA bottom */}
        <div className="max-w-[640px] mx-auto text-center bg-gray p-12 rounded-[2px] border border-[var(--border)] mt-[90px]">
          <h3 className="font-condensed font-extrabold text-[26px] uppercase tracking-[.02em] text-cream mb-3">
            Klar til at tage en vagt?
          </h3>
          <p className="text-[15px] leading-[1.6] text-muted mb-6">
            Log ind med dit telefonnummer og den 6-cifrede kode, du fik tilsendt, da vi bekræftede din tilmelding.
          </p>
          <Link
            href="/medarbejder/login"
            className="inline-block font-condensed font-extrabold text-[14px] tracking-[.12em] uppercase bg-yellow text-black px-10 py-[14px] rounded-[2px] no-underline transition-all hover:bg-yellow2 hover:-translate-y-[1px]"
          >
            Log ind
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}

function ShiftCard({ shift }: { shift: Shift }) {
  const { date, time } = formatDanishRange(shift.startAt, shift.endAt);
  const capacity = 1; // single-assignment shifts
  const signupCount = shift.signups?.length ?? 0;

  return (
    <article className="group relative overflow-hidden rounded-[3px] border border-[var(--border)] bg-gray flex flex-col transition-colors hover:border-[rgba(245,196,0,.4)]">
      {/* Header strip */}
      <div className="relative px-6 pt-6 pb-4 border-b border-[var(--border)]">
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className="bg-[rgba(245,196,0,.08)] border border-[rgba(245,196,0,.25)] text-yellow font-condensed font-bold text-[10px] tracking-[.14em] uppercase px-[10px] py-1 rounded-[1px]">
            {shift.trade}
          </span>
          <span className="font-condensed font-bold text-[10px] tracking-[.18em] uppercase text-muted">
            ÅBEN
          </span>
        </div>
        <h3 className="font-condensed font-extrabold text-[22px] uppercase tracking-[.02em] leading-[1.1] text-cream">
          {shift.title}
        </h3>
      </div>

      {/* Body */}
      <div className="p-6 flex-1 flex flex-col gap-4">
        <div className="grid grid-cols-[18px_1fr] gap-x-3 gap-y-2 items-start">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5C400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-[2px]">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="text-[14px] text-cream leading-[1.5]">{shift.location}</span>

          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5C400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-[2px]">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 9h18M8 3v4M16 3v4" />
          </svg>
          <span className="text-[14px] text-cream leading-[1.5] capitalize">{date}</span>

          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5C400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-[2px]">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="text-[14px] text-cream leading-[1.5]">{time}</span>

          {typeof shift.hourlyRate === "number" && (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5C400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-[2px]">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <span className="text-[14px] text-cream leading-[1.5]">
                <strong className="font-bold text-yellow">{shift.hourlyRate} kr/t</strong>
              </span>
            </>
          )}
        </div>

        {shift.description && (
          <p className="text-[13px] leading-[1.7] text-muted line-clamp-4">
            {shift.description}
          </p>
        )}

        <div className="mt-auto pt-4 border-t border-[var(--border)] flex items-center justify-between">
          <span className="font-condensed font-bold text-[11px] tracking-[.12em] uppercase text-muted">
            {signupCount}/{capacity} tilmeldt
          </span>
          <Link
            href="/medarbejder/login"
            className="inline-flex items-center gap-2 font-condensed font-bold text-[12px] tracking-[.14em] uppercase text-yellow no-underline transition-all hover:gap-3"
          >
            Tag vagten
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="max-w-[560px] mx-auto text-center bg-gray border border-[var(--border)] rounded-[2px] p-12">
      <div
        className="w-14 h-14 mx-auto rounded-[14px] flex items-center justify-center text-yellow mb-5"
        style={{ background: "rgba(245,196,0,.1)", border: "1px solid rgba(245,196,0,.25)" }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 3v4M16 3v4" />
        </svg>
      </div>
      <h3 className="font-condensed font-extrabold text-[22px] uppercase tracking-[.02em] text-cream mb-2">
        Ingen åbne vagter lige nu
      </h3>
      <p className="text-[14px] leading-[1.7] text-muted mb-6">
        Der er ikke opslået vagter i øjeblikket. Tilmeld dig som medarbejder, så får du besked, når en vagt matcher dit fag.
      </p>
      <Link
        href="/tilmeld"
        className="inline-block font-condensed font-extrabold text-[13px] tracking-[.12em] uppercase bg-yellow text-black px-8 py-[12px] rounded-[2px] no-underline transition-colors hover:bg-yellow2"
      >
        Tilmeld dig
      </Link>
    </div>
  );
}
