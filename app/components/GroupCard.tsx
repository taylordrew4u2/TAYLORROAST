"use client";

import { useState } from "react";

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

interface GroupCardProps {
  group: Group;
  onUpdate: (group: Group) => void;
  onDelete: (id: string) => void;
}

export default function GroupCard({ group, onUpdate, onDelete }: GroupCardProps) {
  const [editing, setEditing] = useState(false);
  const [groupName, setGroupName] = useState(group.name);
  const [newMemberName, setNewMemberName] = useState("");
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingMemberName, setEditingMemberName] = useState("");
  const [loading, setLoading] = useState(false);

  const checkedInCount = group.members.filter((m) => m.checkedIn).length;

  async function saveGroupName() {
    if (!groupName.trim() || groupName === group.name) {
      setGroupName(group.name);
      setEditing(false);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/groups/${group.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: groupName }),
    });
    if (res.ok) {
      const updated = await res.json();
      onUpdate(updated);
    }
    setLoading(false);
    setEditing(false);
  }

  async function deleteGroup() {
    if (!confirm(`Delete group "${group.name}" and all its members?`)) return;
    setLoading(true);
    await fetch(`/api/groups/${group.id}`, { method: "DELETE" });
    onDelete(group.id);
  }

  async function addMember() {
    if (!newMemberName.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/groups/${group.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newMemberName }),
    });
    if (res.ok) {
      const member = await res.json();
      onUpdate({ ...group, members: [...group.members, member] });
      setNewMemberName("");
    }
    setLoading(false);
  }

  async function toggleCheckIn(member: Member) {
    const res = await fetch(`/api/members/${member.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkedIn: !member.checkedIn }),
    });
    if (res.ok) {
      const updated = await res.json();
      onUpdate({
        ...group,
        members: group.members.map((m) => (m.id === updated.id ? updated : m)),
      });
    }
  }

  async function saveMemberName(member: Member) {
    if (!editingMemberName.trim() || editingMemberName === member.name) {
      setEditingMemberId(null);
      return;
    }
    const res = await fetch(`/api/members/${member.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editingMemberName }),
    });
    if (res.ok) {
      const updated = await res.json();
      onUpdate({
        ...group,
        members: group.members.map((m) => (m.id === updated.id ? updated : m)),
      });
    }
    setEditingMemberId(null);
  }

  async function deleteMember(memberId: string) {
    setLoading(true);
    await fetch(`/api/members/${memberId}`, { method: "DELETE" });
    onUpdate({ ...group, members: group.members.filter((m) => m.id !== memberId) });
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 flex flex-col gap-4">
      {/* Group Header */}
      <div className="flex items-start justify-between gap-2">
        {editing ? (
          <input
            className="flex-1 text-lg font-bold border-b-2 border-orange-400 outline-none bg-transparent"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            onBlur={saveGroupName}
            onKeyDown={(e) => e.key === "Enter" && saveGroupName()}
            autoFocus
          />
        ) : (
          <h2
            className="flex-1 text-lg font-bold text-gray-800 cursor-pointer hover:text-orange-500 transition-colors"
            onClick={() => setEditing(true)}
            title="Click to edit name"
          >
            {group.name}
          </h2>
        )}
        <button
          onClick={deleteGroup}
          disabled={loading}
          className="text-gray-400 hover:text-red-500 transition-colors text-xl leading-none"
          title="Delete group"
        >
          ✕
        </button>
      </div>

      {/* Check-in summary badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-500">
          {checkedInCount} / {group.members.length} checked in
        </span>
        {group.members.length > 0 && checkedInCount === group.members.length && (
          <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-semibold">
            All checked in ✓
          </span>
        )}
      </div>

      {/* Members list */}
      <ul className="flex flex-col gap-2">
        {group.members.map((member) => (
          <li key={member.id} className="flex items-center gap-2">
            {/* Check-in toggle */}
            <button
              onClick={() => toggleCheckIn(member)}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                member.checkedIn
                  ? "bg-green-500 border-green-500 text-white"
                  : "border-gray-300 hover:border-green-400"
              }`}
              title={member.checkedIn ? "Uncheck" : "Check in"}
            >
              {member.checkedIn && (
                <svg viewBox="0 0 12 12" className="w-3 h-3 fill-current">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            {/* Member name */}
            {editingMemberId === member.id ? (
              <input
                className="flex-1 text-sm border-b border-orange-400 outline-none bg-transparent"
                value={editingMemberName}
                onChange={(e) => setEditingMemberName(e.target.value)}
                onBlur={() => saveMemberName(member)}
                onKeyDown={(e) => e.key === "Enter" && saveMemberName(member)}
                autoFocus
              />
            ) : (
              <span
                onClick={() => {
                  setEditingMemberId(member.id);
                  setEditingMemberName(member.name);
                }}
                className={`flex-1 text-sm cursor-pointer hover:text-orange-500 transition-colors ${
                  member.checkedIn ? "line-through text-gray-400" : "text-gray-700"
                }`}
                title="Click to edit name"
              >
                {member.name}
              </span>
            )}

            {/* Delete member */}
            <button
              onClick={() => deleteMember(member.id)}
              className="text-gray-300 hover:text-red-400 transition-colors text-sm"
              title="Remove member"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {/* Add member */}
      <div className="flex gap-2 mt-1">
        <input
          type="text"
          value={newMemberName}
          onChange={(e) => setNewMemberName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addMember()}
          placeholder="Add member…"
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-orange-400 transition-colors"
        />
        <button
          onClick={addMember}
          disabled={loading || !newMemberName.trim()}
          className="text-sm bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}
