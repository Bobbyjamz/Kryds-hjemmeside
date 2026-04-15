import Link from "next/link";

interface LogoProps {
  size?: number;
}

export default function Logo({ size = 38 }: LogoProps) {
  return (
    <Link href="/" className="flex items-center no-underline">
      <svg
        className="flex-shrink-0 text-cream"
        width={size}
        height={size}
        viewBox="0 0 90 90"
        style={{ marginRight: size === 38 ? 13 : 10 }}
      >
        <line x1="8" y1="8" x2="82" y2="82" stroke="#F5C400" strokeWidth="18" strokeLinecap="square" />
        <line x1="82" y1="8" x2="8" y2="82" stroke="currentColor" strokeWidth="18" strokeLinecap="square" />
      </svg>
      <div className="flex flex-col justify-center">
        <span className="font-condensed font-black text-[26px] tracking-[.02em] text-cream uppercase leading-none">
          <span className="text-yellow">K</span>RYDS
        </span>
        <span className="font-condensed font-normal text-[10px] tracking-[.22em] uppercase text-muted leading-none mt-[3px]">
          Byggeprojekter · København
        </span>
      </div>
    </Link>
  );
}
