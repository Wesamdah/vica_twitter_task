import prisma from "@/lib/prisma";
import { generateJWT } from "@/utils/generateToken";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { serialize } from "cookie";

// method POST
// @route ~/api/login
// @access public

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Invalid Data" }, { status: 422 });
    }

    const exsistingUser = await prisma.user.findFirst({ where: { email } });

    if (!exsistingUser) {
      return NextResponse.json(
        { message: "User Not Registered" },
        { status: 404 }
      );
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      exsistingUser.password
    );

    if (!isPasswordCorrect) {
      return NextResponse.json(
        { message: "Invalid Password" },
        { status: 403 }
      );
    }

    const jwtPayload = {
      id: exsistingUser.id,
      name: exsistingUser.name,
      email: exsistingUser.email,
      role_id: exsistingUser.role_id,
    };

    const token = generateJWT(jwtPayload);

    await prisma.user.update({
      where: { id: exsistingUser.id },
      data: { token },
    });

    const cookie = serialize("jwtToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 1,
    });

    return NextResponse.json(
      { message: "Authenticated", token },
      { status: 200, headers: { "Set-Cookie": cookie } }
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
