import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const domino = require('@mixmark-io/domino');
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import HighlighterComponent from '../src/components/Highlighter.astro';
import {
  findHighlightOffsets,
  buildTextIndex,
  anchorHighlight,
  reanchorAllHighlights,
  clearRenderedHighlights,
  removeRenderedHighlight,
  isExcludedElement,
  resolvePointToCharOffset,
  rangeIntersectsNode,
} from '../src/lib/highlighter/anchor';
import {
  loadHighlights,
  saveHighlights,
  addHighlight,
  removeHighlight,
  clearHighlights,
  validateHighlight,
  getStorageKey,
  getLegacyStorageKey,
  getSafeLocalStorage,
  MAX_HIGHLIGHTS_PER_POST,
} from '../src/lib/highlighter/storage';
import { escapeMarkdown, generateHighlightsMarkdown } from '../src/lib/highlighter/export';
import type { StoredHighlight } from '../src/lib/highlighter/types';

describe('Phase 8: Highlighter Tests', () => {
  describe('Re-anchoring Algorithm (anchor.ts)', () => {
    it('anchors successfully with exact context match (contextBefore + text + contextAfter)', () => {
      const doc = domino.createDocument(
        '<section class="prose"><p>In this technical article, we analyze the kernel memory structure in depth and observe changes.</p></section>'
      );
      const container = doc.querySelector('.prose');

      const highlight: StoredHighlight = {
        id: 'h-1',
        text: 'kernel memory structure',
        contextBefore: 'we analyze the ',
        contextAfter: ' in depth and observe',
        color: 'default',
        createdAt: '2026-09-29T00:00:00.000Z',
      };

      const marks = anchorHighlight(container, highlight);
      expect(marks.length).toBe(1);
      expect(marks[0].tagName.toLowerCase()).toBe('mark');
      expect(marks[0].className).toContain('pomegranate-highlight');
      expect(marks[0].getAttribute('data-highlight-id')).toBe('h-1');
      expect(marks[0].textContent).toBe('kernel memory structure');
    });

    it('survives unrelated edits elsewhere in the post', () => {
      // Document where preceding paragraph was edited
      const doc = domino.createDocument(
        '<section class="prose"><p>Brand new introductory paragraph added in revision 2.</p><p>In this technical article, we analyze the kernel memory structure in depth and observe changes.</p></section>'
      );
      const container = doc.querySelector('.prose');

      const highlight: StoredHighlight = {
        id: 'h-unrelated',
        text: 'kernel memory structure',
        contextBefore: 'we analyze the ',
        contextAfter: ' in depth and observe',
        color: 'default',
        createdAt: '2026-09-29T00:00:00.000Z',
      };

      const marks = anchorHighlight(container, highlight);
      expect(marks.length).toBe(1);
      expect(marks[0].textContent).toBe('kernel memory structure');
    });

    it('falls back to text alone when exactly one match exists (nearby typo fixed)', () => {
      // Surrounding context was edited ("thoroughly review" instead of "analyze")
      const doc = domino.createDocument(
        '<section class="prose"><p>In this article, we thoroughly review the kernel memory structure in depth and observe changes.</p></section>'
      );
      const container = doc.querySelector('.prose');

      const highlight: StoredHighlight = {
        id: 'h-fallback',
        text: 'kernel memory structure',
        contextBefore: 'we analyze the ', // old context that no longer matches
        contextAfter: ' in depth and observe',
        color: 'default',
        createdAt: '2026-09-29T00:00:00.000Z',
      };

      const marks = anchorHighlight(container, highlight);
      // Because "kernel memory structure" appears exactly once, fallback succeeds
      expect(marks.length).toBe(1);
      expect(marks[0].textContent).toBe('kernel memory structure');
    });

    it('drops silently when text match is ambiguous (multiple occurrences with stale context)', () => {
      // Passage contains multiple occurrences of the same phrase
      const doc = domino.createDocument(
        '<section class="prose"><p>We inspect buffer overflow patterns. Later in the exploit, another buffer overflow occurs.</p></section>'
      );
      const container = doc.querySelector('.prose');

      const highlight: StoredHighlight = {
        id: 'h-ambiguous',
        text: 'buffer overflow',
        contextBefore: 'stale context before that does not exist',
        contextAfter: 'stale context after',
        color: 'default',
        createdAt: '2026-09-29T00:00:00.000Z',
      };

      const marks = anchorHighlight(container, highlight);
      // Multiple matches and no valid context -> must drop silently (never guess)
      expect(marks.length).toBe(0);
      expect(container.querySelectorAll('mark.pomegranate-highlight').length).toBe(0);
    });

    it('drops silently when highlighted passage was deleted from post', () => {
      const doc = domino.createDocument(
        '<section class="prose"><p>This paragraph was completely rewritten and the old explanation is gone.</p></section>'
      );
      const container = doc.querySelector('.prose');

      const highlight: StoredHighlight = {
        id: 'h-deleted',
        text: 'completely obsolete removed passage',
        contextBefore: 'some context',
        contextAfter: 'other context',
        color: 'default',
        createdAt: '2026-09-29T00:00:00.000Z',
      };

      const marks = anchorHighlight(container, highlight);
      expect(marks.length).toBe(0);
    });

    it('spans inline elements (bold, links, code) by wrapping per text-node segment without throwing', () => {
      const doc = domino.createDocument(
        '<section class="prose"><p>Important: <strong>security vulnerabilities</strong> in <a href="#">network protocols</a> must be patched.</p></section>'
      );
      const container = doc.querySelector('.prose');

      const highlight: StoredHighlight = {
        id: 'h-inline',
        text: 'security vulnerabilities in network protocols',
        contextBefore: 'Important: ',
        contextAfter: ' must be patched.',
        color: 'default',
        createdAt: '2026-09-29T00:00:00.000Z',
      };

      const marks = anchorHighlight(container, highlight);
      // Spans across <strong>, whitespace text node, and <a>
      expect(marks.length).toBeGreaterThanOrEqual(2);
      marks.forEach((m) => {
        expect(m.tagName.toLowerCase()).toBe('mark');
        expect(m.getAttribute('data-highlight-id')).toBe('h-inline');
      });

      // Total highlighted text should reconstruct the exact string
      const reconstructed = marks.map((m) => m.textContent).join('');
      expect(reconstructed).toBe('security vulnerabilities in network protocols');
    });

    it('excludes code blocks, Mermaid, Asciinema, and interactive buttons from indexing', () => {
      const doc = domino.createDocument(`
        <section class="prose">
          <p>Normal prose text here.</p>
          <pre><code class="language-c">int x = 42; // code block</code></pre>
          <div class="mermaid"><svg>graph TD</svg></div>
          <div class="asciinema-player">Asciinema content</div>
          <div class="katex">x^2 + y^2 = z^2</div>
          <button class="part-listen-btn">Listen</button>
        </section>
      `);
      const container = doc.querySelector('.prose');
      const index = buildTextIndex(container);

      expect(index.fullText).toContain('Normal prose text here.');
      expect(index.fullText).not.toContain('int x = 42');
      expect(index.fullText).not.toContain('graph TD');
      expect(index.fullText).not.toContain('Asciinema content');
      expect(index.fullText).not.toContain('x^2');
      expect(index.fullText).not.toContain('Listen');
    });

    it('provides idempotent reanchoring and clean highlight removal', () => {
      const doc = domino.createDocument(
        '<section class="prose"><p>Alpha beta gamma delta epsilon.</p></section>'
      );
      const container = doc.querySelector('.prose');

      const highlights: StoredHighlight[] = [
        {
          id: 'h-alpha',
          text: 'Alpha beta',
          contextBefore: '',
          contextAfter: ' gamma',
          color: 'default',
          createdAt: '2026-09-29T00:00:00.000Z',
        },
        {
          id: 'h-gamma',
          text: 'delta epsilon',
          contextBefore: 'gamma ',
          contextAfter: '.',
          color: 'default',
          createdAt: '2026-09-29T00:00:00.000Z',
        },
      ];

      // Reanchor first pass
      const res1 = reanchorAllHighlights(container, highlights);
      expect(res1.anchoredCount).toBe(2);
      expect(container.querySelectorAll('mark.pomegranate-highlight').length).toBe(2);

      // Reanchor second pass (must clean previous marks without duplicating)
      const res2 = reanchorAllHighlights(container, highlights);
      expect(res2.anchoredCount).toBe(2);
      expect(container.querySelectorAll('mark.pomegranate-highlight').length).toBe(2);

      // Remove single highlight
      removeRenderedHighlight(container, 'h-alpha');
      expect(container.querySelectorAll('mark.pomegranate-highlight').length).toBe(1);
      expect(container.querySelector('[data-highlight-id="h-alpha"]')).toBeFalsy();
      expect(container.querySelector('[data-highlight-id="h-gamma"]')).toBeTruthy();

      // Clear all
      clearRenderedHighlights(container);
      expect(container.querySelectorAll('mark.pomegranate-highlight').length).toBe(0);
      expect(container.textContent).toBe('Alpha beta gamma delta epsilon.');
    });

    it('identifies excluded elements accurately', () => {
      const doc = domino.createDocument(
        '<section class="prose"><pre><code>block</code></pre><div class="mermaid">svg</div><button class="part-listen-btn">Listen</button><p>Normal <code>inline</code></p></section>'
      );
      expect(isExcludedElement(doc.querySelector('pre'))).toBe(true);
      expect(isExcludedElement(doc.querySelector('pre code'))).toBe(true);
      expect(isExcludedElement(doc.querySelector('.mermaid'))).toBe(true);
      expect(isExcludedElement(doc.querySelector('button'))).toBe(true);
      expect(isExcludedElement(doc.querySelector('p'))).toBe(false);
      // Inline code in paragraph is allowed
      expect(isExcludedElement(doc.querySelector('p code'))).toBe(false);
    });

    it('computes exact offsets using findHighlightOffsets', () => {
      const fullText = 'The quick brown fox jumps over the lazy dog.';
      const match = findHighlightOffsets(fullText, {
        text: 'brown fox',
        contextBefore: 'The quick ',
        contextAfter: ' jumps',
      });
      expect(match).not.toBeNull();
      expect(match?.start).toBe(10);
      expect(match?.end).toBe(19);
      expect(match?.matchType).toBe('exact_context');
    });

    it('resolves DOM boundary points to exact character offsets without global indexOf fallback', () => {
      const doc = domino.createDocument(
        '<section class="prose"><p>First text segment. <span>Nested span segment.</span> Final trailing segment.</p></section>'
      );
      const container = doc.querySelector('.prose');
      const index = buildTextIndex(container);

      const span = doc.querySelector('span');
      const spanTextNode = span.firstChild;

      // Point directly inside span text node
      const offsetInSpan = resolvePointToCharOffset(spanTextNode, 7, index, true);
      expect(offsetInSpan).toBe(index.fullText.indexOf('Nested span segment.') + 7);

      // Point at element child boundary on <p>
      const p = doc.querySelector('p');
      const offsetAtSpanStart = resolvePointToCharOffset(p, 1, index, true);
      expect(offsetAtSpanStart).toBe(index.fullText.indexOf('Nested span segment.'));

      const offsetAtSpanEnd = resolvePointToCharOffset(p, 2, index, false);
      expect(offsetAtSpanEnd).toBe(
        index.fullText.indexOf('Nested span segment.') + 'Nested span segment.'.length
      );
    });

    it('detects when range intersects excluded elements using rangeIntersectsNode', () => {
      const fakeNode = { ownerDocument: null } as unknown as Node;

      // When browser supports range.intersectsNode directly
      const mockRangeWithIntersects = {
        intersectsNode: vi.fn((node: Node) => node === fakeNode),
      } as unknown as Range;
      expect(rangeIntersectsNode(mockRangeWithIntersects, fakeNode)).toBe(true);

      // When fallback compareBoundaryPoints is used
      const mockRangeWithCompare = {
        compareBoundaryPoints: vi.fn((how: number) => {
          // END_TO_START is 3, START_TO_END is 1
          if (how === 3) return -1;
          if (how === 1) return 1;
          return 0;
        }),
      } as unknown as Range;

      const mockDoc = {
        createRange: vi.fn(() => ({
          selectNode: vi.fn(),
        })),
      };
      const nodeWithDoc = { ownerDocument: mockDoc } as unknown as Node;
      expect(rangeIntersectsNode(mockRangeWithCompare, nodeWithDoc)).toBe(true);
    });

    it('anchors successfully when selection text was trimmed with duplicate phrases in post', () => {
      // Document with duplicate phrase "memory leak"
      const doc = domino.createDocument(
        '<section class="prose"><p>Initial memory leak found in kernel.</p><p>Secondary memory leak found in userland daemon.</p></section>'
      );
      const container = doc.querySelector('.prose');

      // Highlight for second occurrence with context that ends and starts immediately adjacent to trimmed text
      const highlight: StoredHighlight = {
        id: 'h-trimmed-2',
        text: 'memory leak',
        contextBefore: 'Secondary ',
        contextAfter: ' found in userland daemon.',
        color: 'default',
        createdAt: '2026-09-29T00:00:00.000Z',
      };

      const marks = anchorHighlight(container, highlight);
      expect(marks.length).toBe(1);
      expect(marks[0].textContent).toBe('memory leak');
      expect(marks[0].closest('p')?.textContent).toContain('Secondary memory leak');
    });
  });

  describe('Storage Layer & Defensive Validation (storage.ts)', () => {
    let mockStorage: Record<string, string> = {};

    beforeEach(() => {
      mockStorage = {};
      const fakeLocalStorage = {
        getItem: vi.fn((key: string) => mockStorage[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          mockStorage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockStorage[key];
        }),
        clear: vi.fn(() => {
          mockStorage = {};
        }),
      };
      vi.stubGlobal('localStorage', fakeLocalStorage);
      vi.stubGlobal('window', { localStorage: fakeLocalStorage });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it('generates consistent storage keys formatted as pomegranate:highlights:<slug>', () => {
      expect(getStorageKey('standalone/my-post')).toBe('pomegranate:highlights:standalone/my-post');
      expect(getStorageKey('/series/kernel/01-hooks/')).toBe(
        'pomegranate:highlights:series/kernel/01-hooks'
      );
    });

    it('validates schema and discards invalid or corrupt records on read', () => {
      const corruptData = [
        {
          id: 'valid-1',
          text: 'Good text',
          contextBefore: 'a',
          contextAfter: 'b',
          createdAt: '2026-09-29T00:00:00Z',
        },
        { id: '', text: 'Missing id', contextBefore: 'a', contextAfter: 'b' },
        { id: 'bad-2', text: '', contextBefore: 'a', contextAfter: 'b' }, // missing text
        { id: 'bad-3', text: 12345 }, // invalid type
        null,
        'string instead of object',
        { id: 'valid-2', text: 'Another good text', contextBefore: '', contextAfter: '' },
      ];

      mockStorage['pomegranate:highlights:test-post'] = JSON.stringify(corruptData);

      const loaded = loadHighlights('test-post');
      expect(loaded.length).toBe(2);
      expect(loaded[0].id).toBe('valid-1');
      expect(loaded[1].id).toBe('valid-2');
      expect(loaded[0].color).toBe('default');
    });

    it('handles corrupt JSON in localStorage without throwing', () => {
      mockStorage['pomegranate:highlights:test-post'] = '<<<NOT JSON AT ALL>>>';

      expect(() => {
        const loaded = loadHighlights('test-post');
        expect(loaded).toEqual([]);
      }).not.toThrow();
    });

    it('caps highlights at MAX_HIGHLIGHTS_PER_POST (100) to protect browser storage quota', () => {
      for (let i = 0; i < MAX_HIGHLIGHTS_PER_POST; i++) {
        const res = addHighlight('test-post', {
          text: `Highlight number ${i}`,
          contextBefore: 'before',
          contextAfter: 'after',
        });
        expect(res.success).toBe(true);
      }

      // 101st highlight must be rejected gracefully
      const overflow = addHighlight('test-post', {
        text: 'Overflow highlight',
        contextBefore: 'before',
        contextAfter: 'after',
      });

      expect(overflow.success).toBe(false);
      expect(overflow.error).toContain('Maximum limit of 100 highlights reached');
      expect(loadHighlights('test-post').length).toBe(MAX_HIGHLIGHTS_PER_POST);
    });

    it('handles QuotaExceededError gracefully without throwing', () => {
      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';

      (window.localStorage.setItem as any).mockImplementationOnce(() => {
        throw quotaError;
      });

      const res = saveHighlights('test-post', [
        {
          id: 'test-1',
          text: 'Some text',
          contextBefore: '',
          contextAfter: '',
          color: 'default',
          createdAt: new Date().toISOString(),
        },
      ]);

      expect(res.success).toBe(false);
      expect(res.quotaExceeded).toBe(true);
      expect(res.error).toContain('quota exceeded');
    });

    it('degrades gracefully when storage is unavailable or disabled', () => {
      vi.stubGlobal('localStorage', undefined);
      vi.stubGlobal('window', {});

      expect(() => {
        const loaded = loadHighlights('test-post');
        expect(loaded).toEqual([]);

        const saveRes = saveHighlights('test-post', []);
        expect(saveRes.success).toBe(false);
      }).not.toThrow();
    });

    it('safely handles SecurityError on localStorage property access without crashing', () => {
      const securityErr = new Error('The operation is insecure.');
      securityErr.name = 'SecurityError';

      const restrictedWindow = {};
      Object.defineProperty(restrictedWindow, 'localStorage', {
        get() {
          throw securityErr;
        },
      });
      vi.stubGlobal('window', restrictedWindow);

      expect(() => {
        const storage = getSafeLocalStorage();
        expect(storage).toBeNull();

        const loaded = loadHighlights('security-post');
        expect(loaded).toEqual([]);

        const saveRes = saveHighlights('security-post', []);
        expect(saveRes.success).toBe(false);
        expect(saveRes.error).toContain('not available or permitted');

        const clearRes = clearHighlights('security-post');
        expect(clearRes.success).toBe(false);
      }).not.toThrow();
    });

    it('validates single highlight objects using validateHighlight', () => {
      expect(validateHighlight(null)).toBeNull();
      expect(validateHighlight({})).toBeNull();
      expect(validateHighlight({ id: '', text: 'abc' })).toBeNull();
      expect(validateHighlight({ id: '1', text: '' })).toBeNull();

      const valid = validateHighlight({
        id: 'h-100',
        text: 'valid quote',
        contextBefore: 'before',
        contextAfter: 'after',
      });
      expect(valid).not.toBeNull();
      expect(valid?.id).toBe('h-100');
      expect(valid?.color).toBe('default');
      expect(valid?.createdAt).toBeDefined();
    });

    it('removes highlights and clears storage cleanly', () => {
      addHighlight('test-post', { text: 'Highlight 1', contextBefore: '', contextAfter: '' });
      addHighlight('test-post', { text: 'Highlight 2', contextBefore: '', contextAfter: '' });
      const current = loadHighlights('test-post');
      expect(current.length).toBe(2);

      const remRes = removeHighlight('test-post', current[0].id);
      expect(remRes.success).toBe(true);
      expect(loadHighlights('test-post').length).toBe(1);

      const clearRes = clearHighlights('test-post');
      expect(clearRes.success).toBe(true);
      expect(loadHighlights('test-post').length).toBe(0);
    });

    it('seamlessly loads and auto-migrates legacy highlights from blogly: prefix', () => {
      expect(getLegacyStorageKey('test-post')).toBe('blogly:highlights:test-post');

      const legacyHighlights = [
        {
          id: 'legacy-1',
          text: 'Legacy highlight text',
          contextBefore: 'before',
          contextAfter: 'after',
          color: 'default',
          createdAt: '2026-09-01T00:00:00.000Z',
        },
      ];
      mockStorage['blogly:highlights:test-post'] = JSON.stringify(legacyHighlights);

      expect(mockStorage['pomegranate:highlights:test-post']).toBeUndefined();

      const loaded = loadHighlights('test-post');
      expect(loaded.length).toBe(1);
      expect(loaded[0].id).toBe('legacy-1');
      expect(loaded[0].text).toBe('Legacy highlight text');

      expect(mockStorage['pomegranate:highlights:test-post']).toBeDefined();
      expect(mockStorage['blogly:highlights:test-post']).toBeUndefined();

      // clearHighlights removes both keys
      mockStorage['blogly:highlights:test-post'] = JSON.stringify(legacyHighlights);
      clearHighlights('test-post');
      expect(mockStorage['pomegranate:highlights:test-post']).toBeUndefined();
      expect(mockStorage['blogly:highlights:test-post']).toBeUndefined();
    });
  });

  describe('Markdown Export (export.ts)', () => {
    it('escapes Markdown special characters in exported highlight quotes', () => {
      const raw = 'Text with `backticks`, *asterisks*, _underscores_, [brackets], and <div> tags';
      const escaped = escapeMarkdown(raw);

      expect(escaped).toContain('\\`backticks\\`');
      expect(escaped).toContain('\\*asterisks\\*');
      expect(escaped).toContain('\\_underscores\\_');
      expect(escaped).toContain('\\[brackets\\]');
      expect(escaped).toContain('&lt;div&gt;');
    });

    it('generates well-structured Markdown document containing post metadata and quotes', () => {
      const md = generateHighlightsMarkdown({
        postTitle: 'Understanding Linux Namespaces',
        postUrl: 'https://example.com/blog/linux-namespaces',
        exportedAt: '2026-09-29T10:00:00.000Z',
        highlights: [
          {
            id: 'hl-1',
            text: 'Namespaces isolate system resources for processes.',
            contextBefore: '',
            contextAfter: '',
            color: 'default',
            createdAt: '2026-09-29T09:30:00.000Z',
          },
          {
            id: 'hl-2',
            text: 'CLONE_NEWPID creates a private PID hierarchy.',
            contextBefore: '',
            contextAfter: '',
            color: 'default',
            createdAt: '2026-09-29T09:45:00.000Z',
          },
        ],
      });

      expect(md).toContain('# Highlights: Understanding Linux Namespaces');
      expect(md).toContain('https://example.com/blog/linux-namespaces');
      expect(md).toContain('2 highlights');
      expect(md).toContain('> Namespaces isolate system resources for processes.');
      expect(md).toContain('> CLONE\\_NEWPID creates a private PID hierarchy.');
    });

    it('handles empty highlights export cleanly', () => {
      const md = generateHighlightsMarkdown({
        postTitle: 'Empty Post',
        postUrl: 'https://example.com/blog/empty',
        exportedAt: '2026-09-29T10:00:00.000Z',
        highlights: [],
      });

      expect(md).toContain('No highlights recorded on this post.');
    });

    it('escapes Markdown special characters in post title and encodes parentheses in post URL', () => {
      const md = generateHighlightsMarkdown({
        postTitle: 'Understanding [Kernel] *Memory* #1',
        postUrl: 'https://example.com/blog/post(part-1)',
        exportedAt: '2026-09-29T10:00:00.000Z',
        highlights: [
          {
            id: 'hl-test',
            text: 'Special quote',
            contextBefore: '',
            contextAfter: '',
            color: 'default',
            createdAt: '2026-09-29T10:00:00.000Z',
          },
        ],
      });

      expect(md).toContain('# Highlights: Understanding \\[Kernel\\] \\*Memory\\* #1');
      expect(md).toContain('https://example.com/blog/post%28part-1%29');
    });
  });

  describe('Component Rendering (Highlighter.astro)', () => {
    it('renders mode-aware toolbar button, floating bar, remove popover, and drawer', async () => {
      const container = await AstroContainer.create();
      const result = await container.renderToString(HighlighterComponent, {
        props: {
          postSlug: 'standalone/welcome-to-glyph',
          postTitle: 'Welcome to Pomegranate',
        },
      });

      // Root container and metadata
      expect(result).toContain('id="highlighter-root"');
      expect(result).toContain('data-post-slug="standalone/welcome-to-glyph"');
      expect(result).toContain('data-post-title="Welcome to Pomegranate"');

      // Toolbar toggle button
      expect(result).toContain('id="highlighter-drawer-toggle-btn"');
      expect(result).toContain('id="highlighter-count-badge"');

      // Floating selection control with both TUI and Standard buttons
      expect(result).toContain('id="highlighter-floating-bar"');
      expect(result).toContain('id="hl-confirm-btn-tui"');
      expect(result).toContain('id="hl-confirm-btn-std"');

      // Remove popover with both TUI and Standard buttons and Follow Link actions
      expect(result).toContain('id="highlighter-remove-popover"');
      expect(result).toContain('id="hl-remove-btn-tui"');
      expect(result).toContain('id="hl-remove-btn-std"');
      expect(result).toContain('id="hl-follow-link-tui"');
      expect(result).toContain('id="hl-follow-link-std"');
      expect(result).toContain('Follow Link');

      // Drawer and actions
      expect(result).toContain('id="highlighter-drawer"');
      expect(result).toContain('id="highlighter-list-container"');
      expect(result).toContain('id="highlighter-download-btn"');
      expect(result).toContain('id="highlighter-clear-all-btn"');

      // Toast notice
      expect(result).toContain('id="highlighter-toast"');
    });
  });
});
