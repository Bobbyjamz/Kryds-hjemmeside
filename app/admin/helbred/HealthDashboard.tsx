"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type {
  HelbedLog,
  HelbedMeal,
  HelbedSupplement,
  HelbedTrainingSession,
  HelbedChatMessage,
} from "@/lib/helbred-db";

type Tab = "oversigt" | "kost" | "traening" | "kalender" | "tilskud" | "sarah";

interface GoogleCalEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function todayDanish() {
  return new Date().toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long" });
}

// ── Ring (SVG progress ring) ──────────────────────────────────────────────
function Ring({ size = 132, stroke = 11, value, max = 100, color, children }: {
  size?: number; stroke?: number; value: number; max?: number; color: string; children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, value / max));
  const offset = c * (1 - pct);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--surface-3)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset .6s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
}

// ── Sarah avatar ──────────────────────────────────────────────────────────
function SarahAvatar({ size = 28 }: { size?: number }) {
  return (
    <div className="sarah-avatar" style={{ width: size, height: size, position: "relative" }}>
      <svg viewBox="0 0 24 24" width={size * 0.5} height={size * 0.5} style={{ position: "absolute", inset: 0, margin: "auto", color: "#412402" }}>
        <path d="M12 4 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5z" fill="currentColor" />
      </svg>
    </div>
  );
}

