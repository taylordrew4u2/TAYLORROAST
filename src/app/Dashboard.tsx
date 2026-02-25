/**
 * Dashboard – the main (and only) page.
 *
 * Renders the group grid, search bar, add-group button, and CSV export.
 * All data is fetched from the database via SWR  and every mutation is
 * immediately persisted through the API routes.
 */

"use client";

import { useState } from "react";
import { useGroups } from "@/lib/useGroups";
import { exportCSV } from "@/lib/csv";
import GroupCard from "./GroupCard";

export default function Dashboard() {
  const {
    groups,
    error,
    isLoading,
    addGroup,
    renameGroup,
    removeGroup,
    addMember,
    editMember,
    removeMember,
    refresh,
  } = useGroups();

  const [search, setSearch] = useState("");

  /* ---- Derived data ---- */
  const filtered = search.trim()
    ? groups.filter((g) =>
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.members.some((m) =>
          m.name.toLowerCase().includes(search.toLowerCase())
        )
      )
    : groups;

  const totalMembers = groups.reduce((s, g) => s + g.members.length, 0);
  const totalCheckedIn = groups.reduce(
    (s, g) => s + g.members.filter((m) => m.checked_in).length,
    0
  );

  /* ---- Error banner ---- */
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-red-400 text-lg font-semibold">
          Failed to load data
        </p>
        <p className="text-gray-500 text-sm max-w-md text-center">
          {error.message}
        </p>
        <button
          onClick={refresh}
          className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2 rounded-lg font-medium cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* ---- Top bar ---- */}
      <header className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-amber-400">
            🎤 Taylor Roast
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Comedy Roast Tournament — Check-In Manager
          </p>
        </div>

        {/* Stats pill */}
        <div className="flex gap-3 text-sm">
          <span className="bg-gray-800 px-3 py-1.5 rounded-full text-gray-300">
            {groups.length} group{groups.length !== 1 && "s"}
          </span>
          <span className="bg-gray-800 px-3 py-1.5 rounded-full text-emerald-400">
            {totalCheckedIn}/{totalMembers} checked in
          </span>
        </div>
      </header>

      {/* ---- Actions bar ---- */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <input
          type="text"
          placeholder="Search groups or members…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />

        <div className="flex gap-2">
          <button
            onClick={() => addGroup()}
            className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            + New Group
          </button>
          <button
            onClick={() => exportCSV(groups)}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium px-4 py-2.5 rounded-xl text-sm transition-colors cursor-pointer whitespace-nowrap"
            title="Export check-in list as CSV"
          >
            ↓ CSV
          </button>
          <button
            onClick={refresh}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium px-4 py-2.5 rounded-xl text-sm transition-colors cursor-pointer"
            title="Refresh from database"
          >
            ⟳
          </button>
        </div>
      </div>

      {/* ---- Loading skeleton ---- */}
      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-5 h-48 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* ---- Empty state ---- */}
      {!isLoading && groups.length === 0 && (
        <div className="text-center py-20 text-gray-600">
          <p className="text-5xl mb-4">🎙️</p>
          <p className="text-lg font-medium">No groups yet</p>
          <p className="text-sm mt-1">
            Click <span className="text-amber-400">+ New Group</span> to get
            started.
          </p>
        </div>
      )}

      {/* ---- No search results ---- */}
      {!isLoading && groups.length > 0 && filtered.length === 0 && (
        <p className="text-center py-12 text-gray-600">
          No matches for &ldquo;{search}&rdquo;
        </p>
      )}

      {/* ---- Groups grid ---- */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((g) => (
          <GroupCard
            key={g.id}
            group={g}
            onRenameGroup={renameGroup}
            onDeleteGroup={removeGroup}
            onAddMember={addMember}
            onEditMember={editMember}
            onRemoveMember={removeMember}
          />
        ))}
      </div>
    </div>
  );
}
