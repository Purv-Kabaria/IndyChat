import { NextRequest, NextResponse } from 'next/server';

// Dify API configuration
const DIFY_API_KEY = process.env.DIFY_API_KEY;
const DIFY_UPLOAD_API_URL = "https://api.dify.ai/v1/files/upload";

type UploadError = {
  message: string;
  code?: number;
  details?: string;
};

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const user = formData.get('user') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // File size validation (15MB limit)
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 15MB limit' }, { status: 400 });
    }

    // Create new FormData to forward to Dify
    const difyFormData = new FormData();
    difyFormData.append('file', file);
    difyFormData.append('user', user);

    console.log(`API Upload Route: Uploading file "${file.name}" (${file.size} bytes) for user ${user}`);

    const uploadResponse = await fetch(DIFY_UPLOAD_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_API_KEY}`,
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
      console.error("API Upload Route: Dify upload failed:", uploadResponse.status, errorData);
      return NextResponse.json(
        { error: `File upload failed with status ${uploadResponse.status}`, details: errorData },
        { status: uploadResponse.status }
      );
    }

    const resultData = await uploadResponse.json();
    console.log("API Upload Route: File uploaded successfully:", resultData.id);
    
    return NextResponse.json(resultData);
  } catch (error: unknown) {
    const uploadError: UploadError = {
      message: error instanceof Error ? error.message : String(error),
      code: 500,
      details: error instanceof Error ? error.stack : undefined
    };

    console.error("API Upload Route: Internal server error:", uploadError.message);
    return NextResponse.json(
      { 
        error: 'File upload processing failed', 
        details: uploadError.message,
        code: uploadError.code
      },
      { status: uploadError.code }
    );
  }
} 
