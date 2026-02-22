/**
 * Upload a file to Cloudflare R2 storage with parallel chunk uploads for large files
 * @param file - The file to upload
 * @param folder - The folder to upload to (e.g., 'posts', 'profile-pictures', 'trend-covers', 'reference-media')
 * @param onProgress - Optional callback to track upload progress (0-100)
 * @returns The public URL of the uploaded file
 */
export async function uploadToR2(file: File, folder: string, onProgress?: (progress: number) => void): Promise<string> {
  // Get file extension
  const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
  
  // For small files (< 5MB), use simple upload
  if (file.size < 5242880) {
    return uploadSimpleFile(file, folder, fileExtension, onProgress);
  }

  // For large files, use multipart upload with parallel chunks
  console.log(`📁 Starting multipart upload for ${(file.size / 1024 / 1024).toFixed(2)}MB file`);
  return uploadMultipart(file, folder, fileExtension, onProgress);
}

async function uploadSimpleFile(file: File, folder: string, fileExtension: string, onProgress?: (progress: number) => void): Promise<string> {
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
  onProgress?.(10); // Initial progress after getting URL

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

    onProgress?.(100); // Complete
    return publicURL;
  } finally {
    clearTimeout(uploadTimeout);
  }
}

async function uploadMultipart(file: File, folder: string, fileExtension: string, onProgress?: (progress: number) => void): Promise<string> {
  const CHUNK_SIZE = 5242880; // 5MB chunks - R2 requires minimum 5MB per part for multipart uploads
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
  onProgress?.(5); // 5% after initiating

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
    onProgress?.(10); // 10% after getting URLs

    // Upload chunks in parallel (8 concurrent uploads for better speed)
    const uploadedParts: Array<{ ETag: string; PartNumber: number }> = [];
    const concurrency = 8;
    let uploadedCount = 0;

    console.log(`🔍 DEBUG: partUrls keys:`, Object.keys(partUrls));
    console.log(`🔍 DEBUG: partUrls sample:`, Object.entries(partUrls).slice(0, 2));

    for (let i = 0; i < totalChunks; i += concurrency) {
      const batch = partNumbers.slice(i, i + concurrency);
      
      const uploadPromises = batch.map(async (partNumber) => {
        const start = (partNumber - 1) * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const partUrl = partUrls[partNumber];
        console.log(`📝 Part ${partNumber}: URL exists?`, !!partUrl, `Chunk size: ${(chunk.size / 1024 / 1024).toFixed(2)}MB`);

        if (!partUrl) {
          throw new Error(`No presigned URL for part ${partNumber}`);
        }

        try {
          const uploadResponse = await fetch(partUrl, {
            method: "PUT",
            body: chunk,
            headers: { "Content-Type": file.type },
          });

          console.log(`📤 Part ${partNumber} response status: ${uploadResponse.status} ${uploadResponse.statusText}`);

          if (!uploadResponse.ok) {
            const responseText = await uploadResponse.text();
            throw new Error(`Part ${partNumber} failed: ${uploadResponse.status} ${uploadResponse.statusText} - ${responseText}`);
          }

          // Extract ETag - R2 returns it with quotes, remove them
          let etag = uploadResponse.headers.get("etag") || "";
          if (etag.startsWith('"') && etag.endsWith('"')) {
            etag = etag.slice(1, -1);
          }
          
          uploadedCount++;
          // Calculate progress: 10-90% for actual upload, 90-100% for completion
          const uploadProgress = 10 + (uploadedCount / totalChunks) * 80;
          onProgress?.(Math.round(uploadProgress));
          console.log(`✅ Part ${partNumber}/${totalChunks} uploaded (${uploadedCount}/${totalChunks}), ETag: ${etag}`);
          
          return { ETag: etag, PartNumber: partNumber };
        } catch (err) {
          console.error(`❌ Error uploading part ${partNumber}:`, err);
          throw err;
        }
      });

      const results = await Promise.all(uploadPromises);
      uploadedParts.push(...results);
    }

    console.log(`✅ All ${totalChunks} parts uploaded, completing multipart upload...`);
    console.log(`📋 Parts to send:`, JSON.stringify(uploadedParts.sort((a, b) => a.PartNumber - b.PartNumber), null, 2));
    onProgress?.(90); // 90% before completing

    // Complete multipart upload
    const sortedParts = uploadedParts.sort((a, b) => a.PartNumber - b.PartNumber);
    const completeResponse = await fetch("/api/objects/upload/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ key, uploadId, parts: sortedParts }),
    });

    if (!completeResponse.ok) {
      const errorBody = await completeResponse.text();
      console.error(`❌ Complete response not ok: ${completeResponse.status}`, errorBody);
      throw new Error(`Failed to complete multipart upload: ${completeResponse.status} - ${errorBody}`);
    }
    
    const completeResult = await completeResponse.json();
    console.log(`✅ Complete response:`, completeResult);

    onProgress?.(100); // 100% done
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
