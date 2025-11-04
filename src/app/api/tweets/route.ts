import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateAndAuthorize } from "@/app/middleware/authenticateAndAuthorize";
// For local image upload handling or on real server
// import path from "path"; // path module to work with the paths
// import fs from "fs"; //File system module for handling file operation

// method GET
// @route ~/api/tweets
// @access public

export async function GET(request: NextRequest) {
  try {
    // for make search Request
    // in the request api will send in the body params this params is search
    // so I saved the full URL with the params will send it include the body request
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const tweets = await prisma.tweet.findMany({
      where: {
        // filter in the tweet column
        tweet: {
          contains: search,
          mode: "insensitive",
        },
      },
      orderBy: {
        created_at: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ data: tweets }, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// method POST
// @route ~/api/tweets
// @access Editer or Admin

export async function POST(request: NextRequest) {
  const user = await authenticateAndAuthorize(request, [1, 2]);

  if (!user) {
    return NextResponse.json(
      { message: "Unauthorized or Forbidden" },
      { status: 403 }
    );
  }

  try {
    // Directory where uploaded images will be stored
    // const uploadDir = path.join(process.cwd(), "/public/uploads/images");
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    const maxFileSize = 2 * 1024 * 1024; // 2Mb

    // Check if the uploads directory exsist, if not create it
    // if (!fs.existsSync(uploadDir)) {
    //   fs.mkdirSync(uploadDir, { recursive: true }); //mkdir : make direction  recursive : the request for create
    // }

    // To Upload Image on Neon,It will be in base64 format
    let base64Image: string | null = null;

    // Extract form data from the requset
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;
    const tweet = formData.get("tweet")?.toString();

    const userId = user?.id;

    if (!tweet || !userId) {
      return NextResponse.json({ error: "Invalid Data" }, { status: 422 });
    }

    if (imageFile) {
      // Valid Image Type
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

      // Valid Image Size
      if (imageFile.size > maxFileSize) {
        return NextResponse.json(
          {
            error: "File Size exceeds the 2MB limit.",
          },
          { status: 400 }
        );
      }

      // Generate Unique Filename
      const safeFileName = imageFile.name
        .replace(/\s+/g, "_")
        .replace(/[^\w.-]/g, "");
      const fileName = `${Date.now()}_${safeFileName}`;
      // const filePath = path.join(uploadDir, fileName);

      // Convert the image to Buffer and write it to the file System
      const buffer = Buffer.from(await imageFile.arrayBuffer());

      // fs.writeFileSync(filePath, new Uint8Array(buffer)); //Save the file
      // Convert the image to Buffer and write it to the file System

      base64Image = buffer.toString("base64");
    }

    const createdTweet = await prisma.tweet.create({
      data: {
        user_id: userId,
        tweet,
        // image: `/uploads/images/${fileName}`,
        image: base64Image || null,
      },
    });

    return NextResponse.json({ tweet: createdTweet }, { status: 201 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occured";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
