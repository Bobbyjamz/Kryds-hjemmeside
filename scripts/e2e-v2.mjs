// E2E: CV DOCX upload, empty-type fallback, mobile contact
const base = "http://localhost:3000";

async function uploadCv(filename, type, bytes) {
  const blob = new Blob([bytes], type ? { type } : {});
  const fd = new FormData();
  fd.append("file", blob, filename);
  fd.append("kind", "cv");
  const res = await fetch(`${base}/api/upload`, { method: "POST", body: fd });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function mobileContact() {
  const res = await fetch(`${base}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      virksomhed: "",
      kontaktperson: "",
      email: "",
      telefon: "+45 99 88 77 66",
      opgavetype: "Renovering",
      antal: "1",
      startdato: "2026-05-01",
      beskrivelse: "Test from mobile",
      acceptedTerms: true,
      contractVersion: "mobile-v1",
    }),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

const docxBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00, 0x08, 0x00]);

console.log("1) DOCX with correct MIME:");
console.log(JSON.stringify(await uploadCv("test.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", docxBytes)).slice(0, 200));

console.log("\n2) PDF with empty MIME (phone fallback):");
console.log(JSON.stringify(await uploadCv("cv.pdf", "", new Uint8Array([0x25, 0x50, 0x44, 0x46]))).slice(0, 200));

console.log("\n3) RTF:");
console.log(JSON.stringify(await uploadCv("letter.rtf", "application/rtf", new Uint8Array([0x7b, 0x5c, 0x72, 0x74, 0x66]))).slice(0, 200));

console.log("\n4) Mobile quick-book (phone only, empty email):");
console.log(JSON.stringify(await mobileContact()));
