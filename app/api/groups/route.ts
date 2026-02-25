import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/groups – list all groups with members
export async function GET() {
  const groups = await prisma.group.findMany({
    include: { members: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(groups);
}

// POST /api/groups – create a new group
export async function POST(request: NextRequest) {
  const { name } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const group = await prisma.group.create({
    data: { name: name.trim() },
    include: { members: true },
  });
  return NextResponse.json(group, { status: 201 });
}
