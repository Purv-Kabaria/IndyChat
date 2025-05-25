import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/app/api/auth/firebase-admin";
import { DEFAULT_VOICE_ID } from "@/functions/ttsUtils";

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech";

interface UserProfile {
  tts_enabled?: boolean;
  voice_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ElevenLabs API key not configured" },
        { status: 500 }
      );
    }

    // Firebase Authentication: Verify ID Token from Authorization header
    const authorizationHeader = request.headers.get("Authorization");
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Missing or malformed Authorization header" }, { status: 401 });
    }
    const idToken = authorizationHeader.split("Bearer ")[1];
    if (!idToken) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }

    let decodedClaims;
    try {
      decodedClaims = await adminAuth.verifyIdToken(idToken, true /** checkRevoked */);
    } catch (authError) {
      console.error("Firebase auth error (ID token verification):", authError);
      return NextResponse.json({ error: "Unauthorized: Invalid ID token" }, { status: 401 });
    }

    const userId = decodedClaims.uid;

    // Fetch user profile from Firestore to get TTS settings
    const userProfileRef = adminDb.collection("users").doc(userId);
    const userProfileSnap = await userProfileRef.get();

    if (!userProfileSnap.exists) {
      console.error(`User profile not found for UID: ${userId}`);
      return NextResponse.json({ error: "User profile not found" }, { status: 403 });
    }

    const userProfile = userProfileSnap.data() as UserProfile;
    const ttsEnabled = userProfile?.tts_enabled || false;

    if (!ttsEnabled) {
      return NextResponse.json(
        { error: "Text-to-speech is not enabled for this user" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const voiceId =
      body.voiceId || userProfile?.voice_id || DEFAULT_VOICE_ID;

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
      const errorData = await response.json().catch(() => ({}));
      console.error("ElevenLabs API error:", response.status, errorData);
      return NextResponse.json(
        { error: "Failed to generate speech", details: errorData },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
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
