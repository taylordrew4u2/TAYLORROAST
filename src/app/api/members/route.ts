/**
 * POST   /api/members          → create a member  { group_id, name? }
 * PUT    /api/members          → update a member  { id, name?, checked_in? }
 * DELETE /api/members?id=N     → delete a member
 */

import { NextRequest, NextResponse } from "next/server";
import { createMember, updateMember, deleteMember } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.group_id) {
      return NextResponse.json(
        { error: "group_id is required" },
        { status: 400 },
      );
    }
    const member = await createMember(body.group_id, body.name);
    return NextResponse.json(member, { status: 201 });
  } catch (err: unknown) {
    console.error("POST /api/members error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const member = await updateMember(body.id, {
      name: body.name,
      checked_in: body.checked_in,
    });
    return NextResponse.json(member);
  } catch (err: unknown) {
    console.error("PUT /api/members error:", err);
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
    await deleteMember(Number(id));
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("DELETE /api/members error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
