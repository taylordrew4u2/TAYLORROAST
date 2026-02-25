import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// PUT /api/members/[id] – update member name or checkedIn status
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const data: { name?: string; checkedIn?: boolean } = {};
  if (typeof body.name === "string") data.name = body.name.trim();
  if (typeof body.checkedIn === "boolean") data.checkedIn = body.checkedIn;
  const member = await prisma.member.update({ where: { id }, data });
  return NextResponse.json(member);
}

// DELETE /api/members/[id] – remove a member
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.member.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
