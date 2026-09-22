/**
 * Data layer for PingLink.
 *
 * Uses Node's built-in `node:sqlite` (stable-ish since Node 22) so the
 * prototype runs with zero external services and zero native/npm build
 * steps — clone, `npm install`, `npm run dev`, done.
 *
 * This mirrors the relational schema from the PRD (section 20-28) closely
 * enough that moving to Postgres + Prisma/Drizzle later is a data-layer
 * swap, not a redesign. See README "Moving to production" for the plan.
 */
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

const DB_PATH = process.env.PINGLINK_DB_PATH || path.join(process.cwd(), "data", "pinglink.db");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

// A global is used so hot-reload in `next dev` doesn't reopen the file
// repeatedly and so all API routes share one connection.
const globalForDb = globalThis as unknown as { __pinglinkDb?: DatabaseSync };

export const db: DatabaseSync = globalForDb.__pinglinkDb ?? new DatabaseSync(DB_PATH);
if (!globalForDb.__pinglinkDb) globalForDb.__pinglinkDb = db;

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id                 TEXT PRIMARY KEY,
  email              TEXT UNIQUE NOT NULL,
  email_verified_at  TEXT,
  name               TEXT NOT NULL,
  username           TEXT UNIQUE,
  bio                TEXT,
  accepting_messages INTEGER NOT NULL DEFAULT 1,
  status             TEXT NOT NULL DEFAULT 'active',
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL,
  deleted_at         TEXT
);

CREATE TABLE IF NOT EXISTS contact_links (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id),
  slug        TEXT UNIQUE NOT NULL,
  title       TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conversations (
  id                  TEXT PRIMARY KEY,
  contact_link_id     TEXT NOT NULL REFERENCES contact_links(id),
  created_by_user_id  TEXT NOT NULL REFERENCES users(id),
  status              TEXT NOT NULL DEFAULT 'active',
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id  TEXT NOT NULL REFERENCES conversations(id),
  user_id          TEXT NOT NULL REFERENCES users(id),
  role             TEXT NOT NULL,
  joined_at        TEXT NOT NULL,
  last_read_at     TEXT,
  blocked_at       TEXT,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id                TEXT PRIMARY KEY,
  conversation_id   TEXT NOT NULL REFERENCES conversations(id),
  sender_user_id    TEXT NOT NULL REFERENCES users(id),
  body              TEXT NOT NULL,
  created_at        TEXT NOT NULL,
  deleted_at        TEXT
);

CREATE TABLE IF NOT EXISTS email_otps (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL,
  code_hash   TEXT NOT NULL,
  purpose     TEXT NOT NULL,
  expires_at  TEXT NOT NULL,
  attempts    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  used_at     TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id),
  token_hash  TEXT UNIQUE NOT NULL,
  expires_at  TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS blocks (
  id                TEXT PRIMARY KEY,
  blocker_user_id   TEXT NOT NULL REFERENCES users(id),
  blocked_user_id   TEXT NOT NULL REFERENCES users(id),
  created_at        TEXT NOT NULL,
  UNIQUE(blocker_user_id, blocked_user_id)
);

CREATE TABLE IF NOT EXISTS reports (
  id                 TEXT PRIMARY KEY,
  reporter_user_id   TEXT NOT NULL REFERENCES users(id),
  conversation_id    TEXT NOT NULL REFERENCES conversations(id),
  reason             TEXT NOT NULL,
  description        TEXT,
  status             TEXT NOT NULL DEFAULT 'open',
  created_at         TEXT NOT NULL,
  resolved_at        TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id             TEXT PRIMARY KEY,
  actor_user_id  TEXT,
  action         TEXT NOT NULL,
  target_type    TEXT,
  target_id      TEXT,
  metadata       TEXT,
  created_at     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_otps_email_purpose ON email_otps(email, purpose);
`);

export function now(): string {
  return new Date().toISOString();
}

export function newId(): string {
  return crypto.randomUUID();
}
