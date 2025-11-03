import { NextRequest, NextResponse } from "next/server";
import { authenticateAndAuthorize } from "@/app/middleware/authenticateAndAuthorize";
import prisma from "@/lib/prisma";

// method GET
// @route ~/api/follow/[id]
// @access Protected (Admin, Editor, Viewer)

export async function GET(
  request: NextRequest,
  contenxt: { params: Promise<{ id: string }> }
) {
  const { id } = await contenxt.params;
  const requestedId = parseInt(id);

  const user = await authenticateAndAuthorize(request, [1, 2, 3]); // Admin, Editor, viewer ,All can see followers
  if (!user) {
    return NextResponse.json(
      { message: "Unauthorized or Forbidden" },
      { status: 403 }
    );
  }

  try {
    const targetFollowersUser = await prisma.user.findUnique({
      where: { id: requestedId },
      include: {
        followers: {
          include: {
            follower: {
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

    const targetFollowingUser = await prisma.user.findUnique({
      where: { id: requestedId },
      include: {
        followings: {
          include: {
            following: {
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

    return NextResponse.json(
      {
        followers: targetFollowersUser?.followers.map((f) => f.follower),
        followings: targetFollowingUser?.followings.map((f) => f.following),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error fetching follow data" },
      { status: 500 }
    );
  }
}

// method POST
// @route ~/api/follow/[id]
// @access Protected (Admin, Editor, Viewer)

export async function POST(
  request: NextRequest,
  contenxt: { params: Promise<{ id: string }> }
) {
  const { id } = await contenxt.params;

  const requestedId = parseInt(id);

  const user = await authenticateAndAuthorize(request, [1, 2, 3]); // Admin, Editor, viewer ,All can follow

  if (!user) {
    return NextResponse.json(
      { message: "Unauthorized or Forbidden" },
      { status: 403 }
    );
  }

  if (user.id === requestedId) {
    return NextResponse.json(
      { message: "You cannot follow yourself" },
      { status: 400 }
    );
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: requestedId },
    });

    if (!targetUser) {
      return NextResponse.json({ message: "User Not Found" }, { status: 404 });
    }

    //  check if already following
    const alreadyFollowing = await prisma.follow.findUnique({
      // this condition is based on the unique constraint defined in the schema
      // @@unique([follower_id, following_id])
      //   so prisma will use this to check if the follow relationship already exists,when wirte @@unique in schema
      //   so will return two lines blow one for follower_id and one for following_id
      //   so if there a third line it means there is duplicate and we cannot follow again
      where: {
        follower_id_following_id: {
          follower_id: user.id,
          following_id: requestedId,
        },
      },
    });

    if (alreadyFollowing) {
      return NextResponse.json(
        { message: "You are already following this user" },
        { status: 400 }
      );
    }

    const follow = await prisma.follow.create({
      data: {
        follower_id: user.id,
        following_id: requestedId,
      },
    });

    return NextResponse.json(
      { message: "Followed successfully", follow },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error creating follow" },
      { status: 500 }
    );
  }
}

// method DELETE
// @route ~/api/follow/[id]
// @access Protected (Admin, Editor, Viewer)

export async function DELETE(
  request: NextRequest,
  contenxt: { params: Promise<{ id: string }> }
) {
  const { id } = await contenxt.params;
  const requestedId = parseInt(id);
  const user = await authenticateAndAuthorize(request, [1, 2, 3]); // Admin, Editor, viewer ,All can unfollow

  if (!user) {
    return NextResponse.json(
      { message: "Unauthorized or Forbidden" },
      { status: 403 }
    );
  }

  try {
    const existsingFollow = await prisma.follow.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: user.id,
          following_id: requestedId,
        },
      },
    });

    if (!existsingFollow) {
      return NextResponse.json(
        { message: "You are not following this user" },
        { status: 404 }
      );
    }

    await prisma.follow.delete({
      where: {
        follower_id_following_id: {
          follower_id: user.id,
          following_id: requestedId,
        },
      },
    });

    return NextResponse.json(
      { message: "Unfollowed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error unfollowing user" },
      { status: 500 }
    );
  }
}
