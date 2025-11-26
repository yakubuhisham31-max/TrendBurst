/**
 * Upload a file to Cloudflare R2 storage with parallel chunk uploads for large files
 * @param file - The file to upload
 * @param folder - The folder to upload to (e.g., 'posts', 'profile-pictures', 'trend-covers', 'reference-media')
 * @returns The public URL of the uploaded file
 */
export async function uploadToR2(file: File, folder: string): Promise<string> {
  // Get file extension
  const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
  
  // For small files (< 10MB), use simple upload
  if (file.size < 10485760) {
    return uploadSmpleFile(file, folder, fileExtension);
  }

  // For large files, use multipart upload with parallel chunks
  return uploadMultipart(file, folder, fileExtension);
}

async function uploadSmpleFile(file: File, folder: string, fileExtension: string): Promise<string> {
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

  // Upload file to R2 using presigned URL
  const controller = new AbortController();
  const uploadTimeout = setTimeout(() => controller.abort(), 600000); // 10 minutes timeout

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

async function uploadMultipart(file: File, folder: string, fileExtension: string): Promise<string> {
  const CHUNK_SIZE = 5242880; // 5MB chunks
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  // Initiate multipart upload
  const initResponse = await fetch("/api/objects/upload/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ folder, fileExtension, totalChunks }),
  });

  if (!initResponse.ok) {
    throw new Error("Failed to initiate multipart upload");
  }

  const { uploadId, key, publicURL } = await initResponse.json();

  try {
    // Get all part URLs
    const partNumbers = Array.from({ length: totalChunks }, (_, i) => i + 1);
    const partUrlsResponse = await fetch("/api/objects/upload/part-urls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ key, uploadId, partNumbers }),
    });

    if (!partUrlsResponse.ok) {
      throw new Error("Failed to get part URLs");
    }

    const { partUrls } = await partUrlsResponse.json();

    // Upload chunks in parallel (4 concurrent uploads)
    const uploadedParts: Array<{ ETag: string; PartNumber: number }> = [];
    const concurrency = 4;

    for (let i = 0; i < totalChunks; i += concurrency) {
      const batch = partNumbers.slice(i, i + concurrency);
      
      const uploadPromises = batch.map(async (partNumber) => {
        const start = (partNumber - 1) * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const uploadResponse = await fetch(partUrls[partNumber], {
          method: "PUT",
          body: chunk,
          headers: { "Content-Type": file.type },
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload part ${partNumber}`);
        }

        const etag = uploadResponse.headers.get("etag")?.replace(/"/g, "") || "";
        return { ETag: etag, PartNumber: partNumber };
      });

      const results = await Promise.all(uploadPromises);
      uploadedParts.push(...results);
    }

    // Complete multipart upload
    const completeResponse = await fetch("/api/objects/upload/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ key, uploadId, parts: uploadedParts.sort((a, b) => a.PartNumber - b.PartNumber) }),
    });

    if (!completeResponse.ok) {
      throw new Error("Failed to complete multipart upload");
    }

    return publicURL;
  } catch (error) {
    console.error("Multipart upload error:", error);
    throw error;
  }
}

/**
 * Create a local preview URL for a file (object URL)
 * Remember to revoke this URL when done using URL.revokeObjectURL()
 */
export function createPreviewURL(file: File): string {
  return URL.createObjectURL(file);
}
