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
          Medarbejderkontrakt — ansættelsesvilkår
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
      <label
        className={`flex items-start gap-4 bg-[rgba(245,196,0,.05)] border rounded-[2px] p-4 cursor-pointer transition-colors ${
          accepted ? "border-yellow" : "border-[rgba(245,196,0,.25)] hover:border-[rgba(245,196,0,.5)]"
        }`}
      >
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => onAcceptChange(e.target.checked)}
          className="sr-only"
        />
        <span
          className={`flex-shrink-0 w-6 h-6 rounded-[3px] border-2 flex items-center justify-center transition-colors mt-[2px] ${
            accepted ? "bg-yellow border-yellow" : "bg-transparent border-[rgba(242,238,230,.35)]"
          }`}
          aria-hidden="true"
        >
          {accepted && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0C0C0A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </span>
        <span className="text-[14px] leading-[1.55] text-cream select-none">
          {ACCEPT_LABEL}
        </span>
      </label>
    </div>
  );
}
