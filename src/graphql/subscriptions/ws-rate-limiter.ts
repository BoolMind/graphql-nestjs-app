const WINDOW_MS = 60_000;
const MAX_CONNECTIONS_PER_WINDOW = 20;

const connectionAttempts = new Map<string, number[]>();

function cleanupExpiredAttempts(now: number): void {
  for (const [ip, timestamps] of connectionAttempts) {
    const recent = timestamps.filter(
      (timestamp) => now - timestamp < WINDOW_MS,
    );

    if (recent.length === 0) {
      connectionAttempts.delete(ip);
    } else {
      connectionAttempts.set(ip, recent);
    }
  }
}

export function isWsConnectionAllowed(ip: string): boolean {
  const now = Date.now();

  const normalizedIp = ip.trim() || 'unknown';

  const recent = (connectionAttempts.get(normalizedIp) ?? []).filter(
    (timestamp) => now - timestamp < WINDOW_MS,
  );

  recent.push(now);
  connectionAttempts.set(normalizedIp, recent);

  if (connectionAttempts.size % 100 === 0) {
    cleanupExpiredAttempts(now);
  }

  return recent.length <= MAX_CONNECTIONS_PER_WINDOW;
}
