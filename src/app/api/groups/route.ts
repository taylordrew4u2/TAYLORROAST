/**
 * GET  /api/groups          → list all groups with members
 * POST /api/groups          → create a group  { name?: string }
 * PUT  /api/groups          → update a group  { id: number, name: string }
 * DELETE /api/groups?id=N   → delete a group
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getAllGroupsWithMembers,
  createGroup,
  updateGroup,
  deleteGroup,
} from "@/lib/db";

export const dynamic = "force-dynamic"; // never cache

export async function GET() {
  try {
    const groups = await getAllGroupsWithMembers();
    return NextResponse.json(groups);
  } catch (err: unknown) {
    console.error("GET /api/groups error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const group = await createGroup(body.name);
    return NextResponse.json(group, { status: 201 });
  } catch (err: unknown) {
    console.error("POST /api/groups error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id || !body.name) {
      return NextResponse.json(
        { error: "id and name are required" },
        { status: 400 },
      );
    }
    const group = await updateGroup(body.id, body.name);
    return NextResponse.json(group);
  } catch (err: unknown) {
    console.error("PUT /api/groups error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    await deleteGroup(Number(id));
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("DELETE /api/groups error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
