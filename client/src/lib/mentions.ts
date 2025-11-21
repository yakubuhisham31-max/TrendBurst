// Parse mentions from text and return JSX components
export function parseMentions(text: string) {
  // Match @username (alphanumeric and underscore)
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const parts: (string | { type: "mention"; username: string })[] = [];
  let lastIndex = 0;

  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    // Add mention
    parts.push({
      type: "mention",
      username: match[1],
    });
    lastIndex = mentionRegex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

// Extract all mentioned usernames from text
export function extractMentions(text: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  
  return [...new Set(mentions)]; // Remove duplicates
}
