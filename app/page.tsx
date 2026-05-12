import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Ticker from "@/components/Ticker";
import StatsBar from "@/components/StatsBar";
import BranchCarousel from "@/components/BranchCarousel";
import HowItWorks from "@/components/HowItWorks";
import WhyKryds from "@/components/WhyKryds";
import Founder from "@/components/Founder";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import MobileApp from "@/components/MobileApp";

export default function Home() {
  return (
    <>
      {/* ── DESKTOP layout (hidden on mobile ≤900px) ── */}
      <div className="max-[900px]:hidden">
        <Nav />
        <Hero />
        <Ticker />
        <StatsBar />
        <BranchCarousel />
        <HowItWorks />
        <WhyKryds />
        <Founder />
        <Contact />
        <Footer />
      </div>

      {/* ── MOBILE app (hidden on desktop >900px) ── */}
      <div className="hidden max-[900px]:block">
        <Nav />
        <MobileApp />
      </div>
    </>
  );
}
