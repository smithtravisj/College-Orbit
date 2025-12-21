/**
 * Extracts plain text from TipTap JSON content format
 * Used for search indexing and plain text fallback
 */
export function extractPlainText(content: any): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (!content.content) return '';

  let plainText = '';

  const traverse = (nodes: any[]): void => {
    if (!Array.isArray(nodes)) return;

    for (const node of nodes) {
      // Extract text from text nodes
      if (node.text) {
        plainText += node.text;
      }

      // Handle line breaks
      if (node.type === 'hardBreak' || node.type === 'paragraph') {
        plainText += '\n';
      }

      // Recursively process child nodes
      if (node.content && Array.isArray(node.content)) {
        traverse(node.content);
      }
    }
  };

  traverse(content.content);

  // Clean up excessive whitespace while preserving structure
  return plainText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n')
    .trim();
}

/**
 * Serializes content to JSON string for storage
 */
export function serializeContent(content: any): string {
  return JSON.stringify(content);
}

/**
 * Deserializes content from JSON string
 */
export function deserializeContent(content: string | any): any {
  if (typeof content === 'string') {
    try {
      return JSON.parse(content);
    } catch {
      return {};
    }
  }
  return content || {};
}
