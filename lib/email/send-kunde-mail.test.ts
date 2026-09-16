import { describe, it, expect, vi, beforeEach } from "vitest";

const sendMock = vi.hoisted(() => vi.fn());
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

import { sendKundeMail, STANDARD_BCC } from "./send-kunde-mail";

const mail = {
  from: "KrydsByg <kontakt@krydsbyg.com>",
  to: "kunde@firma.dk",
  subject: "Emne",
  html: "<p>Hej</p>",
  text: "Hej",
};

describe("sendKundeMail", () => {
  beforeEach(() => {
    sendMock.mockReset();
    delete process.env.KUNDEMAIL_BCC;
  });

  it("sætter altid blind kopi til Krystians indbakke", async () => {
    sendMock.mockResolvedValue({ data: { id: "abc" }, error: null });
    await sendKundeMail(mail);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["kunde@firma.dk"],
        bcc: [STANDARD_BCC],
        replyTo: "kontakt@krydsbyg.com",
      }),
    );
  });

  it("bruger KUNDEMAIL_BCC når den er sat", async () => {
    process.env.KUNDEMAIL_BCC = "test@krydsbyg.com";
    sendMock.mockResolvedValue({ data: { id: "abc" }, error: null });
    await sendKundeMail(mail);
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ bcc: ["test@krydsbyg.com"] }));
  });

  it("returnerer ok med id ved succes", async () => {
    sendMock.mockResolvedValue({ data: { id: "abc" }, error: null });
    expect(await sendKundeMail(mail)).toEqual({ ok: true, id: "abc" });
  });

  it("returnerer Resends fejl i stedet for at melde succes", async () => {
    sendMock.mockResolvedValue({ data: null, error: { name: "validation_error", message: "Domain not verified" } });
    expect(await sendKundeMail(mail)).toEqual({ ok: false, error: "Domain not verified" });
  });

  it("returnerer fejl når kaldet kaster", async () => {
    sendMock.mockRejectedValue(new Error("netværk nede"));
    expect(await sendKundeMail(mail)).toEqual({ ok: false, error: "netværk nede" });
  });
});
