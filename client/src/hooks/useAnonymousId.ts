import { useEffect, useState } from "react";

const ANONYMOUS_ID_KEY = "trendx_anonymous_id";

export function useAnonymousId(): string | null {
  const [anonymousId, setAnonymousId] = useState<string | null>(null);

  useEffect(() => {
    // Try to get existing anonymous ID
    let id = localStorage.getItem(ANONYMOUS_ID_KEY);
    
    // If doesn't exist, create new UUID
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ANONYMOUS_ID_KEY, id);
    }
    
    setAnonymousId(id);
  }, []);

  return anonymousId;
}

export function getAnonymousId(): string {
  let id = localStorage.getItem(ANONYMOUS_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ANONYMOUS_ID_KEY, id);
  }
  return id;
}
