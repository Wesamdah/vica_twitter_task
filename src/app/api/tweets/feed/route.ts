import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateAndAuthorize } from "@/app/middleware/authenticateAndAuthorize";
import { Tweet } from "@prisma/client";

// METHOD : GET
// ROUTE : /api/tweets/feed
// Acess @uthenticated users with roles: Admin, Editer, Viwer

export async function GET(request: NextRequest) {
  const user = await authenticateAndAuthorize(request, [1, 2, 3]);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const followingUsers = await prisma.follow.findMany({
      where: { follower_id: user.id },
    });

    if (!followingUsers.length) {
      return NextResponse.json(
        { message: "You Don't follow any following user" },
        { status: 200 }
      );
    }

    // we want the IDs of users that the current user is following
    const followingUsersId = followingUsers.map(
      (follow) => follow.following_id
    );

    const tweetsPromises = followingUsersId.map((followedUserId) =>
      prisma.tweet.findMany({
        where: { user_id: followedUserId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          tweetReactions: {
            include: {
              reaction: {
                select: {
                  type: true,
                },
              },
            },
          },
        },
      })
    );

    const tweetsArrays = await Promise.all(tweetsPromises);
    const tweets = tweetsArrays.flat();

    if (!tweets.length) {
      return NextResponse.json(
        { message: "No Tweets Found from followed users" },
        { status: 200 }
      );
    }

    return NextResponse.json({ tweets }, { status: 200 });
  } catch (error) {
    console.error("Error fetching tweets feed:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
