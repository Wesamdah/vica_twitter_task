import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/utils/verifyToken";
import bcrypt from "bcryptjs";

// old way
// interface Props {
//   params: { id: string };
// }

interface UpdatedData {
  name?: string;
  password?: string;
}

// method GET
// @route ~/api/profile/id
// @access Private | Only for The same user

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // course vica
    // const user = await prisma.user.findUnique({
    //   where: { id: parseInt(params.id) },
    //   select: {
    //     id: true,
    //     email: true,
    //     name: true,
    //     token: true,
    //     created_at: true,
    //   },
    // });
    // if (!user) {
    //   return NextResponse.json({ message: "User Not Found" }, { status: 404 });
    // }
    // const userFomToken = verifyToken(user.token);
    // if (userFomToken === null || userFomToken.email !== user.email) {
    //   return NextResponse.json(
    //     {
    //       message: "you are not allowed,access denied",
    //     },
    //     { status: 403 }
    //   );
    // }

    const { id } = await context.params;

    const token = request.cookies.get("jwtToken")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "You are not logged in" },
        { status: 403 }
      );
    }

    const verifiedToken = verifyToken(token);

    if (!verifiedToken) {
      return NextResponse.json(
        { message: "Invalid or Expired token" },
        { status: 403 }
      );
    }

    const requsetedId = parseInt(id);
    if (verifiedToken.id !== requsetedId) {
      return NextResponse.json(
        { message: "Access denied: cannot view other user's data" },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: requsetedId },
      select: {
        id: true,
        name: true,
        email: true,
        role_id: true,
        created_at: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Server error", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const token = request.cookies.get("jwtToken")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const verifiedToken = verifyToken(token);

    if (!verifiedToken) {
      return NextResponse.json(
        { message: "Invalid or Expired token" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, old_password, new_password, confirm_password } = body;

    const requsetedId = parseInt(id);

    if (verifiedToken.id !== requsetedId) {
      return NextResponse.json(
        { message: "Access denied: cannot edit other user's data" },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const updateData: UpdatedData = {};
    if (typeof name === "string") {
      const trimmed = name.trim();
      if (trimmed.length > 0 && trimmed !== user.name) {
        updateData.name = trimmed;
      }
    }

    if (new_password !== undefined) {
      if (typeof new_password !== "string" || new_password.length < 6) {
        return NextResponse.json(
          { message: "New password must be at least 6 chars" },
          { status: 400 }
        );
      }
      if (new_password !== confirm_password) {
        return NextResponse.json(
          { message: "Password confirmation does not match" },
          { status: 400 }
        );
      }
      if (typeof old_password !== "string" || old_password.length === 0) {
        return NextResponse.json(
          { message: "Old password required to change password" },
          { status: 400 }
        );
      }
      const match = await bcrypt.compare(old_password, user.password);
      if (!match) {
        return NextResponse.json(
          { message: "Old password is incorrect" },
          { status: 401 }
        );
      }
      const hashedPassword = await bcrypt.hash(new_password, 10);
      updateData.password = hashedPassword;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    const { password, ...safeUser } = updated;

    return NextResponse.json(
      { message: "Profile updated", user: safeUser },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const token = request.cookies.get("jwtToken")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const verifiedToken = verifyToken(token);

    if (!verifiedToken) {
      return NextResponse.json(
        { message: "Invalid or Expired token" },
        { status: 403 }
      );
    }

    const requestId = parseInt(id);

    if (verifiedToken.id !== requestId) {
      return NextResponse.json(
        {
          message: "Access denied: cannot delete other user's data",
        },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: requestId } });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id: requestId } });

    return NextResponse.json(
      { message: "User Deleted Successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
