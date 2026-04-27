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
        <line x1="14" y1="14" x2="76" y2="76" stroke="#F5C400" strokeWidth="18" strokeLinecap="round" />
        <line x1="76" y1="14" x2="14" y2="76" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
      </svg>
      <div className="flex flex-col justify-center">
        <span className="font-condensed font-black text-[26px] tracking-[.02em] text-cream uppercase leading-none">
          <span className="text-yellow">K</span>RYDS
        </span>
        <span className="font-condensed italic font-normal text-[12px] tracking-[.08em] text-muted leading-none mt-[4px]">
          Sæt et kryds i kalenderen.
        </span>
      </div>
    </Link>
  );
}
