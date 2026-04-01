"use client";

import { useState, useEffect } from "react";
import Logo from "./Logo";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
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
          <li className="max-[900px]:hidden">
            <a href="/priser" className="font-condensed font-semibold text-[13px] tracking-[.12em] uppercase text-muted no-underline transition-colors hover:text-yellow">
              Priser
            </a>
          </li>
          <li className="max-[900px]:hidden">
            <a
              href="#contract"
              className="font-condensed font-extrabold text-[13px] tracking-[.1em] uppercase bg-yellow text-black px-6 py-[10px] rounded-[2px] no-underline transition-colors hover:bg-yellow2"
            >
              Book nu
            </a>
          </li>
          {/* Hamburger button — only on mobile */}
          <li className="hidden max-[900px]:flex items-center gap-4">
            <a
              href="#contract"
              className="font-condensed font-extrabold text-[13px] tracking-[.1em] uppercase bg-yellow text-black px-5 py-[9px] rounded-[2px] no-underline transition-colors hover:bg-yellow2"
            >
              Book nu
            </a>
            <button
              aria-label="Åbn menu"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex flex-col justify-center gap-[5px] w-[28px] h-[28px] bg-transparent border-none cursor-pointer p-0"
            >
              <span
                className="block h-[2px] bg-cream rounded-full transition-all duration-300"
                style={menuOpen ? { transform: "translateY(7px) rotate(45deg)" } : {}}
              />
              <span
                className="block h-[2px] bg-cream rounded-full transition-all duration-300"
                style={menuOpen ? { opacity: 0 } : {}}
              />
              <span
                className="block h-[2px] bg-cream rounded-full transition-all duration-300"
                style={menuOpen ? { transform: "translateY(-7px) rotate(-45deg)" } : {}}
              />
            </button>
          </li>
        </ul>
      </nav>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[490] bg-[rgba(12,12,10,.97)] flex flex-col justify-center items-start px-8 gap-8 hidden max-[900px]:flex"
          style={{ paddingTop: scrolled ? 54 : 66 }}
        >
          {[
            { href: "#services", label: "Ydelser" },
            { href: "#how", label: "Processen" },
            { href: "#why", label: "Om os" },
            { href: "/priser", label: "Priser" },
            { href: "#contract", label: "Book nu" },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              onClick={closeMenu}
              className="font-condensed font-extrabold text-[40px] uppercase tracking-[-.01em] text-cream no-underline transition-colors hover:text-yellow leading-none"
            >
              {label}
            </a>
          ))}
          <div className="mt-4 border-t border-[rgba(242,238,230,0.07)] pt-6 w-full">
            <p className="text-[14px] text-muted mb-1">+45 42 77 88 66</p>
            <a href="mailto:Kontakt@KrydsByg.com" className="text-[14px] text-muted no-underline hover:text-cream transition-colors">
              Kontakt@KrydsByg.com
            </a>
          </div>
        </div>
      )}
    </>
  );
}
