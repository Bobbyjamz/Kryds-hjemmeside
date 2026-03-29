"use client";

import { useState, useEffect } from "react";
import Logo from "./Logo";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[500] flex items-center justify-between px-[52px] bg-[rgba(12,12,10,.92)] backdrop-blur-[14px] border-b border-[rgba(242,238,230,0.07)] transition-[height] duration-300 max-[900px]:px-5"
      style={{ height: scrolled ? 54 : 66 }}
    >
      <Logo />
      <ul className="flex gap-[38px] list-none items-center">
        <li className="max-[900px]:hidden">
          <a href="#services" className="font-condensed font-semibold text-[13px] tracking-[.12em] uppercase text-muted no-underline transition-colors hover:text-yellow">
            Ydelser
          </a>
        </li>
        <li className="max-[900px]:hidden">
          <a href="#how" className="font-condensed font-semibold text-[13px] tracking-[.12em] uppercase text-muted no-underline transition-colors hover:text-yellow">
            Processen
          </a>
        </li>
        <li className="max-[900px]:hidden">
          <a href="#why" className="font-condensed font-semibold text-[13px] tracking-[.12em] uppercase text-muted no-underline transition-colors hover:text-yellow">
            Om os
          </a>
        </li>
        <li>
          <a
            href="#contract"
            className="font-condensed font-extrabold text-[13px] tracking-[.1em] uppercase bg-yellow text-black px-6 py-[10px] rounded-[2px] no-underline transition-colors hover:bg-yellow2"
          >
            Book nu
          </a>
        </li>
      </ul>
    </nav>
  );
}
