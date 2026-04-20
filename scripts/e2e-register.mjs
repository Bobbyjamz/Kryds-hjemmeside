// E2E test for /api/register
const fakeJpg = Buffer.alloc(1024, 0xAB).toString("base64");
const fakePdf = Buffer.from("%PDF-1.4\n%fake pdf for testing\n" + "x".repeat(900)).toString("base64");

const body = {
  name: "E2E Test Bruger",
  phone: "+45 99 99 99 99",
  email: "krys00305@gmail.com",
  birthDate: "1990-05-15",
  trade: "Renovering",
  skills: ["Maling", "Spartling"],
  experience: "5 års erfaring fra byggepladser i København.",
  notes: "E2E test note",
  photoFile: fakeJpg,
  photoName: "test-photo.jpg",
  photoType: "image/jpeg",
  cvFile: fakePdf,
  cvName: "test-cv.pdf",
  cvType: "application/pdf",
  references: [{ name: "Test Ref", company: "RefCo", phone: "+45 12 12 12 12" }],
  acceptedTerms: true,
};

const res = await fetch("http://localhost:3001/api/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const text = await res.text();
console.log("STATUS:", res.status);
console.log("RESPONSE:", text);
