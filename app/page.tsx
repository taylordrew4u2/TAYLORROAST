"use client";

import { useEffect, useState } from "react";
import GroupCard from "./components/GroupCard";

interface Member {
  id: string;
  name: string;
  checkedIn: boolean;
}

interface Group {
  id: string;
  name: string;
  members: Member[];
}

export default function Home() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/groups")
      .then((res) => res.json())
      .then((data) => {
        setGroups(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function addGroup() {
    setCreating(true);
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Group" }),
    });
    if (res.ok) {
      const group = await res.json();
      setGroups((prev) => [...prev, group]);
    }
    setCreating(false);
  }

  function handleUpdate(updated: Group) {
    setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
  }

  function handleDelete(id: string) {
    setGroups((prev) => prev.filter((g) => g.id !== id));
  }

  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalMembers = groups.reduce((acc, g) => acc + g.members.length, 0);
  const totalCheckedIn = groups.reduce(
    (acc, g) => acc + g.members.filter((m) => m.checkedIn).length,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header */}
      <header className="bg-white border-b border-orange-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-orange-600 tracking-tight">
              🎤 Comedy Roast Tournament
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Stage Manager Check-In</p>
          </div>
          {!loading && (
            <div className="text-sm text-gray-600 text-right">
              <span className="font-semibold text-gray-800">{totalCheckedIn}</span>
              <span className="text-gray-400"> / </span>
              <span className="font-semibold text-gray-800">{totalMembers}</span>
              <span className="text-gray-500"> checked in</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups…"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-orange-400 transition-colors text-sm bg-white shadow-sm"
          />
          <button
            onClick={addGroup}
            disabled={creating}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span>
            Add Group
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-400 text-lg">
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
            <span className="text-5xl">🎤</span>
            <p className="text-lg font-medium">
              {groups.length === 0
                ? "No groups yet. Add one to get started!"
                : "No groups match your search."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
