import type { StoredHighlight, StorageOperationResult } from './types';

export const HIGHLIGHT_STORAGE_PREFIX = 'pomegranate:highlights:';
export const LEGACY_HIGHLIGHT_STORAGE_PREFIX = 'blogly:highlights:';
export const MAX_HIGHLIGHTS_PER_POST = 100;

/**
 * Returns the scoped localStorage key for a given post slug.
 * Cleans leading/trailing slashes for consistency.
 */
export function getStorageKey(postSlug: string): string {
  const cleanSlug = (postSlug || '').replace(/^\/+|\/+$/g, '');
  return `${HIGHLIGHT_STORAGE_PREFIX}${cleanSlug}`;
}

/**
 * Returns the legacy scoped localStorage key (blogly prefix) for backward compatibility migration.
 */
export function getLegacyStorageKey(postSlug: string): string {
  const cleanSlug = (postSlug || '').replace(/^\/+|\/+$/g, '');
  return `${LEGACY_HIGHLIGHT_STORAGE_PREFIX}${cleanSlug}`;
}

/**
 * Generates a RFC-compliant UUID or fallback pseudo-UUID.
 */
export function generateHighlightId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'hl-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
}

/**
 * Defensive schema validator for an individual highlight item.
 * Discards malformed, incomplete, or corrupted records.
 */
export function validateHighlight(item: unknown): StoredHighlight | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const obj = item as Record<string, unknown>;

  if (typeof obj.id !== 'string' || obj.id.trim().length === 0) {
    return null;
  }
  if (typeof obj.text !== 'string' || obj.text.trim().length === 0) {
    return null;
  }
  if (typeof obj.contextBefore !== 'string') {
    return null;
  }
  if (typeof obj.contextAfter !== 'string') {
    return null;
  }

  // Validate or normalize ISO-8601 creation date
  let createdAt = '';
  if (typeof obj.createdAt === 'string' && obj.createdAt.length > 0) {
    const parsed = Date.parse(obj.createdAt);
    if (!isNaN(parsed)) {
      createdAt = new Date(parsed).toISOString();
    }
  }
  if (!createdAt) {
    createdAt = new Date().toISOString();
  }

  const color = typeof obj.color === 'string' ? obj.color : 'default';

  return {
    id: obj.id.trim(),
    text: obj.text,
    contextBefore: obj.contextBefore,
    contextAfter: obj.contextAfter,
    color,
    createdAt,
  };
}

/**
 * Safely accesses localStorage without throwing on SecurityError (e.g. private browsing or disabled storage).
 */
export function getSafeLocalStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // SecurityError or restricted storage in private browsing
  }
  return null;
}

/**
 * Loads and validates all highlights stored for a given post.
 * Never throws — returns empty list if storage is disabled, empty, or corrupt.
 */
export function loadHighlights(postSlug: string): StoredHighlight[] {
  const storage = getSafeLocalStorage();
  if (!storage) {
    return [];
  }

  const key = getStorageKey(postSlug);
  const legacyKey = getLegacyStorageKey(postSlug);
  try {
    let raw = storage.getItem(key);
    let migrated = false;

    if (!raw) {
      const legacyRaw = storage.getItem(legacyKey);
      if (legacyRaw) {
        raw = legacyRaw;
        migrated = true;
      }
    }

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const validated: StoredHighlight[] = [];
    for (const item of parsed) {
      const valid = validateHighlight(item);
      if (valid) {
        validated.push(valid);
        if (validated.length >= MAX_HIGHLIGHTS_PER_POST) {
          break;
        }
      }
    }

    // Auto-migrate validated legacy highlights to current key and remove legacy key
    if (migrated && validated.length > 0) {
      try {
        storage.setItem(key, JSON.stringify(validated));
        storage.removeItem(legacyKey);
      } catch {
        // Silently ignore quota/write errors during auto-migration
      }
    }

    return validated;
  } catch {
    // Graceful degradation on disabled storage, invalid JSON, or SecurityError
    return [];
  }
}

/**
 * Persists an array of highlights to localStorage for a given post.
 * Handles quota exceeded and private browsing errors gracefully.
 */
export function saveHighlights(
  postSlug: string,
  highlights: StoredHighlight[]
): StorageOperationResult<StoredHighlight[]> {
  const storage = getSafeLocalStorage();
  if (!storage) {
    return {
      success: false,
      error: 'Local storage is not available or permitted in this environment.',
    };
  }

  const key = getStorageKey(postSlug);
  const capped = highlights.slice(0, MAX_HIGHLIGHTS_PER_POST);

  try {
    storage.setItem(key, JSON.stringify(capped));
    return {
      success: true,
      data: capped,
    };
  } catch (err: unknown) {
    const isQuota =
      err instanceof Error &&
      (err.name === 'QuotaExceededError' ||
        err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        (err as any).code === 22 ||
        (err as any).code === 1014);

    return {
      success: false,
      quotaExceeded: isQuota,
      error: isQuota
        ? 'Local storage quota exceeded. Unable to save additional highlights.'
        : 'Failed to access local storage. Highlights will not persist across reloads.',
    };
  }
}

/**
 * Adds a new highlight to a post's saved highlights.
 */
export function addHighlight(
  postSlug: string,
  highlightData: Omit<StoredHighlight, 'id' | 'createdAt' | 'color'> & {
    id?: string;
    createdAt?: string;
    color?: string;
  }
): StorageOperationResult<StoredHighlight> {
  const current = loadHighlights(postSlug);

  if (current.length >= MAX_HIGHLIGHTS_PER_POST) {
    return {
      success: false,
      error: `Maximum limit of ${MAX_HIGHLIGHTS_PER_POST} highlights reached for this post.`,
    };
  }

  const newHighlight: StoredHighlight = {
    id: highlightData.id || generateHighlightId(),
    text: highlightData.text,
    contextBefore: highlightData.contextBefore || '',
    contextAfter: highlightData.contextAfter || '',
    color: highlightData.color || 'default',
    createdAt: highlightData.createdAt || new Date().toISOString(),
  };

  const updated = [...current, newHighlight];
  const saveRes = saveHighlights(postSlug, updated);

  if (!saveRes.success) {
    return {
      success: false,
      error: saveRes.error,
      quotaExceeded: saveRes.quotaExceeded,
    };
  }

  return {
    success: true,
    data: newHighlight,
  };
}

/**
 * Removes an existing highlight by ID for a post.
 */
export function removeHighlight(
  postSlug: string,
  id: string
): StorageOperationResult<StoredHighlight[]> {
  const current = loadHighlights(postSlug);
  const updated = current.filter((h) => h.id !== id);

  if (updated.length === current.length) {
    return {
      success: true,
      data: current,
    };
  }

  const saveRes = saveHighlights(postSlug, updated);
  return {
    success: saveRes.success,
    data: updated,
    error: saveRes.error,
    quotaExceeded: saveRes.quotaExceeded,
  };
}

/**
 * Clears all highlights for a given post.
 */
export function clearHighlights(postSlug: string): StorageOperationResult {
  const storage = getSafeLocalStorage();
  if (!storage) {
    return {
      success: false,
      error: 'Local storage is not available or permitted in this environment.',
    };
  }

  const key = getStorageKey(postSlug);
  const legacyKey = getLegacyStorageKey(postSlug);
  try {
    storage.removeItem(key);
    storage.removeItem(legacyKey);
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to clear highlights',
    };
  }
}
