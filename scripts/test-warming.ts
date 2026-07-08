import { dagligtLoft } from "../lib/outreach/warming";

const s = new Date("2026-07-08");
const tests: [string, number][] = [
  ["2026-07-08", 20], ["2026-07-14", 20], ["2026-07-15", 50],
  ["2026-07-22", 100], ["2026-07-29", 200], ["2026-12-01", 200],
  ["2026-07-01", 0],
];
for (const [d, forventet] of tests) {
  const fik = dagligtLoft(s, new Date(d));
  if (fik !== forventet) { console.error("FEJL", d, fik, "!=", forventet); process.exit(1); }
}
console.log("WARMING-KURVE: ALLE 7 OK");
