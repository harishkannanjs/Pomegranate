import type { StoredHighlight } from './types';

/**
 * Selectors for elements that must never be highlighted or included in selection.
 */
export const EXCLUDED_SELECTORS = [
  'pre',
  '.expressive-code',
  '.astro-code',
  '.mermaid',
  'svg',
  '.asciinema-player',
  'asciinema-player',
  '.katex',
  'button',
  '.part-listen-btn',
  '.speech-skip-btn',
  '.heading-anchor',
  '#text-magnifier-loupe',
  '#highlighter-floating-bar',
  '#highlighter-panel',
  '#reader-mode-floating-bar',
  '.spoiler.is-hidden',
  '[aria-hidden="true"]',
];

/**
 * Checks if an element or any of its ancestors is an excluded element.
 */
export function isExcludedElement(el: Element | null): boolean {
  if (!el) return false;
  for (const selector of EXCLUDED_SELECTORS) {
    if (el.matches && el.matches(selector)) return true;
    if (el.closest && el.closest(selector)) return true;
  }
  return false;
}

export interface IndexedTextNode {
  node: Text;
  start: number;
  end: number;
}

export interface TextIndex {
  textNodes: IndexedTextNode[];
  fullText: string;
}

/**
 * Traverses prose container and builds a contiguous character offset index
 * of all eligible text nodes, skipping excluded elements.
 */
export function buildTextIndex(container: Element): TextIndex {
  const doc = container?.ownerDocument || (typeof document !== 'undefined' ? document : null);
  if (!doc) {
    return { textNodes: [], fullText: '' };
  }

  const textNodes: IndexedTextNode[] = [];
  let fullText = '';

  const NF = typeof NodeFilter !== 'undefined' ? NodeFilter : {
    SHOW_TEXT: 4,
    FILTER_ACCEPT: 1,
    FILTER_REJECT: 2,
  };

  const walker = doc.createTreeWalker(
    container,
    NF.SHOW_TEXT,
    {
      acceptNode(node: Node) {
        const parent = node.parentElement;
        if (!parent) return NF.FILTER_REJECT;
        if (isExcludedElement(parent)) return NF.FILTER_REJECT;
        if (!node.nodeValue || node.nodeValue.length === 0) return NF.FILTER_REJECT;
        return NF.FILTER_ACCEPT;
      },
    }
  );

  let current: Node | null = walker.nextNode();
  while (current) {
    const textNode = current as Text;
    const value = textNode.nodeValue || '';
    const start = fullText.length;
    const end = start + value.length;

    textNodes.push({
      node: textNode,
      start,
      end,
    });

    fullText += value;
    current = walker.nextNode();
  }

  return { textNodes, fullText };
}

export interface AnchorMatch {
  start: number;
  end: number;
  matchType: 'exact_context' | 'single_text_fallback';
}

/**
 * Determines text offsets for a stored highlight per SPEC.md re-anchoring rules:
 * 1. Search for contextBefore + text + contextAfter
 * 2. Fall back to text alone ONLY if there is exactly one match in fullText
 * 3. Otherwise drop silently (return null)
 */
export function findHighlightOffsets(
  fullText: string,
  highlight: Pick<StoredHighlight, 'text' | 'contextBefore' | 'contextAfter'>
): AnchorMatch | null {
  const { text, contextBefore, contextAfter } = highlight;
  if (!text || text.length === 0) return null;

  // 1. Exact context match: contextBefore + text + contextAfter
  if (contextBefore || contextAfter) {
    const fullQuery = contextBefore + text + contextAfter;
    const exactIdx = fullText.indexOf(fullQuery);
    if (exactIdx !== -1) {
      const start = exactIdx + contextBefore.length;
      return {
        start,
        end: start + text.length,
        matchType: 'exact_context',
      };
    }
  }

  // 2. Fall back to text alone: search all occurrences of text
  const occurrences: number[] = [];
  let pos = 0;
  while (pos < fullText.length) {
    const idx = fullText.indexOf(text, pos);
    if (idx === -1) break;
    occurrences.push(idx);
    pos = idx + 1;
  }

  // Anchor ONLY if there is exactly one match; with multiple matches it is ambiguous
  if (occurrences.length === 1) {
    const start = occurrences[0];
    return {
      start,
      end: start + text.length,
      matchType: 'single_text_fallback',
    };
  }

  // 3. Not found or ambiguous (>1) -> drop silently
  return null;
}

/**
 * Wraps text range spanning one or more text nodes in <mark class="pomegranate-highlight">.
 * Never uses Range.surroundContents (which throws across element boundaries).
 */
