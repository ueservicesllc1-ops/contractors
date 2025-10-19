import { v4 as uuidv4 } from 'uuid';

// Backblaze B2 Configuration
const B2_CONFIG = {
  keyId: '005c2b526be0baa000000001b',
  applicationKey: 'K005yNAO1B3iTmVzCbpNHg4mvChvDX4',
  bucketId: '5c62fbd582c6fb7e909b0a1a',
  bucketName: 'contractors',
  endpoint: 's3.us-east-005.backblazeb2.com'
};

// Client-side file upload using signed URLs
export const uploadFile = async (file: File, folder: string = 'uploads'): Promise<string> => {
  const fileName = `${folder}/${uuidv4()}-${file.name}`;
  
  try {
    // First, get a signed URL from our API
    const response = await fetch('/api/upload/signed-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName,
        contentType: file.type,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get signed URL');
    }

    const { signedUrl, publicUrl } = await response.json();

    // Upload file directly to B2 using signed URL
    const uploadResponse = await fetch(signedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file');
    }

    return publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export const deleteFile = async (fileName: string): Promise<void> => {
  try {
    const response = await fetch('/api/upload/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileName }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// Helper function to get file URL
export const getFileUrl = (fileName: string): string => {
  return `https://f000.backblazeb2.com/file/${B2_CONFIG.bucketName}/${fileName}`;
};

export default B2_CONFIG;
