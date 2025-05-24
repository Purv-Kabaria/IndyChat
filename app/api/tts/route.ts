import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getUserProfile } from "@/lib/firebase-server";
import { DEFAULT_VOICE_ID } from "@/functions/ttsUtils";
import { applySecurityHeaders, isPublicRoute } from "@/lib/auth-utils";

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech";

interface RateLimitEntry {
  count: number;
  timestamp: number;
  totalChars: number;
}
const rateLimitCache = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_MINUTE = 10;
const MAX_CHARS_PER_MINUTE = 1000;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitCache.entries()) {
    if (now - entry.timestamp > RATE_LIMIT_WINDOW) {
      rateLimitCache.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Simple auth check for Edge API routes
async function simpleAuthCheck(req: NextRequest): Promise<boolean> {
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return false;
  
  // Just check if the session cookie exists
  // We can't verify it in Edge Runtime, but this provides basic protection
  const hasSessionCookie = cookieHeader.includes('__session=');
  return hasSessionCookie;
}

export async function POST(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;
    
    // Skip auth for public routes
    if (!isPublicRoute(pathname)) {
      // For protected routes, check for authentication
      const isAuthenticated = await simpleAuthCheck(request);
      
      if (!isAuthenticated) {
        return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
    }
    
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error("Missing ElevenLabs API key");
      const errorResponse = NextResponse.json(
        { error: "TTS service configuration error" },
        { status: 500 }
      );
      return applySecurityHeaders(errorResponse);
    }

    const user = await getCurrentUser();
    if (!user) {
      const errorResponse = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      return applySecurityHeaders(errorResponse);
    }

    const userProfile = await getUserProfile();
    if (!userProfile) {
      const errorResponse = NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
      return applySecurityHeaders(errorResponse);
    }

    const ttsEnabled = userProfile.tts_enabled || false;
    if (!ttsEnabled) {
      const errorResponse = NextResponse.json(
        { error: "Text-to-speech is not enabled for this account" },
        { status: 403 }
      );
      return applySecurityHeaders(errorResponse);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      const errorResponse = NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
      return applySecurityHeaders(errorResponse);
    }

    const { text } = body;
    if (!text || typeof text !== "string") {
      const errorResponse = NextResponse.json(
        { error: "Text is required and must be a string" },
        { status: 400 }
      );
      return applySecurityHeaders(errorResponse);
    }

    const userId = user.uid;
    const textLength = text.length;

    if (!checkRateLimit(userId, textLength)) {
      const errorResponse = NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
      return applySecurityHeaders(errorResponse);
    }

    const voiceId = body.voiceId || userProfile.voice_id || DEFAULT_VOICE_ID;

    const response = await fetch(`${ELEVENLABS_API_URL}/${voiceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!response.ok) {
      let errorMessage = "Failed to generate speech";

      try {
        const errorData = await response.json();
        console.error("ElevenLabs API error:", errorData);

        if (errorData.detail?.status === "invalid_voice_id") {
          errorMessage = "Invalid voice ID";
        } else if (errorData.detail?.status === "audio_generation_failed") {
          errorMessage = "Audio generation failed";
        }
      } catch (e) {
        console.error("Error parsing ElevenLabs error response:", e);
      }

      const errorResponse = NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
      return applySecurityHeaders(errorResponse);
    }

    const audioBuffer = await response.arrayBuffer();

    const successResponse = new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Cache-Control": "private, max-age=3600",
      },
    });
    
    return applySecurityHeaders(successResponse);
  } catch (error) {
    console.error("Error in TTS API:", error);
    const errorResponse = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return applySecurityHeaders(errorResponse);
  }
}

function checkRateLimit(userId: string, textLength: number): boolean {
  const now = Date.now();
  const entry = rateLimitCache.get(userId);

  if (!entry || now - entry.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitCache.set(userId, {
      count: 1,
      timestamp: now,
      totalChars: textLength,
    });
    return true;
  }

  if (
    entry.count >= MAX_REQUESTS_PER_MINUTE ||
    entry.totalChars + textLength > MAX_CHARS_PER_MINUTE
  ) {
    return false;
  }

  entry.count += 1;
  entry.totalChars += textLength;
  return true;
}
