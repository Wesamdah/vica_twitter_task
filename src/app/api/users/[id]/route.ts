import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateAndAuthorize } from "@/app/middleware/authenticateAndAuthorize";

// method GET
// @route ~/api/users/id
// @access Admin Only

interface UpdatedData {
  name?: string;
  role_id?: number;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const adminUser = await authenticateAndAuthorize(request, [1]);

  if (!adminUser) {
    return NextResponse.json(
      { message: "Unauthorized or Forbidden" },
      { status: 403 }
    );
  }

  try {
    const { id } = await context.params;
    const selectedUser = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: { tweets: true, _count: true },
      //   or
      //     include: {
      //   _count: {
      //     select: { tweets: true },
      //   },
      // },
    });

    if (!selectedUser) {
      return NextResponse.json({ message: "User Not Found" }, { status: 404 });
    }

    const { password, token, ...safeUser } = selectedUser;

    return NextResponse.json(safeUser, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal Server Erro" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const adminUser = await authenticateAndAuthorize(request, [1]);
  if (!adminUser) {
    return NextResponse.json(
      { message: "Unauthorized or Forbidden" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { name, role_id } = body;

    const requsetedId = parseInt(id);

    const selectedUser = await prisma.user.findUnique({
      where: { id: requsetedId },
      select: {
        id: true,
        name: true,
        email: true,
        role_id: true,
      },
    });

    if (!selectedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const updateData: UpdatedData = {};

    if (typeof name === "string") {
      const trimmed = name.trim();
      if (trimmed.length > 0 && trimmed !== selectedUser.name) {
        updateData.name = trimmed;
      }
    }

    const roles = [1, 2, 3];

    if (typeof role_id === "number" && roles.includes(role_id)) {
      updateData.role_id = role_id;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: requsetedId },
      data: updateData,
    });

    const { password, token, ...safeUser } = updated;

    return NextResponse.json(
      { message: "Profile updated", user: safeUser },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const requsetedId = parseInt(id);
  const adminUser = await authenticateAndAuthorize(request, [1]);

  if (!adminUser) {
    return NextResponse.json(
      { message: "Unauthorized or Forbidden" },
      { status: 403 }
    );
  }

  try {
    const selectedUser = await prisma.user.findUnique({
      where: { id: requsetedId },
    });

    if (!selectedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id: requsetedId },
    });

    return NextResponse.json(
      { message: "User Deleted Successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
