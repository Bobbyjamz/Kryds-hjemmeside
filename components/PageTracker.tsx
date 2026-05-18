"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { hasAnalyticsConsent, onConsentChange } from "@/lib/consent";

export default function PageTracker() {
  const pathname = usePathname();
  const visitIdRef = useRef<string | null>(null);
  const startRef = useRef<number>(Date.now());
  const [consented, setConsented] = useState(false);

  // Hold styr på consent-status (initial + ved ændringer)
  useEffect(() => {
    setConsented(hasAnalyticsConsent());
    return onConsentChange((state) => setConsented(state === "accepted"));
  }, []);

  useEffect(() => {
    // Spring helt over hvis ingen consent eller admin-side
    if (!consented) return;
    if (pathname.startsWith("/admin")) return;

    startRef.current = Date.now();
    visitIdRef.current = null;

    const referrer = typeof document !== "undefined" ? document.referrer : "";

    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, referrer }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.id) visitIdRef.current = d.id;
      })
      .catch(() => {});

    const sendDuration = () => {
      const id = visitIdRef.current;
      if (!id) return;
      const seconds = Math.round((Date.now() - startRef.current) / 1000);
      if (seconds < 1) return;
      navigator.sendBeacon(
        "/api/analytics",
        JSON.stringify({ id, duration: seconds })
      );
    };

    window.addEventListener("pagehide", sendDuration);
    return () => {
      sendDuration();
      window.removeEventListener("pagehide", sendDuration);
    };
  }, [pathname, consented]);

  return null;
}
