import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateJWT } from "@/utils/generateToken";

// npm i bcryptjs @types/bcryptjs
import bcrypt from "bcryptjs";

// Set Cookie (npm i cookie)
import { serialize } from "cookie";

// method POST
// @route ~/api/register
// @access public

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, confirm_password, role_id } =
      await request.json();

    if (!name || !email || !password || !confirm_password || role_id === null) {
      return NextResponse.json({ error: "Invalid Data" }, { status: 422 });
    }

    if (password !== confirm_password) {
      return NextResponse.json(
        { error: "Password doesn't match" },
        { status: 422 }
      );
    }

    const exsistUser = await prisma.user.findFirst({ where: { email } });

    if (exsistUser) {
      return NextResponse.json(
        {
          message: "User Already Registered, Please Login",
        },
        { status: 403 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const roles = [2, 3]; // 1: Admin 2: Editor 3: Viewer
    console.log("tessst", role_id);
    const allowedRole = roles.includes(role_id) ? role_id : 3;
    console.log("allowedRole", allowedRole);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role_id: allowedRole,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User Not Found" }, { status: 404 });
    }

    const tokenPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role_id: user.role_id,
    };

    const token = generateJWT(tokenPayload);

    await prisma.user.update({
      where: { id: user.id },
      data: { token },
    });

    const cookie = serialize("jwtToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 1, // One Day
    });

    return NextResponse.json(
      {
        message: "User registered successfully",
        ...user,
        token,
      },
      { status: 201, headers: { "Set-Cookie": cookie } }
    );
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json(
        {
          error: "Unexpected error occured",
        },
        { status: 500 }
      );
    }
  }
}
