import { NextRequest, NextResponse } from 'next/server';
import AWS from 'aws-sdk';

// Configure AWS SDK for Backblaze B2
const s3 = new AWS.S3({
  endpoint: 'https://s3.us-east-005.backblazeb2.com',
  accessKeyId: '005c2b526be0baa000000001b',
  secretAccessKey: 'K005yNAO1B3iTmVzCbpNHg4mvChvDX4',
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
});

const BUCKET_NAME = 'contractors';

export async function POST(request: NextRequest) {
  try {
    const { fileName, contentType } = await request.json();

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: 'fileName and contentType are required' },
        { status: 400 }
      );
    }

    // Generate signed URL for upload
    const signedUrl = s3.getSignedUrl('putObject', {
      Bucket: BUCKET_NAME,
      Key: fileName,
      ContentType: contentType,
      Expires: 3600, // 1 hour
    });

    // Public URL for accessing the file
    const publicUrl = `https://f000.backblazeb2.com/file/${BUCKET_NAME}/${fileName}`;

    return NextResponse.json({
      signedUrl,
      publicUrl,
    });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate signed URL' },
      { status: 500 }
    );
  }
}
