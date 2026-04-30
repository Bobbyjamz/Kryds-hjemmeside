/**
 * SMS via GatewayAPI.dk
 *
 * Setup på Vercel:
 *   GATEWAYAPI_TOKEN  = din REST API token fra gatewayapi.dk
 *   GATEWAYAPI_SENDER = sender-navn (max 11 tegn, kun [a-zA-Z0-9]) — fx "KrydsByg"
 *   ADMIN_PHONE       = nummer der modtager admin-notifikationer (fx "4542778866", uden +)
 */

interface GatewayAPIResponse {
  ids?: number[];
  usage?: { total_cost: number; currency: string };
  code?: string;
  message?: string;
}

/** Normaliser nummer til GatewayAPI format (uden +, kun cifre) */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // Hvis det starter med 45 og er 10 cifre → OK
  if (digits.startsWith("45") && digits.length === 10) return digits;
  // Hvis det er et 8-cifret DK nummer → tilføj 45 prefix
  if (digits.length === 8) return "45" + digits;
  // Ellers brug som det er (international format)
  return digits;
}

export async function sendSMS(
  to: string,
  message: string
): Promise<{ ok: boolean; error?: string; smsId?: number }> {
  const token = process.env.GATEWAYAPI_TOKEN;
  const sender = process.env.GATEWAYAPI_SENDER ?? "KrydsByg";

  if (!token) {
    console.log(`[SMS stub — ingen GATEWAYAPI_TOKEN] ${to}: ${message}`);
    return { ok: true };
  }

  const phone = normalizePhone(to);
  if (!phone || phone.length < 8) {
    return { ok: false, error: `Ugyldigt telefonnummer: ${to}` };
  }

  try {
    const res = await fetch("https://gatewayapi.com/rest/mtsms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // GatewayAPI bruger Basic auth med token som username, blank password
        Authorization: "Basic " + Buffer.from(token + ":").toString("base64"),
      },
      body: JSON.stringify({
        sender,
        message,
        recipients: [{ msisdn: parseInt(phone, 10) }],
      }),
    });

    const data = (await res.json()) as GatewayAPIResponse;

    if (!res.ok) {
      const errMsg = data.message || `HTTP ${res.status}`;
      console.error(`[SMS GatewayAPI fejl] ${phone}: ${errMsg}`);
      return { ok: false, error: errMsg };
    }

    return { ok: true, smsId: data.ids?.[0] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[SMS netværksfejl] ${phone}:`, msg);
    return { ok: false, error: msg };
  }
}

/**
 * Send SMS til admin (fra ADMIN_PHONE env var).
 * Bruges til notifikationer om vigtige hændelser på platformen.
 * Fejler stille hvis ADMIN_PHONE ikke er sat — så det ikke bryder andre flows.
 */
export async function notifyAdmin(message: string): Promise<void> {
  const adminPhone = process.env.ADMIN_PHONE;
  if (!adminPhone) {
    console.log(`[Admin SMS stub — ingen ADMIN_PHONE] ${message}`);
    return;
  }
  try {
    const result = await sendSMS(adminPhone, message);
    if (!result.ok) {
      console.error(`[Admin SMS fejl] ${result.error}`);
    }
  } catch (err) {
    console.error(`[Admin SMS exception]`, err);
  }
}
