/**
 * Database helper – thin wrapper around @vercel/postgres.
 *
 * All mutations go through here so there is a single place to
 * audit and to swap out the driver if needed later.
 *
 * Environment variable required:
 *   POSTGRES_URL  – Vercel Postgres connection string (set automatically
 *                    when you link a Vercel Postgres store).
 */

import { sql } from "@vercel/postgres";

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
  await sql`
    CREATE TABLE IF NOT EXISTS groups (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL DEFAULT 'New Group',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS members (
      id          SERIAL PRIMARY KEY,
      group_id    INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      name        TEXT NOT NULL DEFAULT 'New Member',
      checked_in  BOOLEAN NOT NULL DEFAULT false,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
}

/* ------------------------------------------------------------------ */
/*  Reads                                                              */
/* ------------------------------------------------------------------ */

/** Fetch every group with its members, ordered by creation date. */
export async function getAllGroupsWithMembers(): Promise<GroupWithMembers[]> {
  await ensureSchema();

  const { rows: groups } = await sql`
    SELECT id, name, created_at FROM groups ORDER BY created_at ASC;
  `;

  const { rows: members } = await sql`
    SELECT id, group_id, name, checked_in, created_at
    FROM members ORDER BY created_at ASC;
  `;

  const membersByGroup = new Map<number, Member[]>();
  for (const m of members) {
    const list = membersByGroup.get(m.group_id as number) ?? [];
    list.push({
      id: m.id as number,
      group_id: m.group_id as number,
      name: m.name as string,
      checked_in: m.checked_in as boolean,
      created_at: m.created_at as string,
    });
    membersByGroup.set(m.group_id as number, list);
  }

  return (groups as Group[]).map((g) => ({
    ...g,
    members: membersByGroup.get(g.id) ?? [],
  }));
}

/* ------------------------------------------------------------------ */
/*  Group mutations                                                    */
/* ------------------------------------------------------------------ */

export async function createGroup(name?: string): Promise<Group> {
  await ensureSchema();
  const n = name?.trim() || "New Group";
  const { rows } = await sql`
    INSERT INTO groups (name) VALUES (${n}) RETURNING *;
  `;
  return rows[0] as Group;
}

export async function updateGroup(id: number, name: string): Promise<Group> {
  const { rows } = await sql`
    UPDATE groups SET name = ${name.trim()} WHERE id = ${id} RETURNING *;
  `;
  if (!rows.length) throw new Error("Group not found");
  return rows[0] as Group;
}

export async function deleteGroup(id: number): Promise<void> {
  await sql`DELETE FROM groups WHERE id = ${id};`;
}

/* ------------------------------------------------------------------ */
/*  Member mutations                                                   */
/* ------------------------------------------------------------------ */

export async function createMember(
  groupId: number,
  name?: string
): Promise<Member> {
  const n = name?.trim() || "New Member";
  const { rows } = await sql`
    INSERT INTO members (group_id, name) VALUES (${groupId}, ${n}) RETURNING *;
  `;
  return rows[0] as Member;
}

export async function updateMember(
  id: number,
  data: { name?: string; checked_in?: boolean }
): Promise<Member> {
  // Build dynamic update – only touch provided fields.
  if (data.name !== undefined && data.checked_in !== undefined) {
    const { rows } = await sql`
      UPDATE members SET name = ${data.name.trim()}, checked_in = ${data.checked_in}
      WHERE id = ${id} RETURNING *;
    `;
    if (!rows.length) throw new Error("Member not found");
    return rows[0] as Member;
  }
  if (data.name !== undefined) {
    const { rows } = await sql`
      UPDATE members SET name = ${data.name.trim()} WHERE id = ${id} RETURNING *;
    `;
    if (!rows.length) throw new Error("Member not found");
    return rows[0] as Member;
  }
  if (data.checked_in !== undefined) {
    const { rows } = await sql`
      UPDATE members SET checked_in = ${data.checked_in} WHERE id = ${id} RETURNING *;
    `;
    if (!rows.length) throw new Error("Member not found");
    return rows[0] as Member;
  }
  throw new Error("No fields to update");
}

export async function deleteMember(id: number): Promise<void> {
  await sql`DELETE FROM members WHERE id = ${id};`;
}
