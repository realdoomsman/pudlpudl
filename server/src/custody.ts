// Custodial accounts: sign in with Google, get a Solana wallet the server
// keeps for you. Keys are encrypted at rest (AES-256-GCM under a master key);
// sessions are bearer tokens. Same shape that ran Elegans' custody, ported to
// Solana keypairs.

import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import { Keypair } from '@solana/web3.js'

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')
fs.mkdirSync(DATA_DIR, { recursive: true })

// Master key: env (hex, 32 bytes) in prod. A dev-only fallback key is generated
// and persisted OUTSIDE the data dir (so it never sits next to the ciphertext it
// protects), 0600. In production a missing PUDL_MASTER_KEY is fatal — we refuse
// to boot rather than silently mint a throwaway key that would orphan every
// custodial wallet on the next restart.
function loadMasterKey(): Buffer {
  const envKey = process.env.PUDL_MASTER_KEY
  if (envKey) {
    const buf = Buffer.from(envKey.trim(), 'hex')
    if (buf.length !== 32) {
      throw new Error('PUDL_MASTER_KEY must be 32 bytes of hex (64 hex chars)')
    }
    return buf
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('PUDL_MASTER_KEY is required in production — refusing to start with an ephemeral key')
  }
  // dev fallback: a stable key kept out of DATA_DIR, owner-only
  const p = path.join(process.cwd(), '.pudl-dev-master.key')
  if (fs.existsSync(p)) {
    const buf = Buffer.from(fs.readFileSync(p, 'utf8').trim(), 'hex')
    if (buf.length === 32) return buf
  }
  const k = crypto.randomBytes(32)
  fs.writeFileSync(p, k.toString('hex'), { mode: 0o600 })
  return k
}
const MASTER = loadMasterKey()

interface Enc {
  iv: string
  tag: string
  ct: string
}
export interface Account {
  sub: string // google subject id — the primary key
  email: string
  name: string
  picture: string | null
  pubkey: string
  enc: Enc // encrypted ed25519 secret key
  createdAt: number
}

const ACCOUNTS_PATH = path.join(DATA_DIR, 'accounts.json')
const accounts = new Map<string, Account>()
try {
  const raw = JSON.parse(fs.readFileSync(ACCOUNTS_PATH, 'utf8')) as Account[]
  for (const a of raw) accounts.set(a.sub, a)
} catch {}

function saveAccounts() {
  const tmp = ACCOUNTS_PATH + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify([...accounts.values()]))
  fs.renameSync(tmp, ACCOUNTS_PATH)
}

function encrypt(secret: Uint8Array): Enc {
  const iv = crypto.randomBytes(12)
  const c = crypto.createCipheriv('aes-256-gcm', MASTER, iv)
  const ct = Buffer.concat([c.update(Buffer.from(secret)), c.final()])
  return { iv: iv.toString('hex'), tag: c.getAuthTag().toString('hex'), ct: ct.toString('hex') }
}

function decrypt(e: Enc): Uint8Array {
  const d = crypto.createDecipheriv('aes-256-gcm', MASTER, Buffer.from(e.iv, 'hex'))
  d.setAuthTag(Buffer.from(e.tag, 'hex'))
  return new Uint8Array(Buffer.concat([d.update(Buffer.from(e.ct, 'hex')), d.final()]))
}

// ---------------------------------------------------------------- google

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''

export async function verifyGoogle(credential: string): Promise<{
  sub: string
  email: string
  name: string
  picture: string | null
} | null> {
  try {
    const res = await fetch(
      'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(credential),
    )
    if (!res.ok) return null
    const t: any = await res.json()
    if (!GOOGLE_CLIENT_ID || t.aud !== GOOGLE_CLIENT_ID) return null
    if (t.iss !== 'https://accounts.google.com' && t.iss !== 'accounts.google.com') return null
    if (t.email_verified !== 'true' && t.email_verified !== true) return null
    return {
      sub: String(t.sub),
      email: String(t.email),
      name: String(t.name || t.email.split('@')[0]),
      picture: t.picture ? String(t.picture) : null,
    }
  } catch {
    return null
  }
}

export function getOrCreateAccount(g: {
  sub: string
  email: string
  name: string
  picture: string | null
}): Account {
  let a = accounts.get(g.sub)
  if (!a) {
    const kp = Keypair.generate()
    a = {
      sub: g.sub,
      email: g.email,
      name: g.name,
      picture: g.picture,
      pubkey: kp.publicKey.toBase58(),
      enc: encrypt(kp.secretKey),
      createdAt: Date.now(),
    }
    accounts.set(g.sub, a)
    saveAccounts()
  }
  return a
}

export function accountKeypair(a: Account): Keypair {
  return Keypair.fromSecretKey(decrypt(a.enc))
}

export function accountBySub(sub: string): Account | undefined {
  return accounts.get(sub)
}

export function accountCount(): number {
  return accounts.size
}

// ---------------------------------------------------------------- sessions

interface Session {
  sub: string
  exp: number
}
const SESSIONS_PATH = path.join(DATA_DIR, 'sessions.json')
const sessions = new Map<string, Session>()
try {
  const raw = JSON.parse(fs.readFileSync(SESSIONS_PATH, 'utf8')) as [string, Session][]
  for (const [k, v] of raw) if (v.exp > Date.now()) sessions.set(k, v)
} catch {}

function saveSessions() {
  const tmp = SESSIONS_PATH + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify([...sessions.entries()]))
  fs.renameSync(tmp, SESSIONS_PATH)
}

const tokenOf = (authHeader: string | undefined): string | null =>
  authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

export function createSession(sub: string): string {
  const token = crypto.randomBytes(24).toString('base64url')
  sessions.set(token, { sub, exp: Date.now() + 24 * 3600 * 1000 })
  saveSessions()
  return token
}

export function sessionAccount(authHeader: string | undefined): Account | null {
  const token = tokenOf(authHeader)
  if (!token) return null
  const s = sessions.get(token)
  if (!s) return null
  if (s.exp < Date.now()) {
    sessions.delete(token) // drop expired tokens as we see them
    saveSessions()
    return null
  }
  return accounts.get(s.sub) ?? null
}

/** Sign out: invalidate the bearer token server-side. */
export function revokeSession(authHeader: string | undefined): boolean {
  const token = tokenOf(authHeader)
  if (!token) return false
  const had = sessions.delete(token)
  if (had) saveSessions()
  return had
}

// periodic sweep so expired sessions never accumulate unbounded
setInterval(() => {
  const now = Date.now()
  let changed = false
  for (const [k, v] of sessions) if (v.exp < now) { sessions.delete(k); changed = true }
  if (changed) saveSessions()
}, 3600_000).unref?.()
