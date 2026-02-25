/**
 * <GroupCard />
 *
 * Renders a single group as a card. Supports:
 *  - Inline editing of group name
 *  - Adding / editing / removing members
 *  - Check-in toggle for each member
 *  - Delete group with confirmation
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { GroupWithMembers, Member } from "@/lib/useGroups";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  group: GroupWithMembers;
  onRenameGroup: (id: number, name: string) => Promise<void>;
  onDeleteGroup: (id: number) => Promise<void>;
  onAddMember: (groupId: number, name?: string) => Promise<void>;
  onEditMember: (
    id: number,
    groupId: number,
    updates: { name?: string; checked_in?: boolean }
  ) => Promise<void>;
  onRemoveMember: (id: number, groupId: number) => Promise<void>;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function GroupCard({
  group,
  onRenameGroup,
  onDeleteGroup,
  onAddMember,
  onEditMember,
  onRemoveMember,
}: Props) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(group.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Keep local name in sync if the server updates.
  useEffect(() => {
    if (!editingName) setNameValue(group.name);
  }, [group.name, editingName]);

  // Focus the input when entering edit mode.
  useEffect(() => {
    if (editingName) nameInputRef.current?.select();
  }, [editingName]);

  /* Save group name ------------------------------------------------ */
  const saveName = useCallback(async () => {
    setEditingName(false);
    if (nameValue.trim() && nameValue.trim() !== group.name) {
      setSaving(true);
      try {
        await onRenameGroup(group.id, nameValue.trim());
      } catch {
        setNameValue(group.name); // rollback
      } finally {
        setSaving(false);
      }
    } else {
      setNameValue(group.name);
    }
  }, [nameValue, group.id, group.name, onRenameGroup]);

  /* Handle delete -------------------------------------------------- */
  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setSaving(true);
    try {
      await onDeleteGroup(group.id);
    } finally {
      setSaving(false);
      setConfirmDelete(false);
    }
  };

  /* Checked-in count ----------------------------------------------- */
  const checkedIn = group.members.filter((m) => m.checked_in).length;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4 shadow-lg relative">
      {/* Saving overlay */}
      {saving && (
        <div className="absolute inset-0 bg-gray-900/60 rounded-2xl flex items-center justify-center z-10">
          <span className="animate-spin h-6 w-6 border-2 border-amber-400 border-t-transparent rounded-full" />
        </div>
      )}

      {/* ---- Header ---- */}
      <div className="flex items-center gap-2">
        {editingName ? (
          <input
            ref={nameInputRef}
            className="flex-1 bg-gray-800 border border-amber-500 rounded-lg px-3 py-1.5 text-lg font-bold text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveName();
              if (e.key === "Escape") {
                setNameValue(group.name);
                setEditingName(false);
              }
            }}
          />
        ) : (
          <button
            className="flex-1 text-left text-lg font-bold text-amber-300 hover:underline cursor-pointer truncate"
            onClick={() => setEditingName(true)}
            title="Click to edit group name"
          >
            {group.name}
          </button>
        )}

        {/* Delete button */}
        <button
          onClick={handleDelete}
          onBlur={() => setConfirmDelete(false)}
          className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            confirmDelete
              ? "bg-red-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-red-900 hover:text-red-300"
          }`}
          title={confirmDelete ? "Click again to confirm" : "Delete group"}
        >
          {confirmDelete ? "Confirm?" : "Delete"}
        </button>
      </div>

      {/* ---- Badge ---- */}
      <p className="text-sm text-gray-400">
        {group.members.length} member{group.members.length !== 1 && "s"}
        {group.members.length > 0 && (
          <span className="ml-2 text-emerald-400">
            ({checkedIn}/{group.members.length} checked in)
          </span>
        )}
      </p>

      {/* ---- Members list ---- */}
      <ul className="flex flex-col gap-2">
        {group.members.map((m) => (
          <MemberRow
            key={m.id}
            member={m}
            groupId={group.id}
            onEdit={onEditMember}
            onRemove={onRemoveMember}
          />
        ))}
      </ul>

      {/* ---- Add member button ---- */}
      <button
        className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg py-2 transition-colors cursor-pointer"
        onClick={() => onAddMember(group.id)}
      >
        + Add Member
      </button>
    </div>
  );
}

/* ================================================================== */
/*  MemberRow                                                          */
/* ================================================================== */

function MemberRow({
  member,
  groupId,
  onEdit,
  onRemove,
}: {
  member: Member;
  groupId: number;
  onEdit: Props["onEditMember"];
  onRemove: Props["onRemoveMember"];
}) {
  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState(member.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setNameVal(member.name);
  }, [member.name, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const saveName = async () => {
    setEditing(false);
    if (nameVal.trim() && nameVal.trim() !== member.name) {
      try {
        await onEdit(member.id, groupId, { name: nameVal.trim() });
      } catch {
        setNameVal(member.name);
      }
    } else {
      setNameVal(member.name);
    }
  };

  const toggleCheckIn = () => {
    onEdit(member.id, groupId, { checked_in: !member.checked_in });
  };

  return (
    <li className="flex items-center gap-2 group/member">
      {/* Check-in toggle */}
      <button
        onClick={toggleCheckIn}
        className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-colors cursor-pointer ${
          member.checked_in
            ? "bg-emerald-600 text-white shadow-emerald-600/30 shadow-md"
            : "bg-gray-800 text-gray-500 hover:bg-gray-700"
        }`}
        title={member.checked_in ? "Checked in – click to undo" : "Click to check in"}
        aria-label={`Toggle check-in for ${member.name}`}
      >
        {member.checked_in ? "✓" : "○"}
      </button>

      {/* Name (editable on click) */}
      {editing ? (
        <input
          ref={inputRef}
          className="flex-1 bg-gray-800 border border-amber-500 rounded-lg px-2 py-1 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
          value={nameVal}
          onChange={(e) => setNameVal(e.target.value)}
          onBlur={saveName}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveName();
            if (e.key === "Escape") {
              setNameVal(member.name);
              setEditing(false);
            }
          }}
        />
      ) : (
        <button
          className={`flex-1 text-left text-sm truncate cursor-pointer hover:underline ${
            member.checked_in ? "text-emerald-300" : "text-gray-300"
          }`}
          onClick={() => setEditing(true)}
          title="Click to edit name"
        >
          {member.name}
        </button>
      )}

      {/* Remove button (visible on hover) */}
      <button
        onClick={() => onRemove(member.id, groupId)}
        className="shrink-0 opacity-0 group-hover/member:opacity-100 transition-opacity text-gray-600 hover:text-red-400 text-sm cursor-pointer"
        title="Remove member"
        aria-label={`Remove ${member.name}`}
      >
        ✕
      </button>
    </li>
  );
}
