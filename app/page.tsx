import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Ticker from "@/components/Ticker";
import StatsBar from "@/components/StatsBar";
import Services from "@/components/Services";
import HowItWorks from "@/components/HowItWorks";
import WhyKryds from "@/components/WhyKryds";
import Gallery from "@/components/Gallery";
import Founder from "@/components/Founder";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <Hero />
      <Ticker />
      <StatsBar />
      <Services />
      <div className="max-[900px]:hidden"><HowItWorks /></div>
      <WhyKryds />
      <Gallery />
      <Founder />
      <Contact />
      <Footer />
    </>
  );
}
