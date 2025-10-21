// API Configuration
// This allows the frontend to work with different backend URLs
// depending on the deployment environment

/**
 * Get the API base URL based on environment
 * - Vercel: Uses VITE_API_URL environment variable (e.g., https://your-backend.onrender.com)
 * - Replit/Render: Uses empty string (same origin - relative URLs)
 * - Local: Uses empty string (same origin - relative URLs)
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Build a full API URL from a path or path segments
 * @param pathOrSegments - API path string or array of path segments
 * @returns Full URL with base prepended
 * 
 * Examples:
 * - buildApiUrl('/api/users') → '/api/users' (no base) or 'https://api.com/api/users' (with base)
 * - buildApiUrl(['/api/posts', 123]) → '/api/posts/123' (segments joined)
 */
export function buildApiUrl(pathOrSegments: string | (string | number)[]): string {
  // Convert segments array to path string
  let path: string;
  if (Array.isArray(pathOrSegments)) {
    // Filter out any non-string/non-number values and join with /
    path = pathOrSegments
      .filter(segment => typeof segment === 'string' || typeof segment === 'number')
      .join('/');
  } else {
    path = pathOrSegments;
  }
  
  // If no base URL or path already starts with http, return as-is
  if (!API_BASE_URL || path.startsWith('http')) {
    return path;
  }
  
  // Remove trailing slash from base and ensure path starts with /
  const base = API_BASE_URL.replace(/\/$/, '');
  const endpoint = path.startsWith('/') ? path : `/${path}`;
  
  return `${base}${endpoint}`;
}
