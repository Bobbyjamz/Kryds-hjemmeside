"use client";

import { getContractPoints, CONTRACT_VERSION, ACCEPT_LABEL } from "@/lib/contract";

interface Props {
  employeeName: string;
  accepted: boolean;
  onAcceptChange: (v: boolean) => void;
}

export default function ContractBox({ employeeName, accepted, onAcceptChange }: Props) {
  const points = getContractPoints(employeeName);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
        <h3 className="font-condensed font-extrabold text-[20px] uppercase tracking-[.04em] text-cream">
          Kontrakt — ansættelsesvilkår
        </h3>
        <span className="font-condensed text-[11px] tracking-[.18em] uppercase text-muted">
          Version {CONTRACT_VERSION}
        </span>
      </div>
      <div className="max-h-[420px] overflow-y-auto bg-[rgba(12,12,10,.6)] border border-[rgba(242,238,230,.1)] rounded-[2px] p-5 mb-5">
        {points.map((p) => (
          <div key={p.title} className="mb-4 last:mb-0">
            <h4 className="font-condensed font-bold text-[14px] tracking-[.08em] uppercase text-yellow mb-1">
              {p.title}
            </h4>
            <p className="text-[14px] leading-[1.6] text-cream/90">{p.body}</p>
          </div>
        ))}
      </div>
      <label className="flex items-start gap-3 cursor-pointer select-none bg-[rgba(245,196,0,.05)] border border-[rgba(245,196,0,.25)] rounded-[2px] p-4 hover:bg-[rgba(245,196,0,.08)] transition-colors">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => onAcceptChange(e.target.checked)}
          className="mt-[2px] w-[18px] h-[18px] accent-yellow cursor-pointer flex-shrink-0"
        />
        <span className="text-[14px] leading-[1.55] text-cream">{ACCEPT_LABEL}</span>
      </label>
    </div>
  );
}
