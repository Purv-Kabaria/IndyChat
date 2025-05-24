import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/app/api/auth/firebase-admin";
import { DEFAULT_VOICE_ID } from "@/functions/ttsUtils";

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "ElevenLabs API key not configured" },
        { status: 500 }
      );
    }

    const authorizationHeader = request.headers.get("Authorization");
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
    }
    const idToken = authorizationHeader.split("Bearer ")[1];

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (tokenError) {
      console.error("Token verification error:", tokenError);
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    const uid = decodedToken.uid;
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized: UID not found in token" }, { status: 401 });
    }

    const userDocRef = adminDb.collection("users").doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      console.error("User not found in Firestore:", uid);
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    if (!userData) {
        return NextResponse.json({ error: "User data is empty" }, { status: 404 });
    }

    const ttsEnabled = userData.tts_enabled === true;
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
      body.voiceId || userData.voice_id || DEFAULT_VOICE_ID;

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
      console.error("ElevenLabs API error:", errorData);
      return NextResponse.json(
        { error: "Failed to generate speech" },
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