export function wrapOffsetsWithMark(
  textNodes: IndexedTextNode[],
  start: number,
  end: number,
  highlight: Pick<StoredHighlight, 'id' | 'text'>
): HTMLElement[] {
  const marks: HTMLElement[] = [];

  // Find all text nodes that overlap [start, end]
  const overlapping = textNodes.filter((tn) => tn.end > start && tn.start < end);

  for (const item of overlapping) {
    const localStart = Math.max(0, start - item.start);
    const localEnd = Math.min(item.node.length, end - item.start);
    const lengthToHighlight = localEnd - localStart;

    if (lengthToHighlight <= 0) continue;

    let targetNode = item.node;

    // Split at start of highlight if not at start of node
    if (localStart > 0) {
      targetNode = targetNode.splitText(localStart);
    }

    // Split at end of highlight if targetNode is longer than highlight slice
    if (targetNode.length > lengthToHighlight) {
      targetNode.splitText(lengthToHighlight);
    }

    // Wrap targetNode in <mark>
    const parent = targetNode.parentNode;
    if (parent) {
      const doc = parent.ownerDocument || (typeof document !== 'undefined' ? document : null);
      if (!doc) continue;
      const mark = doc.createElement('mark');
      mark.className = 'pomegranate-highlight';
      mark.setAttribute('data-highlight-id', highlight.id);
      mark.setAttribute('tabindex', '0');
      mark.setAttribute('role', 'mark');
      mark.setAttribute('aria-label', `Highlight: ${highlight.text}`);

      parent.replaceChild(mark, targetNode);
      mark.appendChild(targetNode);
      marks.push(mark as HTMLElement);
    }
  }

  return marks;
}

/**
 * Anchors a single highlight onto the container.
 * Returns the created <mark> elements, or empty array if dropped.
 */
export function anchorHighlight(container: Element, highlight: StoredHighlight): HTMLElement[] {
  const index = buildTextIndex(container);
  const match = findHighlightOffsets(index.fullText, highlight);
  if (!match) {
    return [];
  }

  return wrapOffsetsWithMark(index.textNodes, match.start, match.end, highlight);
}

/**
 * Unwraps all rendered <mark class="pomegranate-highlight"> elements and normalizes text nodes.
 */
export function clearRenderedHighlights(container: Element): void {
  const marks = Array.from(container.querySelectorAll('mark.pomegranate-highlight'));
  for (const mark of marks) {
    const parent = mark.parentNode;
    if (!parent) continue;
    while (mark.firstChild) {
      parent.insertBefore(mark.firstChild, mark);
    }
    parent.removeChild(mark);
  }
  container.normalize();
}

/**
 * Unwraps rendered marks for a specific highlight ID.
 */
export function removeRenderedHighlight(container: Element, id: string): void {
  const marks = Array.from(container.querySelectorAll(`mark.pomegranate-highlight[data-highlight-id="${id}"]`));
  for (const mark of marks) {
    const parent = mark.parentNode;
    if (!parent) continue;
    while (mark.firstChild) {
      parent.insertBefore(mark.firstChild, mark);
    }
    parent.removeChild(mark);
  }
  container.normalize();
}

/**
 * Re-anchors all stored highlights for the container.
 * Cleans any existing rendered highlights first for idempotence.
 */
export function reanchorAllHighlights(
  container: Element,
  highlights: StoredHighlight[]
): { anchoredCount: number; droppedCount: number; marks: HTMLElement[] } {
  clearRenderedHighlights(container);

  let anchoredCount = 0;
  let droppedCount = 0;
  const allMarks: HTMLElement[] = [];

  for (const highlight of highlights) {
    const marks = anchorHighlight(container, highlight);
    if (marks.length > 0) {
      anchoredCount++;
      allMarks.push(...marks);
    } else {
      droppedCount++;
    }
  }

  return { anchoredCount, droppedCount, marks: allMarks };
}

/**
 * Resolves a (node, offset) DOM boundary point to an exact character offset in index.fullText.
 * Handles both Text nodes and Element nodes (child boundaries) without searching from index 0.
 */
export function resolvePointToCharOffset(
  pointNode: Node,
  pointOffset: number,
  index: TextIndex,
  isStart: boolean
): number {
  // If pointNode is directly one of our indexed text nodes
  for (const item of index.textNodes) {
    if (item.node === pointNode) {
      return item.start + Math.min(item.node.length, Math.max(0, pointOffset));
    }
  }

  // If pointNode is an Element or container (offset refers to child index)
  if (pointNode.nodeType === 1 || 'childNodes' in pointNode) {
    const children = pointNode.childNodes;
    if (isStart) {
      if (pointOffset < children.length) {
        const nextChild = children[pointOffset];
        for (const item of index.textNodes) {
          if (nextChild === item.node || (nextChild.contains && nextChild.contains(item.node))) {
            return item.start;
          }
          if (
            nextChild.compareDocumentPosition &&
            nextChild.compareDocumentPosition(item.node) & 4 /* Node.DOCUMENT_POSITION_FOLLOWING */
          ) {
            return item.start;
          }
        }
      } else if (children.length > 0) {
        const lastChild = children[children.length - 1];
        for (let i = index.textNodes.length - 1; i >= 0; i--) {
          const item = index.textNodes[i];
          if (lastChild === item.node || (lastChild.contains && lastChild.contains(item.node))) {
            return item.end;
          }
        }
      }
    } else {
      if (pointOffset > 0 && pointOffset <= children.length) {
        const prevChild = children[pointOffset - 1];
        for (let i = index.textNodes.length - 1; i >= 0; i--) {
          const item = index.textNodes[i];
          if (prevChild === item.node || (prevChild.contains && prevChild.contains(item.node))) {
            return item.end;
          }
          if (
            prevChild.compareDocumentPosition &&
            prevChild.compareDocumentPosition(item.node) & 2 /* Node.DOCUMENT_POSITION_PRECEDING */
          ) {
            return item.end;
          }
        }
      } else if (children.length > 0) {
        const firstChild = children[0];
        for (const item of index.textNodes) {
          if (firstChild === item.node || (firstChild.contains && firstChild.contains(item.node))) {
            return item.start;
          }
        }
      }
    }
  }

  return -1;
}

