export function computeWebhookSignature(payload: string, secret: string) {
  return new Bun.CryptoHasher("sha256", secret).update(payload).digest("base64url");
}
