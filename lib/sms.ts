export async function sendSMS(
  to: string,
  message: string
): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.SMS_API_KEY) {
    console.log(`[SMS stub] ${to}: ${message}`);
    return { ok: true };
  }
  // TODO: integrer SMS-udbyder (GatewayAPI, Twilio, 46elks)
  return { ok: true };
}
