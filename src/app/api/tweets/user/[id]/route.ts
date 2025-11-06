import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateAndAuthorize } from "@/app/middleware/authenticateAndAuthorize";

// METHOD : GET
// Route : /api/tweets/user/:id
// access all logged in users with roles: Admin, Editor, Viewer

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const selectedId = parseInt(id);

  const user = await authenticateAndAuthorize(request, [1, 2, 3]);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const selectedUser = await prisma.user.findUnique({
      where: { id: selectedId },
    });

    if (!selectedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const userTweets = await prisma.tweet.findMany({
      where: { user_id: selectedId },
      select: {
        tweet: true,
      },
    });

    if (!userTweets.length) {
      return NextResponse.json(
        { message: "This user has not posted any tweets yet" },
        { status: 404 }
      );
    }

    return NextResponse.json({ tweets: userTweets }, { status: 200 });
  } catch (error) {
    console.error("Error fetching tweets feed:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
