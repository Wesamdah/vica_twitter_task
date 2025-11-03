import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateAndAuthorize } from "@/app/middleware/authenticateAndAuthorize";
import bcrypt from "bcryptjs";
import { JWTPayload } from "@/utils/types";
import { generateJWT } from "@/utils/generateToken";

// method GET
// @route ~/api/users
// @access Admin Only

export async function GET(request: NextRequest) {
  const user = await authenticateAndAuthorize(request, [1]);

  if (!user) {
    return NextResponse.json(
      { message: "Unauthorized or Forbidden" },
      { status: 403 }
    );
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role_id: true,
        created_at: true,
      },
    });

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

// method POST
// @route ~/api/users
// @access Admin Only

export async function POST(request: NextRequest) {
  const user = await authenticateAndAuthorize(request, [1]);

  if (!user) {
    return NextResponse.json(
      { message: "Unauthorized or Forbidden" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { name, email, password, confirm_password, role_id } = body;

    if (!name || !email || !password || !confirm_password || !role_id) {
      return NextResponse.json(
        {
          message: "Name , Email , Password , Role. All Required",
        },
        { status: 400 }
      );
    }

    if (password !== confirm_password) {
      return NextResponse.json(
        { error: "Password doesn't match" },
        { status: 422 }
      );
    }

    const existingUser = await prisma.user.findFirst({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { message: "User Already Created" },
        { status: 409 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role_id,
      },
    });

    if (!newUser) {
      return NextResponse.json({ message: "User Not Found" }, { status: 404 });
    }

    //  I can make the requset without token cuz it won't start a new session

    // const jwtPayload: JWTPayload = {
    //   id: newUser.id,
    //   name: newUser.name,
    //   email: newUser.email,
    //   role_id: newUser.role_id,
    // };

    // const token = generateJWT(jwtPayload);

    // await prisma.user.update({
    //   where: { id: newUser.id },
    //   data: { token },
    // });

    return NextResponse.json(
      { message: "User Created Successfully" },
      { status: 201 }
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
