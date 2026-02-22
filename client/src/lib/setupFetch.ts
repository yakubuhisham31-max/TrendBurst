// Global fetch wrapper to ensure credentials are included for API/object/uploads requests
// and to surface 401/403 errors as thrown exceptions with response body.

const originalFetch = window.fetch.bind(window);

window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  let url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : (input as Request).url);
  // Normalize init
  init = init || {};

  try {
    // Only modify relative same-origin requests that target our backend paths
    if (url.startsWith('/')) {
      if (url.startsWith('/api') || url.startsWith('/objects') || url.startsWith('/uploads')) {
        if (!('credentials' in init)) {
          init.credentials = 'include';
        }
      }
    }

    const res = await originalFetch(input as any, init);

    if (res.status === 401 || res.status === 403) {
      // Try to read response body for better error message
      let bodyText: string | null = null;
      try {
        bodyText = await res.text();
      } catch (e) {
        /* ignore */
      }
      const error = new Error(bodyText || res.statusText || `HTTP ${res.status}`);
      (error as any).status = res.status;
      throw error;
    }

    return res;
  } catch (err) {
    // Re-throw so callers can handle
    throw err;
  }
};
