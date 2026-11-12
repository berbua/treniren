// Site-wide password gate (SITE_PASSWORD env var). Runs in middleware (edge) and the /api/gate route,
// so it only uses Web Crypto. Without SITE_PASSWORD the gate is off (local development).

export const SITE_GATE_COOKIE = 'site-gate'
export const SITE_GATE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

// Paths reachable without passing the gate: the gate itself and what the browser/PWA loads on its own
const GATE_EXEMPT_PREFIXES = ['/gate', '/api/gate', '/manifest.json', '/sw.js', '/icons/', '/icon-', '/favicon.ico']

export const isGateExempt = (pathname: string) => GATE_EXEMPT_PREFIXES.some(prefix => pathname.startsWith(prefix))

/**
 * Cookie value proving the visitor knew the password: HMAC of the password, keyed with NEXTAUTH_SECRET.
 * Changing SITE_PASSWORD (or the secret) signs everyone out of the gate.
 */
export async function siteGateToken(password: string): Promise<string> {
  const secret = process.env.NEXTAUTH_SECRET || 'site-gate'
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(password))
  return Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, '0')).join('')
}

/** Only same-site paths are allowed as the redirect after the gate. */
export const safeNextPath = (next: string | null | undefined) =>
  next && next.startsWith('/') && !next.startsWith('//') ? next : '/'
