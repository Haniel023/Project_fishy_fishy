// Trusted time: the game host's HTTP Date header corrects the device clock. Not persisted.
let offset = 0; // server time - device time, ms

export const gameNow = () => Date.now() + offset;
export const tzOffset = () => new Date().getTimezoneOffset(); // minutes; local calendar day for dayKey

// HEAD request to our own host. Returns server ms, or null when offline / no Date header.
export async function syncClock(): Promise<number | null> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 3000);
  try {
    const res = await fetch(location.pathname + '?t=' + Date.now(), { method: 'HEAD', cache: 'no-store', signal: ctl.signal });
    const server = Date.parse(res.headers.get('date') ?? '');
    if (Number.isNaN(server)) return null;
    offset = server - Date.now();
    return server;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
