import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// POST /api/groups/[id]/members – add a member to a group
export async function POST(request: NextRequest, { params }: Params) {
  const { id: groupId } = await params;
  const { name } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const member = await prisma.member.create({
    data: { groupId, name: name.trim() },
  });
  return NextResponse.json(member, { status: 201 });
}
