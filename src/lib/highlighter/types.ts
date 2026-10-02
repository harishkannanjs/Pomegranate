/**
 * Core type definitions for the Pomegranate visitor-side Highlighter.
 * Persisted in browser localStorage only (keyed per post slug).
 */

export interface StoredHighlight {
  id: string;
  text: string;
  contextBefore: string;
  contextAfter: string;
  color: 'default' | string;
  createdAt: string;
}

export interface HighlightExportData {
  postTitle: string;
  postUrl: string;
  exportedAt: string;
  highlights: StoredHighlight[];
}

export interface StorageOperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  quotaExceeded?: boolean;
}
