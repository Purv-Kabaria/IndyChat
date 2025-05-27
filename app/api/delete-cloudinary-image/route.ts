import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { public_id } = body;

    if (!public_id) {
      return NextResponse.json(
        { message: "Public ID is required for deletion." },
        { status: 400 }
      );
    }

    const result = await cloudinary.uploader.destroy(public_id as string);

    if (result.result === "ok") {
      console.log(`Successfully deleted image from Cloudinary: ${public_id}`);
      return NextResponse.json(
        {
          message: "Image successfully deleted from Cloudinary",
          details: result,
        },
        { status: 200 }
      );
    } else if (result.result === "not found") {
      console.log(`Image not found on Cloudinary, public_id: ${public_id}`);

      return NextResponse.json(
        {
          message: "Image not found on Cloudinary, but request processed",
          details: result,
        },
        { status: 200 }
      );
    } else {
      console.error(`Cloudinary deletion failed for ${public_id}:`, result);
      return NextResponse.json(
        { message: "Cloudinary deletion failed", details: result },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in /api/delete-cloudinary-image:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json(
      { message: "Server error during image deletion.", error: errorMessage },
      { status: 500 }
    );
  }
}
