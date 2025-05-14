import { NextRequest, NextResponse } from 'next/server';

const DIFY_API_KEY = process.env.DIFY_API_KEY;
const DIFY_API_URL = "https://api.dify.ai/v1/chat-messages";

export const runtime = 'edge'; // Use edge runtime for streaming

export async function POST(req: NextRequest) {
  try {
    // Extract files array along with other data
    const { query, conversation_id, user: userIdFromRequest, files } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const headers = {
      'Authorization': `Bearer ${DIFY_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    };

    const userId = userIdFromRequest || "website-user-" + Date.now().toString().slice(-6);

    const requestBody: any = {
      inputs: {},
      query: query,
      response_mode: "streaming",
      user: userId,
    };

    // Add conversation_id if it exists
    if (conversation_id) {
      requestBody.conversation_id = conversation_id;
    }

    // Add files if they exist and the array is not empty
    if (files && Array.isArray(files) && files.length > 0) {
      // Validate file structure before adding
      const isValidFiles = files.every(file => 
        typeof file === 'object' && 
        file !== null &&
        typeof file.type === 'string' &&
        file.transfer_method === 'local_file' &&
        typeof file.upload_file_id === 'string'
      );

      if (!isValidFiles) {
        console.error("API Chat Route: Invalid file structure received from frontend:", JSON.stringify(files, null, 2));
        return NextResponse.json({ error: 'Invalid file structure provided' }, { status: 400 });
      }
      requestBody.files = files; // Pass the files array directly to Dify
    }

    console.log("API Chat Route: Sending to Dify with body:", JSON.stringify(requestBody, null, 2));

    const difyResponse = await fetch(DIFY_API_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    if (!difyResponse.ok) {
      const errorText = await difyResponse.text();
      let errorJson = {};
      try { errorJson = JSON.parse(errorText); } catch(e) {}
      console.error("API Chat Route: Dify API returned an error:", difyResponse.status, errorText);
      return new NextResponse(JSON.stringify({ error: `Dify API Error: ${difyResponse.status}`, details: errorJson || errorText }), {
        status: difyResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

     if (!difyResponse.body) {
        console.error("API Chat Route: Dify response body is null after OK status");
        return NextResponse.json({ error: "Dify response body is null" }, { status: 500 });
      }

    const responseStream = difyResponse.body;

    return new NextResponse(responseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error("API Chat Route: Caught Internal Server Error:", error);
    // Log the error stack if available
    const errorDetails = error.stack || error.message || String(error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error', details: errorDetails }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 