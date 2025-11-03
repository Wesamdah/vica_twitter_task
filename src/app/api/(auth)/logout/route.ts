import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/utils/verifyToken";
import prisma from "@/lib/prisma";

// method GET
// @route ~/api/logout
// @access Public

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("jwtToken")?.value || "";

    if (!token) {
      return NextResponse.json(
        { message: "You are Not logged in" },
        { status: 400 }
      );
    }

    const payload = verifyToken(token);

    if (!payload?.email) {
      return NextResponse.json({ message: "Invalid Token" }, { status: 401 });
    }

    await prisma.user.update({
      where: { email: payload.email },
      data: {
        token: null,
      },
    });

    const response = NextResponse.json({ message: "Logout" }, { status: 200 });

    response.cookies.set("jwtToken", "", {
      httpOnly: true,
      secure: true,
      path: "/",
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
