"use client";

import { useEffect, useState, FormEvent } from "react";

interface FeedItem {
  id: string;
  title: string;
  body: string;
  authorName: string;
  priority: "normal" | "urgent";
  createdAt: string;
}

export default function AdminFeedPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [authorName, setAuthorName] = useState("Admin");
  const [priority, setPriority] = useState<"normal" | "urgent">("normal");
  const [sendEmail, setSendEmail] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/admin/feed");
      if (res.ok) setItems(await res.json());
    } catch {}
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setStatus("sending");
    setMessage(null);

    try {
      const res = await fetch("/api/admin/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, authorName, priority }),
      });
      if (!res.ok) {
        setStatus("error");
        setMessage("Kunne ikke gemme besked");
        return;
      }

      if (sendEmail) {
        const br = await fetch("/api/admin/broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, body, priority }),
        });
        if (br.ok) {
          const data = await br.json();
          setMessage(`Besked gemt. Email sendt til ${data.sent || 0} medarbejdere.`);
        } else {
          setMessage("Besked gemt — email-afsendelse fejlede.");
        }
      } else {
        setMessage("Besked gemt.");
      }

      setStatus("success");
      setTitle("");
      setBody("");
      setPriority("normal");
      setSendEmail(false);
      load();
    } catch {
      setStatus("error");
      setMessage("Noget gik galt");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Slet denne besked?")) return;
    const res = await fetch("/api/admin/feed", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) load();
  }

  return (
    <div>
      <div className="mb-10 max-[700px]:mb-6">
        <p className="font-condensed font-semibold text-[11px] tracking-[.22em] uppercase text-yellow mb-2">Feed</p>
        <h1 className="font-condensed font-black text-[44px] max-[700px]:text-[28px] uppercase tracking-[-.01em] text-cream leading-none break-words">
          Meddelelser til personalet
        </h1>
        <p className="text-[14px] text-muted mt-3 max-w-[540px]">
          Skriv beskeder der vises øverst på medarbejdernes dashboard. Du kan også sende dem som email til alle aktive medarbejdere.
        </p>
      </div>

      <section className="mb-12">
        <div className="bg-gray border border-[var(--border)] rounded-[2px] p-6 max-w-[720px]">
          <h2 className="font-condensed font-extrabold text-[16px] uppercase tracking-[.04em] text-cream mb-4">Ny besked</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              required
              placeholder="Titel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-black border border-[var(--border)] text-cream text-[15px] px-3 py-[10px] rounded-[2px] outline-none focus:border-yellow transition-colors"
            />
            <textarea
              required
              placeholder="Beskedtekst..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="bg-black border border-[var(--border)] text-cream text-[15px] px-3 py-[10px] rounded-[2px] outline-none focus:border-yellow transition-colors resize-y"
            />
            <input
              type="text"
              placeholder="Afsender-navn"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="bg-black border border-[var(--border)] text-cream text-[15px] px-3 py-[10px] rounded-[2px] outline-none focus:border-yellow transition-colors"
            />
            <div className="flex flex-wrap gap-4 items-center">
              <label className="flex items-center gap-2 text-[13px] text-cream cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  checked={priority === "normal"}
                  onChange={() => setPriority("normal")}
                />
                Normal
              </label>
              <label className="flex items-center gap-2 text-[13px] text-cream cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  checked={priority === "urgent"}
                  onChange={() => setPriority("urgent")}
                />
                <span className="text-yellow font-bold">Vigtig</span>
              </label>
              <label className="flex items-center gap-2 text-[13px] text-cream cursor-pointer ml-auto">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                />
                Send email til alle medarbejdere
              </label>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <button
                type="submit"
                disabled={status === "sending"}
                className="bg-yellow text-black font-condensed font-extrabold text-[12px] tracking-[.12em] uppercase px-6 py-[11px] rounded-[2px] hover:bg-yellow2 disabled:opacity-40 transition-colors"
                style={{ minHeight: 44 }}
              >
                {status === "sending" ? "Sender..." : "Gem besked"}
              </button>
              {message && (
                <p className={`text-[13px] ${status === "error" ? "text-red-400" : "text-yellow"}`}>{message}</p>
              )}
            </div>
          </form>
        </div>
      </section>

      <section>
        <h2 className="font-condensed font-extrabold text-[22px] uppercase tracking-[.04em] text-cream mb-4">Tidligere beskeder</h2>
        {items.length === 0 ? (
          <p className="text-muted text-[14px]">Ingen beskeder endnu.</p>
        ) : (
          <ul className="space-y-3 max-w-[720px]">
            {items.map((msg) => (
              <li
                key={msg.id}
                className={`p-5 rounded-[2px] border ${
                  msg.priority === "urgent"
                    ? "border-yellow bg-[rgba(245,196,0,.06)]"
                    : "border-[var(--border)] bg-gray"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {msg.priority === "urgent" && (
                      <span className="font-condensed font-bold text-[10px] tracking-[.2em] uppercase text-yellow mb-2 block">
                        Vigtigt
                      </span>
                    )}
                    <h3 className="font-condensed font-extrabold text-[16px] uppercase tracking-[.02em] text-cream mb-2">
                      {msg.title}
                    </h3>
                    <p className="text-[14px] text-muted leading-[1.6] whitespace-pre-wrap">{msg.body}</p>
                    <p className="text-[11px] text-muted mt-3">
                      {msg.authorName} · {new Date(msg.createdAt).toLocaleString("da-DK")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(msg.id)}
                    className="font-condensed font-semibold text-[11px] tracking-[.15em] uppercase text-muted border border-[var(--border)] hover:text-red-400 hover:border-red-400 px-3 py-2 rounded-[2px] transition-colors"
                  >
                    Slet
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