const RANGE_START_TO_END = typeof Range !== 'undefined' && Range.START_TO_END !== undefined ? Range.START_TO_END : 1;
const RANGE_END_TO_START = typeof Range !== 'undefined' && Range.END_TO_START !== undefined ? Range.END_TO_START : 3;

/**
 * Safely checks if a Range intersects a DOM Node, even in environments without Range.prototype.intersectsNode.
 */
export function rangeIntersectsNode(range: Range, node: Node): boolean {
  if (typeof range.intersectsNode === 'function') {
    return range.intersectsNode(node);
  }
  const doc = node.ownerDocument || (node as unknown as { document?: Document }).document;
  if (!doc || typeof doc.createRange !== 'function') {
    return false;
  }
  try {
    const nodeRange = doc.createRange();
    nodeRange.selectNode(node);
    return (
      range.compareBoundaryPoints(RANGE_END_TO_START, nodeRange) < 0 &&
      range.compareBoundaryPoints(RANGE_START_TO_END, nodeRange) > 0
    );
  } catch {
    return false;
  }
}

/**
 * Extracts context (~40 chars before and after) from an active user selection.
 * Validates that the selection is non-empty, does not intersect excluded elements,
 * and adjusts context to match trimmed selection boundaries.
 */
export function extractSelectionContext(
  container: Element,
  selection: Selection
): { text: string; contextBefore: string; contextAfter: string } | null {
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }

  const rawSelectionText = selection.toString();
  if (rawSelectionText.trim().length === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);

  // Validate containment inside container
  if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) {
    return null;
  }

  // Validate start and end element parents
  const startEl =
    range.startContainer instanceof Element ? range.startContainer : range.startContainer.parentElement;
  const endEl =
    range.endContainer instanceof Element ? range.endContainer : range.endContainer.parentElement;

  if (isExcludedElement(startEl) || isExcludedElement(endEl)) {
    return null;
  }

  // Verify that the selection does not cross or intersect any excluded elements
  for (const selector of EXCLUDED_SELECTORS) {
    const excludedList = container.querySelectorAll(selector);
    for (let i = 0; i < excludedList.length; i++) {
      const excluded = excludedList[i];
      if (rangeIntersectsNode(range, excluded)) {
        return null;
      }
    }
  }

  // Build text index
  const index = buildTextIndex(container);
  if (index.textNodes.length === 0 || index.fullText.length === 0) {
    return null;
  }

  // Resolve start and end offsets accurately using resolvePointToCharOffset
  const matchStart = resolvePointToCharOffset(range.startContainer, range.startOffset, index, true);
  const matchEnd = resolvePointToCharOffset(range.endContainer, range.endOffset, index, false);

  if (matchStart === -1 || matchEnd === -1 || matchStart >= matchEnd) {
    return null;
  }

  // Trim whitespace and adjust offsets so context ends/starts immediately adjacent to trimmed text
  const selectedSlice = index.fullText.slice(matchStart, matchEnd);
  const leadingWsMatch = selectedSlice.match(/^\s*/);
  const leadingWs = leadingWsMatch ? leadingWsMatch[0].length : 0;
  const trailingWsMatch = selectedSlice.match(/\s*$/);
  const trailingWs = trailingWsMatch ? trailingWsMatch[0].length : 0;

  const trimmedStart = matchStart + leadingWs;
  const trimmedEnd = Math.max(trimmedStart, matchEnd - trailingWs);

  const text = index.fullText.slice(trimmedStart, trimmedEnd);
  if (!text || text.length === 0) {
    return null;
  }

  const contextBefore = index.fullText.slice(Math.max(0, trimmedStart - 40), trimmedStart);
  const contextAfter = index.fullText.slice(trimmedEnd, Math.min(index.fullText.length, trimmedEnd + 40));

  return {
    text,
    contextBefore,
    contextAfter,
  };
}
