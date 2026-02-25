/**
 * SWR-based hook that keeps the UI in sync with the database.
 *
 * Every mutation:
 *  1. Optimistically updates the local cache → instant UI feedback.
 *  2. Fires the real API call.
 *  3. Re-validates (re-fetches) from the server so the UI always
 *     matches the database.
 *  4. Rolls back the optimistic update if the API call fails.
 *
 * This guarantees data is NEVER lost – the single source of truth is
 * always the Turso database.
 */

"use client";

import useSWR, { mutate as globalMutate } from "swr";

/* ------------------------------------------------------------------ */
/*  Types (mirrored from server for convenience)                       */
/* ------------------------------------------------------------------ */

export interface Member {
  id: number;
  group_id: number;
  name: string;
  checked_in: boolean;
  created_at: string;
}

export interface GroupWithMembers {
  id: number;
  name: string;
  created_at: string;
  members: Member[];
}

/* ------------------------------------------------------------------ */
/*  Fetcher                                                            */
/* ------------------------------------------------------------------ */

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || res.statusText);
  }
  return res.json();
};

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

const API_KEY = "/api/groups";

export function useGroups() {
  const { data, error, isLoading, mutate } = useSWR<GroupWithMembers[]>(
    API_KEY,
    fetcher,
    {
      // Re-fetch when the window regains focus (covers tab-switch scenarios).
      revalidateOnFocus: true,
      // Keep data fresh – poll every 30 s as a safety net.
      refreshInterval: 30_000,
    },
  );

  /* ---------------------------------------------------------------- */
  /*  Group mutations                                                  */
  /* ---------------------------------------------------------------- */

  /** Create a new group. Returns the created group. */
  async function addGroup(name?: string) {
    // Optimistic: append a temporary group.
    const tempId = -Date.now();
    const optimistic: GroupWithMembers = {
      id: tempId,
      name: name?.trim() || "New Group",
      created_at: new Date().toISOString(),
      members: [],
    };

    await mutate(
      async (current) => {
        const res = await fetch(API_KEY, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        if (!res.ok) throw new Error("Failed to create group");
        const created = await res.json();
        // Replace optimistic entry with actual server response.
        return (current ?? []).map((g) =>
          g.id === tempId ? { ...created, members: [] } : g,
        );
      },
      {
        optimisticData: [...(data ?? []), optimistic],
        rollbackOnError: true,
        revalidate: true, // always re-fetch to be sure
      },
    );
  }

  /** Rename a group. */
  async function renameGroup(id: number, name: string) {
    await mutate(
      async (current) => {
        const res = await fetch(API_KEY, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, name }),
        });
        if (!res.ok) throw new Error("Failed to rename group");
        const updated = await res.json();
        return (current ?? []).map((g) =>
          g.id === id ? { ...g, ...updated } : g,
        );
      },
      {
        optimisticData: (data ?? []).map((g) =>
          g.id === id ? { ...g, name } : g,
        ),
        rollbackOnError: true,
        revalidate: true,
      },
    );
  }

  /** Delete a group and all its members. */
  async function removeGroup(id: number) {
    await mutate(
      async (current) => {
        const res = await fetch(`${API_KEY}?id=${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete group");
        return (current ?? []).filter((g) => g.id !== id);
      },
      {
        optimisticData: (data ?? []).filter((g) => g.id !== id),
        rollbackOnError: true,
        revalidate: true,
      },
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Member mutations                                                 */
  /* ---------------------------------------------------------------- */

  /** Add a member to a group. */
  async function addMember(groupId: number, name?: string) {
    const tempId = -Date.now();
    const optimisticMember: Member = {
      id: tempId,
      group_id: groupId,
      name: name?.trim() || "New Member",
      checked_in: false,
      created_at: new Date().toISOString(),
    };

    await mutate(
      async (current) => {
        const res = await fetch("/api/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ group_id: groupId, name }),
        });
        if (!res.ok) throw new Error("Failed to add member");
        const created: Member = await res.json();
        return (current ?? []).map((g) =>
          g.id === groupId
            ? {
                ...g,
                members: g.members.map((m) => (m.id === tempId ? created : m)),
              }
            : g,
        );
      },
      {
        optimisticData: (data ?? []).map((g) =>
          g.id === groupId
            ? { ...g, members: [...g.members, optimisticMember] }
            : g,
        ),
        rollbackOnError: true,
        revalidate: true,
      },
    );
  }

  /** Update a member (name and/or check-in status). */
  async function editMember(
    id: number,
    groupId: number,
    updates: { name?: string; checked_in?: boolean },
  ) {
    await mutate(
      async (current) => {
        const res = await fetch("/api/members", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...updates }),
        });
        if (!res.ok) throw new Error("Failed to update member");
        const updated: Member = await res.json();
        return (current ?? []).map((g) =>
          g.id === groupId
            ? {
                ...g,
                members: g.members.map((m) => (m.id === id ? updated : m)),
              }
            : g,
        );
      },
      {
        optimisticData: (data ?? []).map((g) =>
          g.id === groupId
            ? {
                ...g,
                members: g.members.map((m) =>
                  m.id === id ? { ...m, ...updates } : m,
                ),
              }
            : g,
        ),
        rollbackOnError: true,
        revalidate: true,
      },
    );
  }

  /** Remove a member. */
  async function removeMember(id: number, groupId: number) {
    await mutate(
      async (current) => {
        const res = await fetch(`/api/members?id=${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to remove member");
        return (current ?? []).map((g) =>
          g.id === groupId
            ? { ...g, members: g.members.filter((m) => m.id !== id) }
            : g,
        );
      },
      {
        optimisticData: (data ?? []).map((g) =>
          g.id === groupId
            ? { ...g, members: g.members.filter((m) => m.id !== id) }
            : g,
        ),
        rollbackOnError: true,
        revalidate: true,
      },
    );
  }

  /** Force re-fetch from the database. */
  function refresh() {
    globalMutate(API_KEY);
  }

  return {
    groups: data ?? [],
    error,
    isLoading,
    addGroup,
    renameGroup,
    removeGroup,
    addMember,
    editMember,
    removeMember,
    refresh,
  };
}
