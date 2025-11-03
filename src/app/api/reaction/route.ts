import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateAndAuthorize } from "@/app/middleware/authenticateAndAuthorize";

// method POST
// @route ~/api/reaction
// @access All Authenticated Users (Admin, Editor, viwer)

export async function POST(requset: NextRequest) {
  const user = await authenticateAndAuthorize(requset, [1, 2, 3]); // Admin, Editor, viwer ,All can react

  if (!user) {
    return NextResponse.json(
      { message: "Unauthorized or Forbidden" },
      { status: 403 }
    );
  }

  try {
    const body = await requset.json();
    const { tweet_id, type } = body;

    // check if tweet exists
    const tweet = await prisma.tweet.findUnique({
      where: { id: tweet_id },
    });

    if (!tweet) {
      return NextResponse.json({ message: "Tweet not found" }, { status: 404 });
    }

    if (!["LIKE", "LOVE", "FUNNY"].includes(type)) {
      return NextResponse.json(
        { message: "Invalid reaction type" },
        { status: 400 }
      );
    }

    if (!tweet_id || !type || !user.id) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const exsistingReaction = await prisma.tweetReaction.findFirst({
      where: {
        tweet: { id: tweet_id },
        reaction: {
          //   type: type,
          user_id: user.id,
        },
      },
      include: {
        reaction: true,
      },
    });

    if (exsistingReaction) {
      return NextResponse.json(
        { message: "Reaction already exists" },
        { status: 400 }
      );
    }

    const reaction = await prisma.reaction.create({
      data: {
        type: type,
        user_id: user.id,
        tweetReactions: {
          create: {
            tweet_id: tweet_id,
          },
        },
      },
    });

    return NextResponse.json(
      { message: "Reaction added successfully", reaction },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding reaction:", error);
    return NextResponse.json(
      { message: "Server error", error },
      { status: 500 }
    );
  }
}
