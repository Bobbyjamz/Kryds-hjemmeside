import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import TilmeldWizard from "@/components/tilmeld/TilmeldWizard";

export default function TilmeldPage() {
  return (
    <main className="bg-black text-cream min-h-screen">
      <Nav />
      <section className="pt-[140px] pb-[100px] px-[52px] max-[900px]:pt-[110px] max-[900px]:px-5 max-[900px]:pb-[70px]">
        <div className="max-w-[820px] mx-auto mb-12">
          <div className="font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-4">
            For håndværkere
          </div>
          <h1 className="font-condensed font-black text-[clamp(38px,4.8vw,64px)] uppercase leading-[.95] tracking-[-.01em] mb-4">
            Tilmeld dig <span className="text-yellow">Kryds</span>
          </h1>
          <p className="text-[16px] leading-[1.6] text-muted max-w-[620px]">
            Opret din profil og få adgang til bygge- og håndværksopgaver i hovedstadsområdet. Du bliver kun medarbejder hos Kryds, når du selv siger ja til en vagt — og ansættelsen ophører automatisk, når opgaven er afsluttet.
          </p>
        </div>
        <TilmeldWizard />
      </section>
      <Footer />
    </main>
  );
}