// ── Sarah message card ────────────────────────────────────────────────────
function SarahCard({ text, prompts, onPrompt }: { text: string; prompts?: string[]; onPrompt?: (p: string) => void }) {
  return (
    <div style={{
      padding: 16,
      background: "linear-gradient(135deg, #1a1a1a, #2a2418)",
      borderRadius: 18, position: "relative", overflow: "hidden",
      boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
      border: "0.5px solid rgba(250,199,117,0.15)",
    }}>
      <div style={{
        position: "absolute", right: -40, top: -40, width: 140, height: 140, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(250,199,117,0.22), transparent 70%)",
      }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, position: "relative" }}>
        <SarahAvatar size={22} />
        <span style={{ fontSize: 11, fontWeight: 700, color: "#FAC775", letterSpacing: 0.04 }}>SARAH</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>· lige nu</span>
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.5, color: "#e8e6e0", position: "relative", whiteSpace: "pre-wrap" }}>{text}</div>
      {prompts && prompts.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap", position: "relative" }}>
          {prompts.map((p, i) => (
            <button key={i} onClick={() => onPrompt?.(p)} style={{
              fontSize: 11, fontWeight: 500, color: "#FAC775",
              background: "rgba(250,199,117,0.10)", border: "0.5px solid rgba(250,199,117,0.25)",
              borderRadius: 999, padding: "5px 11px", cursor: "pointer", fontFamily: "inherit",
            }}>{p} →</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────
function StatCard({ value, unit, label, sub, color, onClick }: {
  value: string | number; unit?: string; label: string; sub?: string; color?: string; onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="card" style={{
      padding: 16, display: "flex", flexDirection: "column", gap: 6,
      background: "var(--surface)", border: "0.5px solid var(--hairline-2)", borderRadius: 16,
      cursor: onClick ? "pointer" : "default", textAlign: "left", fontFamily: "inherit", color: "var(--text)",
    }}>
      <div className="label-cap">{label}</div>
      <div className="num-big" style={{ fontSize: 24, color: color ?? "var(--text)", lineHeight: 1, display: "flex", alignItems: "baseline", gap: 4 }}>
        {value}{unit && <span style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 400 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 10, color: "var(--text-3)" }}>{sub}</div>}
    </button>
  );
}

// ── Field editor modal ────────────────────────────────────────────────────
function FieldEditor({ open, title, fields, values, onSave, onClose }: {
  open: boolean;
  title: string;
  fields: { key: string; label: string; unit?: string; type?: string; step?: number }[];
  values: Record<string, number | string>;
  onSave: (vals: Record<string, number | string>) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<Record<string, number | string>>({});
  useEffect(() => { setLocal(values); }, [values, open]);

  if (!open) return null;

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{
        background: "var(--surface)", padding: 24, borderRadius: 18, minWidth: 320, maxWidth: 480, width: "100%",
      }}>
        <h3 style={{ margin: 0, marginBottom: 16, fontSize: 16, fontWeight: 600 }}>{title}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {fields.map((f) => (
            <div key={f.key}>
              <label style={{ fontSize: 11, color: "var(--text-2)", marginBottom: 4, display: "block" }}>{f.label}{f.unit && ` (${f.unit})`}</label>
              <input
                type={f.type ?? "number"}
                step={f.step ?? 1}
                value={local[f.key] ?? ""}
                onChange={(e) => setLocal({ ...local, [f.key]: f.type === "text" ? e.target.value : Number(e.target.value) })}
                style={{ width: "100%" }}
              />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={btnSecondary}>Annuller</button>
          <button onClick={() => { onSave(local); onClose(); }} style={btnPrimary}>Gem</button>
        </div>
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  padding: "8px 16px", borderRadius: 999, border: 0,
  background: "var(--amber)", color: "var(--amber-ink)",
  fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
};
const btnSecondary: React.CSSProperties = {
  padding: "8px 16px", borderRadius: 999, border: "0.5px solid var(--hairline)",
  background: "transparent", color: "var(--text-2)",
  fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
};

// ── Main dashboard ────────────────────────────────────────────────────────
export default function HealthDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("oversigt");
  const [log, setLog] = useState<HelbedLog | null>(null);
  const [meals, setMeals] = useState<HelbedMeal[]>([]);
  const [supplements, setSupplements] = useState<HelbedSupplement[]>([]);
  const [takenLog, setTakenLog] = useState<Record<string, boolean>>({});
  const [training, setTraining] = useState<HelbedTrainingSession[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalEvent[]>([]);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState<HelbedChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [editor, setEditor] = useState<null | { type: "vitals" | "macros" | "meal" | "training" }>(null);
  const [calendarStatus, setCalendarStatus] = useState<string | null>(null);
  const date = todayISO();

  // Load all data on mount
  useEffect(() => {
    void loadAll();
    const url = new URL(window.location.href);
    const cal = url.searchParams.get("cal");
    if (cal === "ok") setCalendarStatus("Google Kalender tilsluttet!");
    else if (cal === "error") setCalendarStatus("Fejl ved tilslutning af Google Kalender.");
    else if (cal === "notoken") setCalendarStatus("Manglede refresh-token. Prøv igen.");
    if (cal) {
      url.searchParams.delete("cal");
      window.history.replaceState({}, "", url.toString());
      setTimeout(() => setCalendarStatus(null), 5000);
    }
  }, []);

  async function loadAll() {
    const [logRes, mealsRes, suppRes, trainRes, chatRes] = await Promise.all([
      fetch(`/api/admin/helbred/log?date=${date}`).then((r) => r.json()),
      fetch(`/api/admin/helbred/meals?date=${date}`).then((r) => r.json()),
      fetch(`/api/admin/helbred/supplements?date=${date}`).then((r) => r.json()),
      fetch(`/api/admin/helbred/training?date=${date}`).then((r) => r.json()),
      fetch(`/api/admin/helbred/sarah`).then((r) => r.json()),
    ]);
    setLog(logRes.log);
    setMeals(mealsRes.meals);
    setSupplements(suppRes.supplements);
    setTakenLog(suppRes.takenLog);
    setTraining(trainRes.training);
    setChatMessages(chatRes.messages);
  }

  async function loadCalendar() {
    const res = await fetch(`/api/admin/helbred/calendar?date=${date}`);
    const data = await res.json();
    setCalendarConnected(data.connected);
    setCalendarEvents(data.events ?? []);
  }

  useEffect(() => {
    if (activeTab === "kalender") void loadCalendar();
  }, [activeTab]);

  async function saveLog(patch: Partial<HelbedLog>) {
    const res = await fetch(`/api/admin/helbred/log?date=${date}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    setLog(data.log);
  }

  async function toggleSupplement(id: string) {
    const next = { ...takenLog, [id]: !takenLog[id] };
    setTakenLog(next);
    await fetch(`/api/admin/helbred/supplements?date=${date}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ takenLog: next }),
    });
  }

  async function addMeal(meal: Partial<HelbedMeal>) {
    const res = await fetch(`/api/admin/helbred/meals?date=${date}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(meal),
    });
    const data = await res.json();
    setMeals((prev) => [...prev, data.meal]);
  }

  async function deleteMeal(id: string) {
    await fetch(`/api/admin/helbred/meals?date=${date}&id=${id}`, { method: "DELETE" });
    setMeals((prev) => prev.filter((m) => m.id !== id));
  }

  async function addTraining(t: Partial<HelbedTrainingSession>) {
    const res = await fetch(`/api/admin/helbred/training?date=${date}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(t),
    });
    const data = await res.json();
    setTraining((prev) => [...prev, data.session]);
  }

  async function deleteTraining(id: string) {
    await fetch(`/api/admin/helbred/training?date=${date}&id=${id}`, { method: "DELETE" });
    setTraining((prev) => prev.filter((t) => t.id !== id));
  }

  async function sendToSarah(text: string) {
    if (!text.trim() || chatLoading) return;
    const userMsg: HelbedChatMessage = { id: `tmp-${Date.now()}`, role: "user", content: text, createdAt: new Date().toISOString() };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await fetch("/api/admin/helbred/sarah", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, date }),
      });
      const data = await res.json();
      if (data.message) {
        setChatMessages((prev) => [...prev, data.message]);
        // Auto-create calendar events from [BOOK: ...] commands
        if (data.bookings && data.bookings.length > 0 && calendarConnected) {
          for (const b of data.bookings) {
            await fetch("/api/admin/helbred/calendar", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ date, time: b.time, title: b.title, duration: b.duration }),
            });
          }
          if (activeTab === "kalender") await loadCalendar();
        }
      }
    } catch (e) {
      setChatMessages((prev) => [...prev, { id: `err-${Date.now()}`, role: "assistant", content: "Beklager — jeg kunne ikke svare lige nu.", createdAt: new Date().toISOString() }]);
    } finally {
      setChatLoading(false);
    }
  }

  async function clearChat() {
    if (!confirm("Slet hele samtalen med Sarah?")) return;
    await fetch("/api/admin/helbred/sarah", { method: "DELETE" });
    setChatMessages([]);
  }

  if (!log) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-2)" }}>
        Indlæser helbreds-data…
      </div>
    );
  }

  const readinessColor = log.readiness >= 80 ? "#34C759" : log.readiness >= 60 ? "#FAC775" : log.readiness >= 40 ? "#FF9F0A" : "#FF453A";
  const readinessLabel = log.readiness >= 80 ? "Klar til hård indsats" : log.readiness >= 60 ? "Tag den moderat" : log.readiness >= 40 ? "Let dag anbefales" : log.readiness === 0 ? "Ingen data endnu" : "Restitution i dag";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {/* ── Sidebar (desktop ≥ 701px) ── */}
      <aside
        className="hidden min-[701px]:flex flex-col"
        style={{
          width: 240, background: "var(--surface)", borderRight: "0.5px solid var(--hairline-2)",
          padding: "20px 14px", position: "sticky", top: 0, height: "100vh",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 8px 20px" }}>
          <SarahAvatar size={36} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.01 }}>Helbred</div>
            <div style={{ fontSize: 10, color: "var(--text-2)" }}>by Sarah</div>
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="nav-btn"
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                  background: active ? "rgba(250,199,117,0.14)" : "transparent",
                  border: 0, borderRadius: 10, cursor: "pointer",
                  color: active ? "var(--amber)" : "var(--text-2)",
                  fontFamily: "inherit", textAlign: "left",
                  fontSize: 13, fontWeight: active ? 600 : 500,
                  transition: "background .15s, color .15s",
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <Link href="/admin" style={{
          padding: "8px 12px", color: "var(--text-3)", fontSize: 11, textDecoration: "none",
          borderTop: "0.5px solid var(--hairline-2)", marginTop: 10, paddingTop: 14,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          ← Tilbage til KrydsByg admin
        </Link>
      </aside>

      {/* ── Mobile bottom nav (< 701px) ── */}
      <nav
        className="flex min-[701px]:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "var(--surface)", borderTop: "0.5px solid var(--hairline-2)",
          paddingBottom: "env(safe-area-inset-bottom, 0)",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                flex: 1, padding: "10px 4px", background: "transparent", border: 0,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                color: active ? "var(--amber)" : "var(--text-3)", cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.06 }}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Main ── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", paddingBottom: 80 }}>
        {/* Header */}
        <header style={{
          padding: "18px 28px", display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "0.5px solid var(--hairline-2)", background: "var(--bg)",
        }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-2)" }}>God dag, Krystian</div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.02, marginTop: 2, textTransform: "capitalize" }}>{todayDanish()}</div>
          </div>
          <button onClick={() => setActiveTab("sarah")} style={{
            padding: "8px 14px", borderRadius: 999, border: 0,
            background: "var(--amber)", color: "var(--amber-ink)", fontSize: 12, fontWeight: 600, cursor: "pointer",
            fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            ✦ Spørg Sarah
          </button>
        </header>

        {calendarStatus && (
          <div style={{ padding: "10px 28px", background: "rgba(52,199,89,0.12)", color: "var(--success)", fontSize: 12 }}>
            {calendarStatus}
          </div>
        )}

        <div style={{ flex: 1, overflow: "auto", padding: "20px 28px 28px" }}>
          {activeTab === "oversigt" && (
            <TabOversigt log={log} readinessColor={readinessColor} readinessLabel={readinessLabel} onEdit={(t) => setEditor({ type: t })} sarahText={sarahDailyText(log)} onAskSarah={(p) => { setActiveTab("sarah"); setTimeout(() => sendToSarah(p), 200); }} />
          )}
          {activeTab === "kost" && (
            <TabKost log={log} meals={meals} onEdit={() => setEditor({ type: "macros" })} onAddMeal={() => setEditor({ type: "meal" })} onDeleteMeal={deleteMeal} />
          )}
          {activeTab === "traening" && (
            <TabTraening training={training} log={log} onAdd={() => setEditor({ type: "training" })} onDelete={deleteTraining} />
          )}
          {activeTab === "kalender" && (
            <TabKalender events={calendarEvents} connected={calendarConnected} onConnect={() => { window.location.href = "/api/admin/helbred/calendar/setup"; }} onRefresh={loadCalendar} />
          )}
          {activeTab === "tilskud" && (
            <TabTilskud supplements={supplements} takenLog={takenLog} onToggle={toggleSupplement} />
          )}
          {activeTab === "sarah" && (
            <TabSarah messages={chatMessages} input={chatInput} setInput={setChatInput} onSend={sendToSarah} loading={chatLoading} onClear={clearChat} />
          )}
        </div>
      </main>

      {/* ── Editors ── */}
      <FieldEditor
        open={editor?.type === "vitals"}
        title="Vitale data"
        fields={[
          { key: "readiness", label: "Readiness", unit: "0-100" },
          { key: "hrv", label: "HRV", unit: "ms" },
          { key: "sleepHours", label: "Søvn timer", step: 1 },
          { key: "sleepMinutes", label: "Søvn minutter", step: 1 },
          { key: "sleepScore", label: "Søvn-score", unit: "0-100" },
          { key: "sleepEfficiency", label: "Søvn-effektivitet", unit: "%" },
          { key: "bodyBattery", label: "Body Battery", unit: "0-100" },
          { key: "restingHr", label: "Hvilepuls", unit: "bpm" },
          { key: "steps", label: "Skridt" },
        ]}
        values={log as unknown as Record<string, number | string>}
        onSave={(v) => saveLog(v as unknown as Partial<HelbedLog>)}
        onClose={() => setEditor(null)}
      />

      <FieldEditor
        open={editor?.type === "macros"}
        title="Kalorier & makro"
        fields={[
          { key: "caloriesEaten", label: "Kalorier spist", unit: "kcal" },
          { key: "calorieTarget", label: "Kalorie-mål", unit: "kcal" },
          { key: "proteinNow", label: "Protein", unit: "g" },
          { key: "proteinGoal", label: "Protein-mål", unit: "g" },
          { key: "carbsNow", label: "Kulhydrater", unit: "g" },
          { key: "carbsGoal", label: "Kulhydrat-mål", unit: "g" },
          { key: "fatNow", label: "Fedt", unit: "g" },
          { key: "fatGoal", label: "Fedt-mål", unit: "g" },
          { key: "waterNow", label: "Vand", unit: "L", step: 0.1 },
        ]}
        values={log as unknown as Record<string, number | string>}
        onSave={(v) => saveLog(v as unknown as Partial<HelbedLog>)}
        onClose={() => setEditor(null)}
      />

      <FieldEditor
        open={editor?.type === "meal"}
        title="Tilføj måltid"
        fields={[
          { key: "time", label: "Tidspunkt", type: "time" },
          { key: "name", label: "Navn", type: "text" },
          { key: "items", label: "Ingredienser", type: "text" },
          { key: "kcal", label: "Kalorier", unit: "kcal" },
          { key: "protein", label: "Protein", unit: "g" },
          { key: "carbs", label: "Kulhydrater", unit: "g" },
          { key: "fat", label: "Fedt", unit: "g" },
        ]}
        values={{ time: "12:00", name: "", items: "", kcal: 0, protein: 0, carbs: 0, fat: 0 }}
        onSave={(v) => addMeal(v as unknown as Partial<HelbedMeal>)}
        onClose={() => setEditor(null)}
      />

      <FieldEditor
        open={editor?.type === "training"}
        title="Tilføj træning"
        fields={[
          { key: "time", label: "Tidspunkt", type: "time" },
          { key: "type", label: "Type", type: "text" },
          { key: "subtitle", label: "Beskrivelse", type: "text" },
          { key: "duration", label: "Varighed", unit: "min" },
        ]}
        values={{ time: "12:00", type: "", subtitle: "", duration: 45 }}
        onSave={(v) => addTraining(v as unknown as Partial<HelbedTrainingSession>)}
        onClose={() => setEditor(null)}
      />
    </div>
  );
}

