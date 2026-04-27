"use client";

import { useEffect, useRef, useState } from "react";
import { ADVISORS } from "@/lib/types";
import type { AdvisorRole, CouncilSession } from "@/lib/types";

const ROLES: AdvisorRole[] = ["economy", "marketing", "operations", "risk"];

function AdvisorColumn({ role }: { role: AdvisorRole }) {
  const advisor = ADVISORS[role];
  const [session, setSession] = useState<CouncilSession | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/admin/council?role=${role}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.sessions?.length > 0) setSession(data.sessions[0]);
      })
      .catch(() => {});
  }, [role]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages.length]);

  const send = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/council", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, sessionId: session?.id, message: input.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Ukendt fejl");
    } else {
      setSession(data.session);
      setInput("");
    }
    setLoading(false);
  };

  const newSession = async () => {
    if (session) {
      await fetch(`/api/admin/council?sessionId=${session.id}`, { method: "DELETE" });
    }
    setSession(null);
    setInput("");
    setError(null);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col bg-gray border border-[rgba(242,238,230,0.07)] rounded-[2px] min-h-[500px]">
      {/* Header */}
      <div className="p-4 border-b border-[rgba(242,238,230,0.07)] flex items-start justify-between gap-2">
        <div>
          <p className="font-condensed font-black text-[20px] uppercase tracking-[-.01em] text-yellow leading-none">
            {advisor.label}
          </p>
          <p className="text-[11px] text-muted mt-1">{advisor.description}</p>
        </div>
        <button
          onClick={newSession}
          className="font-condensed font-semibold text-[9px] tracking-[.18em] uppercase text-muted border border-[rgba(242,238,230,.1)] hover:text-cream hover:border-[rgba(242,238,230,.25)] px-2 py-1 rounded-[2px] transition-colors whitespace-nowrap"
        >
          Ny samtale
        </button>
      </div>

      {/* Beskeder */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
        {!session || session.messages.length === 0 ? (
          <p className="text-[12px] text-muted italic">
            Stil et spørgsmål til din {advisor.label.toLowerCase()}-rådgiver...
          </p>
        ) : (
          session.messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-3 py-2 rounded-[2px] text-[13px] leading-[1.55] whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-yellow text-black font-medium"
                    : "bg-[rgba(242,238,230,0.06)] text-cream border border-[rgba(242,238,230,0.07)]"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[rgba(242,238,230,0.06)] border border-[rgba(242,238,230,0.07)] text-muted text-[12px] px-3 py-2 rounded-[2px]">
              Tænker...
            </div>
          </div>
        )}
        {error && (
          <p className="text-[12px] text-red-400">{error}</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[rgba(242,238,230,0.07)]">
        <textarea
          className="w-full bg-[rgba(12,12,10,.5)] border border-[rgba(242,238,230,.1)] text-cream font-sans text-[13px] px-3 py-2 rounded-[2px] outline-none focus:border-yellow placeholder:text-[rgba(242,238,230,.2)] resize-none"
          rows={3}
          placeholder="Skriv her... (Enter sender)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="mt-2 w-full bg-yellow text-black font-condensed font-extrabold text-[11px] tracking-[.12em] uppercase px-4 py-2 rounded-[2px] hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {loading ? "Sender..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default function CouncilPage() {
  return (
    <div>
      <div className="mb-8">
        <p className="font-condensed font-semibold text-[10px] tracking-[.2em] uppercase text-yellow mb-2">
          AI Council
        </p>
        <h1 className="font-condensed font-black text-[40px] uppercase tracking-[-.01em] text-cream leading-none">
          Rådgiverkollegiet
        </h1>
        <p className="text-muted text-[14px] mt-2">
          Fire AI-rådgivere specialiseret i økonomi, marketing, drift og risiko.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 max-[1200px]:grid-cols-2 max-[700px]:grid-cols-1">
        {ROLES.map((role) => (
          <AdvisorColumn key={role} role={role} />
        ))}
      </div>
    </div>
  );
}
