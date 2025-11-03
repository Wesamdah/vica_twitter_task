import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";

// method GET
// @route ~/api/follow/[id]/count
// @access Public

export async function GET(
  request: NextRequest,
  contenxt: { params: Promise<{ id: string }> }
) {
  const { id } = await contenxt.params;
  const requestedId = parseInt(id);

  try {
    const existsUser = await prisma.user.findUnique({
      where: { id: requestedId },
    });

    if (!existsUser) {
      return NextResponse.json({ message: "User Not Found" }, { status: 404 });
    }

    const followersCount = await prisma.follow.count({
      where: {
        following_id: requestedId,
      },
    });

    const followingsCount = await prisma.follow.count({
      where: {
        follower_id: requestedId,
      },
    });

    return NextResponse.json(
      {
        userId: requestedId,
        followersCount,
        followingsCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching follow count:", error);
    return NextResponse.json(
      { message: "Error fetching follow count" },
      { status: 500 }
    );
  }
}
