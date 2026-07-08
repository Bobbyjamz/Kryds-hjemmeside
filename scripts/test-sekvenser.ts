import { SEKVENSER, udfyld, vaelgSekvens, BREV } from "../lib/outreach/sekvenser";

const noegler = Object.keys(SEKVENSER).sort().join("");
const trin = Object.values(SEKVENSER).flat().length;
console.log("TS-kanon:", noegler, "|", trin, "trin | BREV:", BREV.length, "tegn");
if (noegler !== "ABCDEF" || trin !== 14) throw new Error("paritet fejlet");

const t = udfyld("Hej {{fornavn}}, folk i {{kvartal}}?", { fornavn: "Lars", kvartal: "Q3 2026" });
if (t !== "Hej Lars, folk i Q3 2026?") throw new Error("udfyld: " + t);

if (vaelgSekvens("Andelsforening") !== "C") throw new Error("valg C");
if (vaelgSekvens("Byggeentreprenør") !== "A") throw new Error("valg A");
if (vaelgSekvens("Restaurant") !== "B") throw new Error("valg B");
console.log("PARITET + UDFYLD + VALG: OK");
