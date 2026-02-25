import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// PUT /api/groups/[id] – update group name
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { name } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const group = await prisma.group.update({
    where: { id },
    data: { name: name.trim() },
    include: { members: { orderBy: { createdAt: "asc" } } },
  });
  return NextResponse.json(group);
}

// DELETE /api/groups/[id] – delete group (cascades to members)
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.group.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