// ── Navigation ───────────────────────────────────────────────────────────
const NAV_ITEMS: { id: Tab; label: string; icon: string }[] = [
  { id: "oversigt", label: "Oversigt", icon: "◐" },
  { id: "kost", label: "Kost", icon: "◉" },
  { id: "traening", label: "Træning", icon: "◊" },
  { id: "kalender", label: "Kalender", icon: "▦" },
  { id: "tilskud", label: "Tilskud", icon: "○" },
  { id: "sarah", label: "Sarah", icon: "✦" },
];

// ── Sarah daily text generator ────────────────────────────────────────────
function sarahDailyText(log: HelbedLog): string {
  if (log.readiness === 0 && log.hrv === 0) {
    return "Vi har ingen data endnu i dag. Indtast dine vitale tal i Oversigt-fanen, så kommer jeg med konkrete anbefalinger til træning, kost og restitution.";
  }
  const r = log.readiness;
  if (r >= 80) return `Stærk readiness på ${r}/100. Du er klar til hård træning i dag — gå hårdt til den hvis du har en tung session planlagt.`;
  if (r >= 60) return `Moderat readiness (${r}/100). HRV ligger på ${log.hrv} ms. Lad os tage træningen som teknik eller let aerobic — undgå max-intensitet i dag.`;
  if (r >= 40) return `Lav readiness (${r}/100). Din HRV på ${log.hrv} ms tyder på stress. Skift til let aktivitet, fokuser på protein + søvn, og tag Ashwagandha aften.`;
  return `Restitution i dag (${r}/100). Spring planlagt træning over. Prioriter søvn (mål: 8t+), magnesium og lav stress-modulation.`;
}

