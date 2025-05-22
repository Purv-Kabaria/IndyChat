import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getUserProfile } from "@/lib/firebase-server";
import { DEFAULT_VOICE_ID } from "@/functions/ttsUtils";

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

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error("Missing ElevenLabs API key");
      return NextResponse.json(
        { error: "TTS service configuration error" },
        { status: 500 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userProfile = await getUserProfile();
    if (!userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const ttsEnabled = userProfile.tts_enabled || false;
    if (!ttsEnabled) {
      return NextResponse.json(
        { error: "Text-to-speech is not enabled for this account" },
        { status: 403 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { text } = body;
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required and must be a string" },
        { status: 400 }
      );
    }

    const userId = user.uid;
    const textLength = text.length;

    if (!checkRateLimit(userId, textLength)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
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

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error in TTS API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
