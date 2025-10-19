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

export async function DELETE(request: NextRequest) {
  try {
    const { fileName } = await request.json();

    if (!fileName) {
      return NextResponse.json(
        { error: 'fileName is required' },
        { status: 400 }
      );
    }

    // Delete file from B2
    await s3.deleteObject({
      Bucket: BUCKET_NAME,
      Key: fileName,
    }).promise();

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
