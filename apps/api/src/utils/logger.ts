export function jsonLog(level: "info" | "error", message: string, data?: Record<string, unknown>) {
  const payload = {
    level,
    message,
    service: "api",
    timestamp: new Date().toISOString(),
    ...data,
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload));
}

export function generateCorrelationId() {
  return crypto.randomUUID();
}
