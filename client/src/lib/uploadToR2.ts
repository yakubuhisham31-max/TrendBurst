/**
 * Upload a file to Cloudflare R2 storage
 * @param file - The file to upload
 * @param folder - The folder to upload to (e.g., 'posts', 'profile-pictures', 'trend-covers', 'reference-media')
 * @returns The public URL of the uploaded file
 */
export async function uploadToR2(file: File, folder: string): Promise<string> {
  // Get file extension
  const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
  
  // Request presigned upload URL from backend
  const response = await fetch("/api/objects/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ folder, fileExtension }),
  });

  if (!response.ok) {
    throw new Error("Failed to get upload URL");
  }

  const { uploadURL, publicURL } = await response.json();

  // Upload file to R2 using presigned URL with AbortController for timeout
  const controller = new AbortController();
  const uploadTimeout = setTimeout(() => controller.abort(), 600000); // 10 minutes timeout for large videos

  try {
    const uploadResponse = await fetch(uploadURL, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
      signal: controller.signal,
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload file to R2");
    }

    return publicURL;
  } finally {
    clearTimeout(uploadTimeout);
  }
}

/**
 * Create a local preview URL for a file (object URL)
 * Remember to revoke this URL when done using URL.revokeObjectURL()
 */
export function createPreviewURL(file: File): string {
  return URL.createObjectURL(file);
}
