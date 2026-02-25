/**
 * Database helper – thin wrapper around @libsql/client (Turso).
 *
 * All mutations go through here so there is a single place to
 * audit and to swap out the driver if needed later.
 *
 * Environment variables:
 *   DATABASE_URL      – Turso/libSQL connection string (libsql://...)
 *                       Falls back to POSTGRES_URL for backward-compat.
 *   TURSO_AUTH_TOKEN  – Turso database auth token.
 */

import { createClient, type Client, type InArgs } from "@libsql/client";

let _client: Client | undefined;

function getClient() {
  if (!_client) {
    const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
    const authToken =
      process.env.TURSO_AUTH_TOKEN ?? process.env.DATABASE_AUTH_TOKEN;

    if (!url) {
      throw new Error(
        "DATABASE_URL (or POSTGRES_URL) environment variable is not set",
      );
    }

    _client = createClient({ url, authToken });
  }

  return _client;
}

async function query<T extends Record<string, unknown>>(
  statement: string,
  args?: InArgs,
): Promise<T[]> {
  const result = await getClient().execute({ sql: statement, args });
  return result.rows as unknown as T[];
}

function rowToGroup(row: Record<string, unknown>): Group {
  return {
    id: Number(row.id),
    name: String(row.name),
    created_at: String(row.created_at),
  };
}

function rowToMember(row: Record<string, unknown>): Member {
  return {
    id: Number(row.id),
    group_id: Number(row.group_id),
    name: String(row.name),
    checked_in: Boolean(Number(row.checked_in)),
    created_at: String(row.created_at),
  };
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface Group {
  id: number;
  name: string;
  created_at: string;
}

export interface Member {
  id: number;
  group_id: number;
  name: string;
  checked_in: boolean;
  created_at: string;
}

export interface GroupWithMembers extends Group {
  members: Member[];
}

/* ------------------------------------------------------------------ */
/*  Schema bootstrap (idempotent)                                      */
/* ------------------------------------------------------------------ */

export async function ensureSchema() {
  await query("PRAGMA foreign_keys = ON;");

  await query(`
    CREATE TABLE IF NOT EXISTS groups (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL DEFAULT 'New Group',
      created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS members (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id    INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      name        TEXT NOT NULL DEFAULT 'New Member',
      checked_in  INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

/* ------------------------------------------------------------------ */
/*  Reads                                                              */
/* ------------------------------------------------------------------ */

/** Fetch every group with its members, ordered by creation date. */
export async function getAllGroupsWithMembers(): Promise<GroupWithMembers[]> {
  await ensureSchema();

  const groups = await query<Record<string, unknown>>(
    "SELECT id, name, created_at FROM groups ORDER BY created_at ASC;",
  );

  const members = await query<Record<string, unknown>>(
    "SELECT id, group_id, name, checked_in, created_at FROM members ORDER BY created_at ASC;",
  );

  const membersByGroup = new Map<number, Member[]>();
  for (const m of members) {
    const member = rowToMember(m);
    const list = membersByGroup.get(member.group_id) ?? [];
    list.push(member);
    membersByGroup.set(member.group_id, list);
  }

  return groups.map((g) => {
    const group = rowToGroup(g);
    return {
      ...group,
      members: membersByGroup.get(group.id) ?? [],
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Group mutations                                                    */
/* ------------------------------------------------------------------ */

export async function createGroup(name?: string): Promise<Group> {
  await ensureSchema();
  const n = name?.trim() || "New Group";
  const rows = await query<Record<string, unknown>>(
    "INSERT INTO groups (name) VALUES (?);",
    [n],
  );
  return rowToGroup(rows[0]);
}

export async function updateGroup(id: number, name: string): Promise<Group> {
  await query("UPDATE groups SET name = ? WHERE id = ?;", [name.trim(), id]);
  const rows = await query<Record<string, unknown>>(
    "SELECT id, name, created_at FROM groups WHERE id = ?;",
    [id],
  );
  if (!rows.length) throw new Error("Group not found");
  return rowToGroup(rows[0]);
}

export async function deleteGroup(id: number): Promise<void> {
  await query("DELETE FROM groups WHERE id = ?;", [id]);
}

/* ------------------------------------------------------------------ */
/*  Member mutations                                                   */
/* ------------------------------------------------------------------ */

export async function createMember(
  groupId: number,
  name?: string,
): Promise<Member> {
  const n = name?.trim() || "New Member";
  await query("INSERT INTO members (group_id, name) VALUES (?, ?);", [
    groupId,
    n,
  ]);
  const rows = await query<Record<string, unknown>>(
    "SELECT id, group_id, name, checked_in, created_at FROM members WHERE id = last_insert_rowid();",
  );
  return rowToMember(rows[0]);
}

export async function updateMember(
  id: number,
  data: { name?: string; checked_in?: boolean },
): Promise<Member> {
  // Build dynamic update – only touch provided fields.
  if (data.name !== undefined && data.checked_in !== undefined) {
    await query("UPDATE members SET name = ?, checked_in = ? WHERE id = ?;", [
      data.name.trim(),
      data.checked_in ? 1 : 0,
      id,
    ]);
    const rows = await query<Record<string, unknown>>(
      "SELECT id, group_id, name, checked_in, created_at FROM members WHERE id = ?;",
      [id],
    );
    if (!rows.length) throw new Error("Member not found");
    return rowToMember(rows[0]);
  }
  if (data.name !== undefined) {
    await query("UPDATE members SET name = ? WHERE id = ?;", [
      data.name.trim(),
      id,
    ]);
    const rows = await query<Record<string, unknown>>(
      "SELECT id, group_id, name, checked_in, created_at FROM members WHERE id = ?;",
      [id],
    );
    if (!rows.length) throw new Error("Member not found");
    return rowToMember(rows[0]);
  }
  if (data.checked_in !== undefined) {
    await query("UPDATE members SET checked_in = ? WHERE id = ?;", [
      data.checked_in ? 1 : 0,
      id,
    ]);
    const rows = await query<Record<string, unknown>>(
      "SELECT id, group_id, name, checked_in, created_at FROM members WHERE id = ?;",
      [id],
    );
    if (!rows.length) throw new Error("Member not found");
    return rowToMember(rows[0]);
  }
  throw new Error("No fields to update");
}

export async function deleteMember(id: number): Promise<void> {
  await query("DELETE FROM members WHERE id = ?;", [id]);
}
