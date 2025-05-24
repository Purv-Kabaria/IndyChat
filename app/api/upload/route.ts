import { NextRequest, NextResponse } from "next/server";
import { applySecurityHeaders, isPublicRoute } from "@/lib/auth-utils";

const DIFY_API_KEY = process.env.DIFY_API_KEY;
const DIFY_UPLOAD_API_URL = "https://api.dify.ai/v1/files/upload";

type UploadError = {
  message: string;
  code?: number;
  details?: string;
};

export const runtime = "edge";

// Simple auth check for Edge API routes
async function simpleAuthCheck(req: NextRequest): Promise<boolean> {
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return false;
  
  // Just check if the session cookie exists
  // We can't verify it in Edge Runtime, but this provides basic protection
  const hasSessionCookie = cookieHeader.includes('__session=');
  return hasSessionCookie;
}

export async function POST(req: NextRequest) {
  try {
    const pathname = req.nextUrl.pathname;
    
    // Skip auth for public routes
    if (!isPublicRoute(pathname)) {
      // For protected routes, check for authentication
      const isAuthenticated = await simpleAuthCheck(req);
      
      if (!isAuthenticated) {
        return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
    }
    
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const user = formData.get("user") as string;

    if (!file) {
      const errorResponse = NextResponse.json({ error: "No file provided" }, { status: 400 });
      return applySecurityHeaders(errorResponse);
    }

    if (!user) {
      const errorResponse = NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
      return applySecurityHeaders(errorResponse);
    }

    if (file.size > 15 * 1024 * 1024) {
      const errorResponse = NextResponse.json(
        { error: "File size exceeds 15MB limit" },
        { status: 400 }
      );
      return applySecurityHeaders(errorResponse);
    }

    const difyFormData = new FormData();
    difyFormData.append("file", file);
    difyFormData.append("user", user);

    const uploadResponse = await fetch(DIFY_UPLOAD_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DIFY_API_KEY}`,
      },
      body: difyFormData,
    });

    if (!uploadResponse.ok) {
      let errorData: string | object;
      try {
        errorData = await uploadResponse.json();
      } catch {
        errorData = await uploadResponse.text();
      }
      console.error(
        "API Upload Route: Dify upload failed:",
        uploadResponse.status,
        errorData
      );
      const errorResponse = NextResponse.json(
        {
          error: `File upload failed with status ${uploadResponse.status}`,
          details: errorData,
        },
        { status: uploadResponse.status }
      );
      return applySecurityHeaders(errorResponse);
    }

    const resultData = await uploadResponse.json();

    const successResponse = NextResponse.json(resultData);
    return applySecurityHeaders(successResponse);
  } catch (error: unknown) {
    const uploadError: UploadError = {
      message: error instanceof Error ? error.message : String(error),
      code: 500,
      details: error instanceof Error ? error.stack : undefined,
    };

    console.error(
      "API Upload Route: Internal server error:",
      uploadError.message
    );
    const errorResponse = NextResponse.json(
      {
        error: "File upload processing failed",
        details: uploadError.message,
        code: uploadError.code,
      },
      { status: uploadError.code }
    );
    return applySecurityHeaders(errorResponse);
  }
}
