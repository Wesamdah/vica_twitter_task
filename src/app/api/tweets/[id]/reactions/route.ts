import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateAndAuthorize } from "@/app/middleware/authenticateAndAuthorize";

// method GET
// @route ~/api/tweets/[id]/reactions
// @access Public

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const requestedId = parseInt(id);

  try {
    const tweetExists = await prisma.tweet.findUnique({
      where: { id: requestedId },
    });

    if (!tweetExists) {
      return NextResponse.json({ message: "Tweet Not Found" }, { status: 404 });
    }

    const reactions = await prisma.tweetReaction.findMany({
      where: { tweet_id: requestedId },
      include: {
        reaction: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    const formatedReactions = reactions.map((reaction) => ({
      id: reaction.id,
      user: reaction.reaction.user,
      reactionType: reaction.reaction.type,
      created_at: reaction.reaction.created_at,
      updated_at: reaction.reaction.updated_at,
    }));

    return NextResponse.json(
      { tweet_id: requestedId, data: formatedReactions },
      { status: 200 }
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

// method DELETE
// @route ~/api/tweets/[id]/reactions
// @access Admin, Editor, viewer

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const requestedId = parseInt(id);
  const user = await authenticateAndAuthorize(request, [1, 2, 3]); // Admin, Editor, viewer ,All can delete reaction

  if (!user) {
    return NextResponse.json(
      { message: "Unauthorized or Forbidden" },
      { status: 403 }
    );
  }

  try {
    const exsistingTweet = await prisma.tweet.findUnique({
      where: { id: requestedId },
    });
    if (!exsistingTweet) {
      return NextResponse.json({ message: "Tweet Not Found" }, { status: 404 });
    }

    const exsistingReaction = await prisma.tweetReaction.findFirst({
      where: {
        tweet_id: requestedId,
        reaction: {
          user_id: user.id,
        },
      },
      include: {
        reaction: true,
      },
    });

    if (!exsistingReaction) {
      return NextResponse.json(
        { message: "Reaction Not Found for this user" },
        { status: 404 }
      );
    }

    await prisma.tweetReaction.delete({
      where: { id: exsistingReaction.id },
    });

    await prisma.reaction.delete({
      where: { id: exsistingReaction.reaction.id },
    });

    return NextResponse.json(
      { message: "Reaction deleted successfully" },
      { status: 200 }
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
