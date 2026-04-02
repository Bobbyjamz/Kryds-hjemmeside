const items = [
  "Renovering",
  "Maling & spartling",
  "Havearbejde",
  "Montering",
  "Byggepladsbehjælp",
  "Flyttearbejde",
  "Flisearbejde",
  "Kryds — Sæt et kryds i kalenderen",
];

export default function Ticker() {
  return (
    <div aria-hidden="true" className="bg-yellow h-[46px] overflow-hidden flex items-center whitespace-nowrap">
      <div className="inline-flex animate-ticker">
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            className="font-condensed font-bold text-[15px] tracking-[.12em] uppercase text-black px-8 flex items-center gap-8"
          >
            {item}
            <span className="w-[6px] h-[6px] bg-[rgba(12,12,10,.3)] rounded-full flex-shrink-0" />
          </span>
        ))}
      </div>
    </div>
  );
}
