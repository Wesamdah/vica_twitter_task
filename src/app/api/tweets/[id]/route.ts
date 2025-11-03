import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateAndAuthorize } from "@/app/middleware/authenticateAndAuthorize";
import path from "path";
import fs from "fs";

// method GET
// @route ~/api/tweets/id
// @access Users Only

interface UpdatedData {
  tweet?: string;
  image?: string | null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const requestedId = parseInt(id);

  const user = await authenticateAndAuthorize(request, [1, 2, 3]);

  if (!user) {
    return NextResponse.json(
      { message: "Unauthorized or Forbidden" },
      { status: 403 }
    );
  }

  try {
    const tweet = await prisma.tweet.findFirst({
      where: { id: requestedId },
    });

    if (!tweet) {
      return NextResponse.json({ message: "Tweet Not Found" }, { status: 404 });
    }

    return NextResponse.json(tweet, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occured";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// method PATCH
// @route ~/api/tweets/id
// @access The logged in user

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const requestedId = parseInt(id);

  const user = await authenticateAndAuthorize(request, [1, 2]);
  if (!user) {
    return NextResponse.json(
      { message: "Unauthorized or Forbidden" },
      { status: 403 }
    );
  }

  try {
    const contentType = request.headers.get("Content-Type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    const updateData: UpdatedData = {};

    const formData = await request.formData();
    const newTweet = formData.get("new_tweet")?.toString() || "";

    updateData.tweet = newTweet;

    const imageFile = formData.get("image") as File | null;
    const removeImage = formData.get("remove_image")?.toString() || "false";

    // if (!newTweet && !imageFile) {
    //   return NextResponse.json({ error: "Invalid Data" }, { status: 422 });
    // }

    const tweet = await prisma.tweet.findUnique({
      where: { id: requestedId },
    });

    if (!tweet) {
      return NextResponse.json({ message: "Tweet Not Found" }, { status: 404 });
    }

    if (tweet.user_id !== user.id) {
      return NextResponse.json(
        { message: "Access denied: cannot edit other user's tweets" },
        { status: 403 }
      );
    }

    let imagePath = tweet.image; // keep old image if no new one

    if (removeImage === "true" && tweet.image) {
      const oldImagePath = path.join(process.cwd(), "public", tweet.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
      updateData.image = null;
    }

    if (imageFile && imageFile.size > 0) {
      const uploadDir = path.join(process.cwd(), "/public/uploads/images");
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      const maxFileSize = 2 * 1024 * 1024; // 2Mb

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      if (!allowedTypes.includes(imageFile.type)) {
        return NextResponse.json(
          {
            error: `Invalid file type. Allowed types: ${allowedTypes.join(
              ","
            )}`,
          },
          { status: 400 }
        );
      }

      if (imageFile.size > maxFileSize) {
        return NextResponse.json(
          { error: "File size exceeds the 2MB limit." },
          { status: 400 }
        );
      }

      const safeFileName = imageFile.name
        .replace(/\s+/g, "_")
        .replace(/[^\w.-]/g, "");
      const fileName = `${Date.now()}_${safeFileName}`;
      const filePath = path.join(uploadDir, fileName);

      const buffer = Buffer.from(await imageFile.arrayBuffer());
      fs.writeFileSync(filePath, new Uint8Array(buffer));

      imagePath = `/uploads/images/${fileName}`;

      updateData.image = imagePath;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No valid fields to update" },
        { status: 400 }
      );
    }

    await prisma.tweet.update({
      where: { id: requestedId },
      data: updateData,
    });

    const updatedTweet = await prisma.tweet.findUnique({
      where: { id: requestedId },
    });

    return NextResponse.json({ tweet: updatedTweet }, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// method DELETE
// @route ~/api/tweets/id
// @access Admin or The logged in User

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const requestedId = parseInt(id);

  const user = await authenticateAndAuthorize(request, [1, 2]);

  if (!user) {
    return NextResponse.json(
      { message: "Unauthorized or Forbidden" },
      { status: 403 }
    );
  }

  try {
    const requestredTweet = await prisma.tweet.findUnique({
      where: { id: requestedId },
    });

    if (!requestredTweet) {
      return NextResponse.json({ message: "Tweet Not Found" }, { status: 404 });
    }

    if (requestredTweet?.user_id !== user.id && user.role_id !== 1) {
      return NextResponse.json(
        {
          message: "Access denied: cannot delete other user's tweets",
        },
        { status: 403 }
      );
    }

    await prisma.tweet.delete({ where: { id: requestedId } });
    return NextResponse.json(
      { message: "Tweet Deleted Successfully" },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occured";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
