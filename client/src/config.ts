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
 * Build a full API URL
 * @param path - API path (e.g., '/api/users')
 * @returns Full URL with base prepended
 */
export function buildApiUrl(path: string): string {
  // If no base URL or path already starts with http, return as-is
  if (!API_BASE_URL || path.startsWith('http')) {
    return path;
  }
  
  // Remove trailing slash from base and leading slash from path
  const base = API_BASE_URL.replace(/\/$/, '');
  const endpoint = path.startsWith('/') ? path : `/${path}`;
  
  return `${base}${endpoint}`;
}