// ════════════════════════════════════════════════════════════════════════
// TAB: OVERSIGT
// ════════════════════════════════════════════════════════════════════════
function TabOversigt({ log, readinessColor, readinessLabel, onEdit, sarahText, onAskSarah }: {
  log: HelbedLog; readinessColor: string; readinessLabel: string;
  onEdit: (t: "vitals" | "macros") => void; sarahText: string; onAskSarah: (p: string) => void;
}) {
  const stepsBar = log.stepsGoal > 0 ? Math.min(100, (log.steps / log.stepsGoal) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1280 }}>
      {/* Hero: Readiness */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)", gap: 16 }} className="grid-collapse">
        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="label-cap">Readiness · i dag</span>
            <button onClick={() => onEdit("vitals")} style={btnGhost}>Rediger</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            <Ring size={150} stroke={12} value={log.readiness} color={readinessColor}>
              <div style={{ textAlign: "center" }}>
                <div className="num-big" style={{ fontSize: 44, lineHeight: 1, letterSpacing: -0.03 }}>{log.readiness}</div>
                <div style={{ fontSize: 9, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: 0.08, fontWeight: 600, marginTop: 4 }}>af 100</div>
              </div>
            </Ring>
            <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 13, color: "var(--text-2)" }}>{readinessLabel}</div>
              {[
                { l: "Søvn", v: log.sleepScore, c: "var(--light-sleep)" },
                { l: "HRV", v: log.hrv, c: "var(--hrv)" },
                { l: "Skridt", v: stepsBar, c: "var(--steps)" },
                { l: "Body Battery", v: log.bodyBattery, c: "var(--amber)" },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, color: "var(--text-2)", width: 92, fontWeight: 500 }}>{s.l}</span>
                  <div style={{ flex: 1, height: 6, background: "var(--surface-3)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, s.v)}%`, background: s.c, borderRadius: 3, transition: "width .6s" }} />
                  </div>
                  <span className="num-big" style={{ fontSize: 13, fontWeight: 600, width: 28, textAlign: "right" }}>{Math.round(s.v)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <SarahCard text={sarahText} prompts={["Tilpas dagen", "Forklar min HRV"]} onPrompt={onAskSarah} />
      </div>

      {/* Stat grid */}
      <div>
        <div className="label-cap" style={{ marginBottom: 10 }}>I dag</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          <StatCard label="Skridt" value={log.steps.toLocaleString("da")} sub={`af ${log.stepsGoal.toLocaleString("da")}`} color="var(--steps)" onClick={() => onEdit("vitals")} />
          <StatCard label="Hvilepuls" value={log.restingHr || "—"} unit="bpm" color="var(--heart)" onClick={() => onEdit("vitals")} />
          <StatCard label="Søvn i nat" value={log.sleepHours || log.sleepMinutes ? `${log.sleepHours}t ${log.sleepMinutes}m` : "—"} sub={log.sleepEfficiency ? `${log.sleepEfficiency}% effektiv` : ""} color="var(--deep-sleep)" onClick={() => onEdit("vitals")} />
          <StatCard label="Kalorier tilbage" value={(log.calorieTarget - log.caloriesEaten).toLocaleString("da")} sub={`mål: ${log.calorieTarget.toLocaleString("da")}`} color="var(--cal)" onClick={() => onEdit("macros")} />
          <StatCard label="HRV" value={log.hrv || "—"} unit="ms" color="var(--hrv)" onClick={() => onEdit("vitals")} />
          <StatCard label="VO₂max" value={log.vo2max || "—"} color="var(--success)" onClick={() => onEdit("vitals")} />
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// TAB: KOST
// ════════════════════════════════════════════════════════════════════════
function TabKost({ log, meals, onEdit, onAddMeal, onDeleteMeal }: {
  log: HelbedLog; meals: HelbedMeal[];
  onEdit: () => void; onAddMeal: () => void; onDeleteMeal: (id: string) => void;
}) {
  const remaining = log.calorieTarget - log.caloriesEaten;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 980 }}>
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span className="label-cap">Dagens energi</span>
          <button onClick={onEdit} style={btnGhost}>Rediger makro</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <Ring size={140} stroke={11} value={log.caloriesEaten} max={log.calorieTarget || 2200} color="var(--cal)">
            <div style={{ textAlign: "center" }}>
              <div className="num-big" style={{ fontSize: 24, lineHeight: 1 }}>{remaining}</div>
              <div style={{ fontSize: 10, color: "var(--text-2)", marginTop: 3 }}>kcal tilbage</div>
            </div>
          </Ring>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 11, color: "var(--text-2)", marginBottom: 4 }}>spist i dag</div>
            <div className="num-big" style={{ fontSize: 30, lineHeight: 1, marginBottom: 4 }}>{log.caloriesEaten.toLocaleString("da")}</div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>af {log.calorieTarget.toLocaleString("da")} kcal</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
              {[
                { l: "Protein", n: log.proteinNow, g: log.proteinGoal, c: "var(--protein)" },
                { l: "Kulhydrater", n: log.carbsNow, g: log.carbsGoal, c: "var(--carb)" },
                { l: "Fedt", n: log.fatNow, g: log.fatGoal, c: "var(--fat)" },
              ].map((m, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{m.l}</span>
                    <span style={{ fontSize: 11, color: "var(--text-2)" }}><b style={{ color: "var(--text)" }}>{m.n}g</b> / {m.g}g</span>
                  </div>
                  <div style={{ height: 5, background: "var(--surface-3)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${m.g > 0 ? Math.min(100, (m.n / m.g) * 100) : 0}%`, background: m.c }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span className="label-cap">Dagens måltider</span>
          <button onClick={onAddMeal} style={btnPrimary}>+ Tilføj måltid</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {meals.length === 0 && (
            <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
              Ingen måltider logget endnu. Klik &apos;Tilføj måltid&apos; for at starte.
            </div>
          )}
          {meals.map((m) => (
            <div key={m.id} className="card" style={{ padding: 14, display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--surface-3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🍽</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</span>
                  <span className="mono" style={{ fontSize: 10, color: "var(--text-3)" }}>{m.time}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-2)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.items}</div>
                <div style={{ display: "flex", gap: 10, marginTop: 4, fontSize: 10, color: "var(--text-3)" }}>
                  <span><b style={{ color: "var(--protein)" }}>P</b> {m.protein}g</span>
                  <span><b style={{ color: "var(--carb)" }}>K</b> {m.carbs}g</span>
                  <span><b style={{ color: "var(--fat)" }}>F</b> {m.fat}g</span>
                </div>
              </div>
              <div style={{ textAlign: "right", marginRight: 8 }}>
                <div className="num-big" style={{ fontSize: 15, fontWeight: 600 }}>{m.kcal}</div>
                <div style={{ fontSize: 9, color: "var(--text-3)" }}>kcal</div>
              </div>
              <button onClick={() => onDeleteMeal(m.id)} style={{ background: "transparent", border: 0, color: "var(--text-3)", cursor: "pointer", fontSize: 16 }} title="Slet">×</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// TAB: TRÆNING
// ════════════════════════════════════════════════════════════════════════
function TabTraening({ training, log, onAdd, onDelete }: {
  training: HelbedTrainingSession[]; log: HelbedLog;
  onAdd: () => void; onDelete: (id: string) => void;
}) {
  const totalMinutes = training.reduce((sum, t) => sum + t.duration, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 980 }}>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <div className="label-cap">I dag</div>
            <div className="num-big" style={{ fontSize: 28, fontWeight: 500, marginTop: 4 }}>{totalMinutes} <span style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 400 }}>min planlagt</span></div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="label-cap">Readiness</div>
            <div className="num-big" style={{ fontSize: 22, fontWeight: 500, marginTop: 4, color: log.readiness >= 60 ? "var(--success)" : "var(--warn)" }}>{log.readiness}/100</div>
          </div>
        </div>
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span className="label-cap">Dagens træningsplan</span>
          <button onClick={onAdd} style={btnPrimary}>+ Tilføj session</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {training.length === 0 && (
            <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
              Ingen træning planlagt i dag.
            </div>
          )}
          {training.map((t) => (
            <div key={t.id} className="card" style={{ padding: 14, display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: t.color ?? "var(--train)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18 }}>◊</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{t.type}</span>
                  {t.adjustedBySarah && <span style={{ fontSize: 9, color: "var(--amber-deep)", fontWeight: 600 }}>· justeret af Sarah</span>}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-2)", marginTop: 2 }}>{t.subtitle}</div>
              </div>
              <div style={{ textAlign: "right", marginRight: 8 }}>
                <div className="num-big" style={{ fontSize: 14, fontWeight: 600 }}>{t.duration} min</div>
                <div className="mono" style={{ fontSize: 9, color: "var(--text-3)" }}>{t.time}</div>
              </div>
              <button onClick={() => onDelete(t.id)} style={{ background: "transparent", border: 0, color: "var(--text-3)", cursor: "pointer", fontSize: 16 }} title="Slet">×</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// TAB: KALENDER
// ════════════════════════════════════════════════════════════════════════
function TabKalender({ events, connected, onConnect, onRefresh }: {
  events: GoogleCalEvent[]; connected: boolean; onConnect: () => void; onRefresh: () => void;
}) {
  if (!connected) {
    return (
      <div className="card" style={{ padding: 32, textAlign: "center", maxWidth: 500, margin: "60px auto" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
        <h3 style={{ margin: 0, marginBottom: 8, fontSize: 18 }}>Tilslut Google Kalender</h3>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 20, lineHeight: 1.5 }}>
          Forbind din Google Kalender, så Sarah kan se din dag og booke træning, måltider og restitution direkte for dig.
        </p>
        <button onClick={onConnect} style={{ ...btnPrimary, padding: "10px 20px", fontSize: 13 }}>
          Tilslut nu
        </button>
        <div style={{ marginTop: 24, fontSize: 11, color: "var(--text-3)", lineHeight: 1.5 }}>
          Husk at sætte GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET og NEXT_PUBLIC_SITE_URL i Vercel env vars først.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 720 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="label-cap">I dag · Google Kalender</span>
        <button onClick={onRefresh} style={btnGhost}>↻ Opdater</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {events.length === 0 && (
          <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
            Ingen begivenheder i kalenderen i dag.
          </div>
        )}
        {events.map((e) => {
          const start = e.start?.dateTime ?? e.start?.date ?? "";
          const end = e.end?.dateTime ?? e.end?.date ?? "";
          const startTime = start.includes("T") ? new Date(start).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" }) : "Hele dagen";
          const dur = start.includes("T") && end.includes("T") ? Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000) : 0;
          return (
            <div key={e.id} className="card" style={{ padding: 14, display: "flex", gap: 14, alignItems: "center", borderLeft: "3px solid var(--work)" }}>
              <div className="mono" style={{ fontSize: 12, color: "var(--text-2)", width: 60 }}>{startTime}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{e.summary ?? "(Uden titel)"}</div>
                {e.description && <div style={{ fontSize: 11, color: "var(--text-2)", marginTop: 2 }}>{e.description.slice(0, 80)}</div>}
              </div>
              {dur > 0 && <div style={{ fontSize: 11, color: "var(--text-3)" }}>{dur} min</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// TAB: TILSKUD
// ════════════════════════════════════════════════════════════════════════
function TabTilskud({ supplements, takenLog, onToggle }: {
  supplements: HelbedSupplement[]; takenLog: Record<string, boolean>; onToggle: (id: string) => void;
}) {
  const morgen = supplements.filter((s) => s.when === "Morgen" && s.active);
  const aften = supplements.filter((s) => s.when === "Aften" && s.active);
  const takenCount = supplements.filter((s) => s.active && takenLog[s.id]).length;
  const total = supplements.filter((s) => s.active).length;

  const Row = ({ s }: { s: HelbedSupplement }) => {
    const taken = !!takenLog[s.id];
    return (
      <button onClick={() => onToggle(s.id)} className="card" style={{
        padding: 14, display: "flex", gap: 14, alignItems: "center", textAlign: "left",
        cursor: "pointer", fontFamily: "inherit", width: "100%",
        background: taken ? "var(--surface-2)" : "var(--surface)",
        border: "0.5px solid var(--hairline-2)", borderRadius: 14,
        opacity: taken ? 0.72 : 1,
      }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${s.color}22`, border: `0.5px solid ${s.color}55`, display: "flex", alignItems: "center", justifyContent: "center", color: s.color, fontSize: 18 }}>○</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, textDecoration: taken ? "line-through" : "none" }}>{s.name}</span>
            {s.sarahPriority && !taken && <span style={{ fontSize: 10, color: "var(--amber-deep)" }}>✦</span>}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-2)", marginTop: 2 }}>
            <span style={{ fontWeight: 500 }}>{s.dose}</span> · {s.reason}
          </div>
        </div>
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          border: `1.5px solid ${taken ? "var(--success)" : "var(--hairline)"}`,
          background: taken ? "var(--success)" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14,
        }}>
          {taken && "✓"}
        </div>
      </button>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 720 }}>
      <div className="card" style={{ padding: 18, display: "flex", alignItems: "center", gap: 16 }}>
        <Ring size={72} stroke={7} value={takenCount} max={total || 1} color="var(--success)">
          <div className="num-big" style={{ fontSize: 18, fontWeight: 500 }}>{takenCount}<span style={{ fontSize: 10, color: "var(--text-2)", fontWeight: 400 }}>/{total}</span></div>
        </Ring>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Dit daglige stack</div>
          <div style={{ fontSize: 11, color: "var(--text-2)", marginTop: 2 }}>Tilpasset søvn, HRV, stress og marathon-træning</div>
        </div>
      </div>

      <div>
        <div className="label-cap" style={{ marginBottom: 10 }}>Morgen</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {morgen.map((s) => <Row key={s.id} s={s} />)}
        </div>
      </div>

      <div>
        <div className="label-cap" style={{ marginBottom: 10 }}>Aften</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {aften.map((s) => <Row key={s.id} s={s} />)}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// TAB: SARAH CHAT
// ════════════════════════════════════════════════════════════════════════
function TabSarah({ messages, input, setInput, onSend, loading, onClear }: {
  messages: HelbedChatMessage[]; input: string; setInput: (s: string) => void;
  onSend: (text: string) => void; loading: boolean; onClear: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loading]);

  const cleanContent = (s: string) => s.replace(/\[BOOK:[^\]]+\]/g, "").trim();

  return (
    <div style={{ display: "flex", flexDirection: "column", maxWidth: 720, margin: "0 auto", height: "100%", minHeight: 500 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <SarahAvatar size={32} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Sarah</div>
            <div style={{ fontSize: 11, color: "var(--text-2)" }}>Din personlige helbreds-AI</div>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={onClear} style={btnGhost}>Ryd samtale</button>
        )}
      </div>

      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 12, padding: "8px 4px" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--text-3)", fontSize: 13, padding: "40px 20px" }}>
            <SarahAvatar size={48} />
            <div style={{ marginTop: 12, fontSize: 14, color: "var(--text-2)" }}>
              Hej Krystian — jeg har adgang til alle dine helbreds-data, måltider, træning og kalender.
            </div>
            <div style={{ marginTop: 8, fontSize: 12 }}>
              Spørg fx: &quot;Hvad skal jeg spise nu?&quot;, &quot;Tilpas træning til min HRV&quot;, eller &quot;Book restitution kl. 19&quot;.
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} style={{
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "85%",
          }}>
            {m.role === "assistant" ? (
              <div style={{
                background: "linear-gradient(135deg, #1a1a1a, #2a2418)",
                border: "0.5px solid rgba(250,199,117,0.15)",
                padding: "12px 16px", borderRadius: "18px 18px 18px 4px",
                fontSize: 13, lineHeight: 1.5, color: "#e8e6e0", whiteSpace: "pre-wrap",
              }}>
                {cleanContent(m.content)}
              </div>
            ) : (
              <div style={{
                background: "var(--amber)", color: "var(--amber-ink)",
                padding: "10px 14px", borderRadius: "18px 18px 4px 18px",
                fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap",
              }}>
                {m.content}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start", padding: "12px 16px", background: "var(--surface)", borderRadius: 18 }}>
            <span className="typing-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--amber)", display: "inline-block", margin: "0 2px" }} />
            <span className="typing-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--amber)", display: "inline-block", margin: "0 2px" }} />
            <span className="typing-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--amber)", display: "inline-block", margin: "0 2px" }} />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12, padding: "12px 4px", borderTop: "0.5px solid var(--hairline-2)" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(input); } }}
          placeholder="Spørg Sarah om din dag…"
          style={{ flex: 1 }}
          disabled={loading}
        />
        <button onClick={() => onSend(input)} disabled={loading || !input.trim()} style={{ ...btnPrimary, opacity: loading || !input.trim() ? 0.5 : 1 }}>
          Send
        </button>
      </div>
    </div>
  );
}

const btnGhost: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: "var(--amber-deep)",
  background: "transparent", border: 0, cursor: "pointer", fontFamily: "inherit",
};
