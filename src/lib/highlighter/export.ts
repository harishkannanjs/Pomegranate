import type { HighlightExportData } from './types';

/**
 * Escapes characters that have markdown semantics inside blockquotes or list items.
 */
export function escapeMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Generates a clean, readable Markdown export of user highlights for a post.
 */
export function generateHighlightsMarkdown(data: HighlightExportData): string {
  const { postTitle, postUrl, exportedAt, highlights } = data;

  const lines: string[] = [];
  lines.push(`# Highlights: ${escapeMarkdown(postTitle || 'Blog Post')}`);
  lines.push('');
  if (postUrl) {
    const safeUrl = encodeURI(postUrl).replace(/\(/g, '%28').replace(/\)/g, '%29');
    lines.push(`- **Source:** [${escapeMarkdown(postUrl)}](${safeUrl})`);
  }
  lines.push(`- **Exported:** ${exportedAt || new Date().toISOString()}`);
  lines.push(`- **Count:** ${highlights.length} highlight${highlights.length === 1 ? '' : 's'}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  if (highlights.length === 0) {
    lines.push('_No highlights recorded on this post._');
    lines.push('');
    return lines.join('\n');
  }

  highlights.forEach((h, index) => {
    lines.push(`### Highlight ${index + 1}`);
    // Multi-line quotes prefixed with >
    const quoteLines = h.text.split('\n').map((line) => `> ${escapeMarkdown(line)}`);
    lines.push(quoteLines.join('\n'));
    lines.push('');
    lines.push(`*Saved: ${new Date(h.createdAt).toLocaleString()}*`);
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Initiates an in-browser download of the generated Markdown file without network requests.
 */
export function triggerMarkdownDownload(filename: string, content: string): void {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return;

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 150);
}
