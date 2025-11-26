import { S3Client, PutObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

// Initialize R2 client with Cloudflare credentials
const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;

export class R2StorageService {
  constructor() {
    if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || 
        !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME ||
        !process.env.R2_PUBLIC_DOMAIN) {
      throw new Error("R2 credentials not configured. Please set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_DOMAIN environment variables.");
    }
  }

  /**
   * Get the public domain for accessing uploaded files
   */
  private getPublicDomain(): string {
    return process.env.R2_PUBLIC_DOMAIN!;
  }

  /**
   * Generate a presigned URL for uploading an object entity (posts, etc.)
   * Returns both the upload URL and the public URL for accessing the file
   * @param folder - Optional folder name (e.g., 'posts', 'profile-pictures', 'trend-covers', 'reference-media')
   * @param fileExtension - Optional file extension (e.g., '.jpg', '.mp4')
   */
  async getObjectEntityUploadURL(folder: string = 'uploads', fileExtension: string = ''): Promise<{ uploadURL: string; publicURL: string }> {
    const objectId = randomUUID();
    const key = `${folder}/${objectId}${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const uploadURL = await getSignedUrl(r2Client, command, { expiresIn: 3600 }); // 60 minutes for large video uploads
    
    // Construct public URL using the R2_PUBLIC_DOMAIN
    const publicURL = `${this.getPublicDomain()}/${key}`;

    return { uploadURL, publicURL };
  }

  /**
   * Generate a presigned URL for uploading to a custom path
   * Used for trend covers, profile pictures, reference media, etc.
   */
  async getCustomUploadURL(path: string): Promise<{ uploadURL: string; publicURL: string }> {
    // Sanitize the path to prevent directory traversal
    const sanitizedPath = path.replace(/^\/+/, '').replace(/\.\.+/g, '');
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: sanitizedPath,
    });

    const uploadURL = await getSignedUrl(r2Client, command, { expiresIn: 3600 }); // 60 minutes for large video uploads
    
    // Construct public URL using the R2_PUBLIC_DOMAIN
    const publicURL = `${this.getPublicDomain()}/${sanitizedPath}`;

    return { uploadURL, publicURL };
  }

  /**
   * Get the public URL for an uploaded file
   */
  getPublicURL(key: string): string {
    return `${this.getPublicDomain()}/${key}`;
  }

  /**
   * Initiate a multipart upload for large files
   */
  async initiateMultipartUpload(folder: string = 'uploads', fileExtension: string = ''): Promise<{ uploadId: string; key: string; publicURL: string }> {
    const objectId = randomUUID();
    const key = `${folder}/${objectId}${fileExtension}`;

    const command = new CreateMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await r2Client.send(command);
    
    return {
      uploadId: response.UploadId!,
      key,
      publicURL: `${this.getPublicDomain()}/${key}`,
    };
  }

  /**
   * Get presigned URL for uploading a part in multipart upload
   */
  async getPartUploadURL(key: string, uploadId: string, partNumber: number): Promise<string> {
    const command = new UploadPartCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    });

    return await getSignedUrl(r2Client, command, { expiresIn: 3600 });
  }

  /**
   * Complete a multipart upload
   */
  async completeMultipartUpload(key: string, uploadId: string, parts: Array<{ ETag: string; PartNumber: number }>): Promise<void> {
    console.log(`🔍 [COMPLETE] Key: ${key}, UploadId: ${uploadId}`);
    console.log(`🔍 [COMPLETE] Parts count: ${parts.length}`);
    console.log(`🔍 [COMPLETE] Parts data:`, JSON.stringify(parts, null, 2));
    
    const command = new CompleteMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    });

    try {
      const response = await r2Client.send(command);
      console.log(`✅ [COMPLETE] Success! Response:`, JSON.stringify(response, null, 2));
    } catch (error) {
      console.error(`❌ [COMPLETE] Failed with error:`, error);
      if (error instanceof Error) {
        console.error(`   Error message: ${error.message}`);
        console.error(`   Error name: ${error.name}`);
      }
      throw error;
    }
  }
}
