import Logo from "./Logo";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray px-[52px] pt-16 pb-10 border-t border-[rgba(242,238,230,0.07)] max-[900px]:px-5 max-[900px]:pt-12 max-[900px]:pb-8">
      <div className="flex justify-between items-start pb-12 border-b border-[rgba(242,238,230,0.07)] mb-8 max-[900px]:flex-col max-[900px]:gap-9">
        <div>
          <Logo size={28} />
          <p className="font-condensed font-semibold text-[14px] tracking-[.08em] text-muted italic mt-4">
            Sæt et kryds i kalenderen.
          </p>
        </div>
        <div className="flex gap-[72px] max-[900px]:flex-col max-[900px]:gap-9">
          <div>
            <h5 className="font-condensed font-bold text-[11px] tracking-[.18em] uppercase text-yellow mb-4">
              Ydelser
            </h5>
            {[
              { label: "Bygge projekter", href: "/#services" },
              { label: "Flytte & montere", href: "/#services" },
              { label: "Events & scener", href: "/#services" },
              { label: "Priser", href: "/priser" },
              { label: "Tilmeld som medarbejder", href: "/tilmeld" },
            ].map((s) => (
              <a key={s.label} href={s.href} className="block text-[14px] text-muted no-underline mb-[10px] transition-colors hover:text-cream">
                {s.label}
              </a>
            ))}
          </div>
          <div>
            <h5 className="font-condensed font-bold text-[11px] tracking-[.18em] uppercase text-yellow mb-4">
              Virksomhed
            </h5>
            {[
              { label: "Om Kryds", href: "/om-os" },
              { label: "Priser", href: "/priser" },
              { label: "Send forespørgsel", href: "/#contract" },
              { label: "Medarbejder login", href: "/medarbejder/login" },
            ].map((s) => (
              <a key={s.label} href={s.href} className="block text-[14px] text-muted no-underline mb-[10px] transition-colors hover:text-cream">
                {s.label}
              </a>
            ))}
          </div>
          <div>
            <h5 className="font-condensed font-bold text-[11px] tracking-[.18em] uppercase text-yellow mb-4">
              Juridisk
            </h5>
            {[
              { label: "Handelsbetingelser", href: "/handelsbetingelser" },
              { label: "Privatlivspolitik", href: "/privatpolitik" },
              { label: "Medarbejder privatpolitik", href: "/medarbejder-privatpolitik" },
              { label: "Cookie-politik", href: "/cookie-politik" },
            ].map((s) => (
              <Link key={s.label} href={s.href} className="block text-[14px] text-muted no-underline mb-[10px] transition-colors hover:text-cream">
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center flex-wrap gap-3">
        <p className="text-[12px] text-[rgba(242,238,230,.2)]">© 2026 Kryds ApS — CVR: 46369947</p>
        <p className="text-[12px] text-[rgba(242,238,230,.2)]">
          <a href="mailto:Kontakt@KrydsByg.com" className="text-[rgba(242,238,230,.2)] hover:text-muted transition-colors no-underline">Kontakt@KrydsByg.com</a>
          {" · "}København, Danmark
        </p>
      </div>
    </footer>
  );
}
