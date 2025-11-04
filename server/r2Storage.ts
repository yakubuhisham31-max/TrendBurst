import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
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
        !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
      throw new Error("R2 credentials not configured. Please set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME environment variables.");
    }
  }

  /**
   * Extract the public domain from R2 endpoint
   * Converts https://xxx.r2.cloudflarestorage.com to public R2.dev domain
   */
  private getPublicDomain(): string {
    // For Cloudflare R2, the public URL pattern is:
    // https://<account-id>.r2.cloudflarestorage.com (API endpoint - private)
    // https://pub-<hash>.r2.dev/<bucket>/<key> (public R2.dev domain)
    // Or use a custom domain if configured
    
    // Extract account ID from endpoint
    const endpoint = process.env.R2_ENDPOINT!;
    const match = endpoint.match(/https:\/\/([^.]+)\.r2\.cloudflarestorage\.com/);
    
    if (match) {
      const accountId = match[1];
      // Use R2.dev public domain format
      return `https://pub-${accountId.substring(0, 16)}.r2.dev`;
    }
    
    // Fallback: use the endpoint as-is (will need manual configuration)
    return endpoint;
  }

  /**
   * Generate a presigned URL for uploading an object entity (posts, etc.)
   * Returns both the upload URL and the public URL for accessing the file
   */
  async getObjectEntityUploadURL(): Promise<{ uploadURL: string; publicURL: string }> {
    const objectId = randomUUID();
    const key = `uploads/${objectId}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const uploadURL = await getSignedUrl(r2Client, command, { expiresIn: 900 }); // 15 minutes
    
    // Construct public URL: use the presigned URL's base but with the object path
    // The presigned URL format is: https://<endpoint>/<bucket>/<key>?<signature>
    const publicURL = uploadURL.split('?')[0];

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

    const uploadURL = await getSignedUrl(r2Client, command, { expiresIn: 900 }); // 15 minutes
    
    // Construct public URL: use the presigned URL's base but with the object path
    const publicURL = uploadURL.split('?')[0];

    return { uploadURL, publicURL };
  }

  /**
   * Get the public URL for an uploaded file
   */
  getPublicURL(key: string): string {
    return `${this.getPublicDomain()}/${BUCKET_NAME}/${key}`;
  }
}
