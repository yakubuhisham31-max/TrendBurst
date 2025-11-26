/**
 * Upload a file to Cloudflare R2 storage with parallel chunk uploads for large files
 * @param file - The file to upload
 * @param folder - The folder to upload to (e.g., 'posts', 'profile-pictures', 'trend-covers', 'reference-media')
 * @returns The public URL of the uploaded file
 */
export async function uploadToR2(file: File, folder: string): Promise<string> {
  // Get file extension
  const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
  
  // For small files (< 5MB), use simple upload
  if (file.size < 5242880) {
    return uploadSmpleFile(file, folder, fileExtension);
  }

  // For large files, use multipart upload with parallel chunks
  console.log(`📁 Starting multipart upload for ${(file.size / 1024 / 1024).toFixed(2)}MB file`);
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
  const CHUNK_SIZE = 2097152; // 2MB chunks for more parallelism
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  console.log(`📦 Splitting into ${totalChunks} chunks of ${(CHUNK_SIZE / 1024 / 1024).toFixed(1)}MB`);

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
  console.log(`⏳ Multipart upload initiated. Upload ID: ${uploadId}`);

  try {
    // Get all part URLs in one request
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
    console.log(`✅ Received presigned URLs for all ${totalChunks} parts`);

    // Upload chunks in parallel (8 concurrent uploads for better speed)
    const uploadedParts: Array<{ ETag: string; PartNumber: number }> = [];
    const concurrency = 8;
    let uploadedCount = 0;

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
          throw new Error(`Failed to upload part ${partNumber}: ${uploadResponse.statusText}`);
        }

        // Extract ETag - R2 returns it with quotes, remove them
        let etag = uploadResponse.headers.get("etag") || "";
        if (etag.startsWith('"') && etag.endsWith('"')) {
          etag = etag.slice(1, -1);
        }
        
        uploadedCount++;
        console.log(`📤 Part ${partNumber}/${totalChunks} uploaded (${uploadedCount}/${totalChunks})`);
        
        return { ETag: etag, PartNumber: partNumber };
      });

      const results = await Promise.all(uploadPromises);
      uploadedParts.push(...results);
    }

    console.log(`✅ All ${totalChunks} parts uploaded, completing multipart upload...`);

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

    console.log(`🎉 Upload complete! ${(file.size / 1024 / 1024).toFixed(2)}MB file successfully uploaded`);
    return publicURL;
  } catch (error) {
    console.error("❌ Multipart upload error:", error);
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
