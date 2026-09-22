import { db, now, newId } from "./db";

// ---------- Types ----------

export type User = {
  id: string;
  email: string;
  email_verified_at: string | null;
  name: string;
  username: string | null;
  bio: string | null;
  accepting_messages: number;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ContactLink = {
  id: string;
  user_id: string;
  slug: string;
  title: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
};

export type ConversationRow = {
  id: string;
  contact_link_id: string;
  created_by_user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
  deleted_at: string | null;
};

// ---------- Users ----------

export function createUser(input: { email: string; name: string; emailVerified?: boolean }): User {
  const id = newId();
  const ts = now();
  db.prepare(
    `INSERT INTO users (id, email, email_verified_at, name, username, bio, accepting_messages, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, NULL, NULL, 1, 'active', ?, ?)`
  ).run(id, input.email.toLowerCase(), input.emailVerified ? ts : null, input.name, ts, ts);
  return getUserById(id)!;
}

export function getUserById(id: string): User | undefined {
  return db.prepare(`SELECT * FROM users WHERE id = ? AND deleted_at IS NULL`).get(id) as User | undefined;
}

export function getUserByEmail(email: string): User | undefined {
  return db
    .prepare(`SELECT * FROM users WHERE email = ? AND deleted_at IS NULL`)
    .get(email.toLowerCase()) as User | undefined;
}

export function getUserByUsername(username: string): User | undefined {
  return db
    .prepare(`SELECT * FROM users WHERE username = ? AND deleted_at IS NULL`)
    .get(username.toLowerCase()) as User | undefined;
}

export function setUsername(userId: string, username: string): void {
  db.prepare(`UPDATE users SET username = ?, updated_at = ? WHERE id = ?`).run(
    username.toLowerCase(),
    now(),
    userId
  );
  // Every user gets exactly one contact_link in the MVP, modeled separately
  // so multiple links (a "Should Have") are additive later, not a migration.
  const existing = db.prepare(`SELECT id FROM contact_links WHERE user_id = ?`).get(userId) as
    | { id: string }
    | undefined;
  if (!existing) {
    db.prepare(
      `INSERT INTO contact_links (id, user_id, slug, title, is_active, created_at, updated_at)
       VALUES (?, ?, ?, NULL, 1, ?, ?)`
    ).run(newId(), userId, username.toLowerCase(), now(), now());
  } else {
    db.prepare(`UPDATE contact_links SET slug = ?, updated_at = ? WHERE id = ?`).run(
      username.toLowerCase(),
      now(),
      existing.id
    );
  }
}

export function markEmailVerified(userId: string): void {
  db.prepare(`UPDATE users SET email_verified_at = ?, updated_at = ? WHERE id = ?`).run(now(), now(), userId);
}

export function updateProfile(
  userId: string,
  input: { name?: string; bio?: string; acceptingMessages?: boolean }
): void {
  const user = getUserById(userId);
  if (!user) return;
  db.prepare(`UPDATE users SET name = ?, bio = ?, accepting_messages = ?, updated_at = ? WHERE id = ?`).run(
    input.name ?? user.name,
    input.bio ?? user.bio,
    input.acceptingMessages === undefined ? user.accepting_messages : input.acceptingMessages ? 1 : 0,
    now(),
    userId
  );
}

export function softDeleteUser(userId: string): void {
  db.prepare(`UPDATE users SET status = 'deleted', deleted_at = ?, updated_at = ? WHERE id = ?`).run(
    now(),
    now(),
    userId
  );
  db.prepare(`UPDATE contact_links SET is_active = 0, updated_at = ? WHERE user_id = ?`).run(now(), userId);
  db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(userId);
}

// ---------- Contact links ----------

export function getContactLinkByUsername(username: string): (ContactLink & { user: User }) | undefined {
  const user = getUserByUsername(username);
  if (!user) return undefined;
  const link = db
    .prepare(`SELECT * FROM contact_links WHERE user_id = ?`)
    .get(user.id) as ContactLink | undefined;
  if (!link) return undefined;
  return { ...link, user };
}

// ---------- OTPs ----------

export type OtpPurpose = "signup" | "login" | "message_verification" | "email_change";

export function createOtp(email: string, purpose: OtpPurpose, codeHash: string, ttlMinutes = 10): void {
  const expires = new Date(Date.now() + ttlMinutes * 60_000).toISOString();
  db.prepare(
    `INSERT INTO email_otps (id, email, code_hash, purpose, expires_at, attempts, created_at, used_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, NULL)`
  ).run(newId(), email.toLowerCase(), codeHash, purpose, expires, now());
}

export function countRecentOtps(email: string, purpose: OtpPurpose, sinceMinutesAgo: number): number {
  const since = new Date(Date.now() - sinceMinutesAgo * 60_000).toISOString();
  const row = db
    .prepare(
      `SELECT COUNT(*) as c FROM email_otps WHERE email = ? AND purpose = ? AND created_at >= ?`
    )
    .get(email.toLowerCase(), purpose, since) as { c: number };
  return row.c;
}

export function getLatestOtp(email: string, purpose: OtpPurpose) {
  return db
    .prepare(
      `SELECT * FROM email_otps WHERE email = ? AND purpose = ? AND used_at IS NULL
       ORDER BY created_at DESC LIMIT 1`
    )
    .get(email.toLowerCase(), purpose) as
    | {
        id: string;
        email: string;
        code_hash: string;
        purpose: string;
        expires_at: string;
        attempts: number;
        created_at: string;
        used_at: string | null;
      }
    | undefined;
}

export function incrementOtpAttempts(id: string): void {
  db.prepare(`UPDATE email_otps SET attempts = attempts + 1 WHERE id = ?`).run(id);
}

export function markOtpUsed(id: string): void {
  db.prepare(`UPDATE email_otps SET used_at = ? WHERE id = ?`).run(now(), id);
}

/**
 * Proves "this email was verified via OTP a moment ago" without requiring
 * a full session yet — used to gate first-time conversation creation
 * (PRD section 13, message-sender verification).
 */
export function wasEmailRecentlyVerified(email: string, purpose: OtpPurpose, withinMinutes = 15): boolean {
  const row = db
    .prepare(
      `SELECT used_at FROM email_otps WHERE email = ? AND purpose = ? AND used_at IS NOT NULL
       ORDER BY used_at DESC LIMIT 1`
    )
    .get(email.toLowerCase(), purpose) as { used_at: string } | undefined;
  if (!row) return false;
  return Date.now() - new Date(row.used_at).getTime() < withinMinutes * 60_000;
}

// ---------- Sessions ----------

export function createSession(userId: string, tokenHash: string, ttlDays = 30): void {
  const expires = new Date(Date.now() + ttlDays * 24 * 60 * 60_000).toISOString();
  db.prepare(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run(newId(), userId, tokenHash, expires, now());
}

export function getSessionByTokenHash(tokenHash: string) {
  return db
    .prepare(`SELECT * FROM sessions WHERE token_hash = ? AND expires_at > ?`)
    .get(tokenHash, now()) as { id: string; user_id: string; expires_at: string } | undefined;
}

export function deleteSessionByTokenHash(tokenHash: string): void {
  db.prepare(`DELETE FROM sessions WHERE token_hash = ?`).run(tokenHash);
}

// ---------- Blocks ----------

export function isBlocked(blockerUserId: string, blockedUserId: string): boolean {
  const row = db
    .prepare(`SELECT 1 FROM blocks WHERE blocker_user_id = ? AND blocked_user_id = ?`)
    .get(blockerUserId, blockedUserId);
  return !!row;
}

export function createBlock(blockerUserId: string, blockedUserId: string): void {
  db.prepare(
    `INSERT OR IGNORE INTO blocks (id, blocker_user_id, blocked_user_id, created_at) VALUES (?, ?, ?, ?)`
  ).run(newId(), blockerUserId, blockedUserId, now());
}

export function removeBlock(blockerUserId: string, blockedUserId: string): void {
  db.prepare(`DELETE FROM blocks WHERE blocker_user_id = ? AND blocked_user_id = ?`).run(
    blockerUserId,
    blockedUserId
  );
}

// ---------- Reports ----------

export function createReport(input: {
  reporterUserId: string;
  conversationId: string;
  reason: string;
  description?: string;
}): void {
  db.prepare(
    `INSERT INTO reports (id, reporter_user_id, conversation_id, reason, description, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'open', ?)`
  ).run(newId(), input.reporterUserId, input.conversationId, input.reason, input.description ?? null, now());
}

// ---------- Conversations & messages ----------

export function findConversationBetween(contactLinkId: string, createdByUserId: string) {
  return db
    .prepare(
      `SELECT * FROM conversations WHERE contact_link_id = ? AND created_by_user_id = ? AND status != 'deleted'`
    )
    .get(contactLinkId, createdByUserId) as ConversationRow | undefined;
}

export function createConversation(
  contactLinkId: string,
  receiverUserId: string,
  senderUserId: string
): ConversationRow {
  const id = newId();
  const ts = now();
  db.prepare(
    `INSERT INTO conversations (id, contact_link_id, created_by_user_id, status, created_at, updated_at)
     VALUES (?, ?, ?, 'active', ?, ?)`
  ).run(id, contactLinkId, senderUserId, ts, ts);

  db.prepare(
    `INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at, last_read_at)
     VALUES (?, ?, 'receiver', ?, NULL)`
  ).run(id, receiverUserId, ts);
  db.prepare(
    `INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at, last_read_at)
     VALUES (?, ?, 'sender', ?, ?)`
  ).run(id, senderUserId, ts, ts);

  return db.prepare(`SELECT * FROM conversations WHERE id = ?`).get(id) as ConversationRow;
}

export function isParticipant(conversationId: string, userId: string): boolean {
  const row = db
    .prepare(`SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?`)
    .get(conversationId, userId);
  return !!row;
}

export function addMessage(conversationId: string, senderUserId: string, body: string): MessageRow {
  const id = newId();
  const ts = now();
  db.prepare(
    `INSERT INTO messages (id, conversation_id, sender_user_id, body, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run(id, conversationId, senderUserId, body, ts);
  db.prepare(`UPDATE conversations SET updated_at = ? WHERE id = ?`).run(ts, conversationId);
  return db.prepare(`SELECT * FROM messages WHERE id = ?`).get(id) as MessageRow;
}

export function getMessages(conversationId: string): MessageRow[] {
  return db
    .prepare(`SELECT * FROM messages WHERE conversation_id = ? AND deleted_at IS NULL ORDER BY created_at ASC`)
    .all(conversationId) as MessageRow[];
}

export function markRead(conversationId: string, userId: string): void {
  db.prepare(
    `UPDATE conversation_participants SET last_read_at = ? WHERE conversation_id = ? AND user_id = ?`
  ).run(now(), conversationId, userId);
}

export type ConversationSummary = {
  id: string;
  status: string;
  updated_at: string;
  other_user_id: string;
  other_user_name: string;
  other_user_username: string | null;
  my_role: string;
  last_message_body: string | null;
  last_message_at: string | null;
  unread: boolean;
};

export function listConversationsForUser(userId: string): ConversationSummary[] {
  const rows = db
    .prepare(
      `SELECT
         c.id as id,
         c.status as status,
         c.updated_at as updated_at,
         me.role as my_role,
         me.last_read_at as my_last_read_at,
         other.user_id as other_user_id,
         ou.name as other_user_name,
         ou.username as other_user_username
       FROM conversations c
       JOIN conversation_participants me ON me.conversation_id = c.id AND me.user_id = ?
       JOIN conversation_participants other ON other.conversation_id = c.id AND other.user_id != ?
       JOIN users ou ON ou.id = other.user_id
       WHERE c.status != 'deleted'
       ORDER BY c.updated_at DESC`
    )
    .all(userId, userId) as {
    id: string;
    status: string;
    updated_at: string;
    my_role: string;
    my_last_read_at: string | null;
    other_user_id: string;
    other_user_name: string;
    other_user_username: string | null;
  }[];

  return rows.map((r) => {
    const last = db
      .prepare(
        `SELECT body, created_at FROM messages WHERE conversation_id = ? AND deleted_at IS NULL
         ORDER BY created_at DESC LIMIT 1`
      )
      .get(r.id) as { body: string; created_at: string } | undefined;
    return {
      id: r.id,
      status: r.status,
      updated_at: r.updated_at,
      other_user_id: r.other_user_id,
      other_user_name: r.other_user_name,
      other_user_username: r.other_user_username,
      my_role: r.my_role,
      last_message_body: last?.body ?? null,
      last_message_at: last?.created_at ?? null,
      unread: !!last && (!r.my_last_read_at || last.created_at > r.my_last_read_at),
    };
  });
}

export function getConversationWithParticipants(conversationId: string) {
  const conversation = db
    .prepare(`SELECT * FROM conversations WHERE id = ?`)
    .get(conversationId) as ConversationRow | undefined;
  if (!conversation) return undefined;
  const participants = db
    .prepare(
      `SELECT cp.user_id, cp.role, u.name, u.username
       FROM conversation_participants cp JOIN users u ON u.id = cp.user_id
       WHERE cp.conversation_id = ?`
    )
    .all(conversationId) as { user_id: string; role: string; name: string; username: string | null }[];
  return { conversation, participants };
}
