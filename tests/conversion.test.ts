import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  csvToMarkdown,
  jsonToMarkdown,
  htmlToMarkdown,
  docxToMarkdown,
  pdfToMarkdown,
  imageToMarkdown,
  audioToMarkdown,
  convertFileToMarkdown,
  MissingGroqApiKeyError,
} from '../src/lib/conversion/converter';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import SettingsTab from '../src/components/dashboard/SettingsTab.astro';
import FileUploadTab from '../src/components/dashboard/FileUploadTab.astro';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';

vi.mock('tesseract.js', () => ({
  createWorker: vi.fn().mockImplementation(async () => ({
    recognize: vi.fn().mockResolvedValue({
      data: {
        text: 'Architecture Overview\n\nClient requests hit the reverse proxy and route to workers.',
      },
    }),
    terminate: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe('Phase 5: File Conversion Pipeline Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Tier 1: CSV and JSON formatting', () => {
    it('converts CSV into a GitHub-Flavored Markdown table', () => {
      const csv = `Title,Author,Episodes\nDistributed Systems,Harish,5\nLinux Internals,Harish,3`;
      const result = csvToMarkdown(csv);

      expect(result).toContain('| Title | Author | Episodes |');
      expect(result).toContain('| --- | --- | --- |');
      expect(result).toContain('| Distributed Systems | Harish | 5 |');
      expect(result).toContain('| Linux Internals | Harish | 3 |');
    });

    it('escapes pipes and newlines in table cells', () => {
      const csv = `Metric,Expression\nBitwise,A|B\nMultiline,"Line 1\nLine 2"`;
      const result = csvToMarkdown(csv);

      expect(result).toContain('A\\|B');
      expect(result).toContain('Line 1<br/>Line 2');
    });

    it('converts JSON array of objects into a Markdown table', () => {
      const json = JSON.stringify([
        { tool: 'Mammoth', target: 'DOCX', tier: 1 },
        { tool: 'pdf-parse', target: 'PDF', tier: 1 },
      ]);
      const result = jsonToMarkdown(json);

      expect(result).toContain('| tool | target | tier |');
      expect(result).toContain('| --- | --- | --- |');
      expect(result).toContain('| Mammoth | DOCX | 1 |');
      expect(result).toContain('| pdf-parse | PDF | 1 |');
    });

    it('handles mixed or non-uniform JSON arrays gracefully by falling back to code block', () => {
      const json = JSON.stringify([{ name: 'Alpha' }, null, 'scalar']);
      const result = jsonToMarkdown(json);

      expect(result).toContain('```json');
      expect(result).toContain('"name": "Alpha"');
    });

    it('converts arbitrary JSON object into a fenced code block', () => {
      const json = JSON.stringify({ settings: { theme: 'blogly', local: true } });
      const result = jsonToMarkdown(json);

      expect(result).toContain('```json');
      expect(result).toContain('"theme": "blogly"');
    });
  });

  describe('Tier 1: HTML and Document Conversion', () => {
    it('converts semantic HTML to clean Markdown with Turndown', () => {
      const html = `
        <h1>Deep Dive into eBPF</h1>
        <p>Extended Berkeley Packet Filter is a revolution in observability.</p>
        <h2>Key Benefits</h2>
        <ul>
          <li>Performance</li>
          <li>Safety</li>
        </ul>
        <pre><code>SEC("kprobe/sys_execve")</code></pre>
      `;
      const md = htmlToMarkdown(html);

      expect(md).toContain('# Deep Dive into eBPF');
      expect(md).toContain('Extended Berkeley Packet Filter is a revolution');
      expect(md).toContain('## Key Benefits');
      expect(md).toContain('*   Performance');
      expect(md).toContain('```\nSEC("kprobe/sys_execve")\n```');
    });

    it('converts DOCX buffer to Markdown using Mammoth and Turndown', async () => {
      vi.spyOn(mammoth, 'convertToHtml').mockResolvedValue({
        value: '<h1>DOCX Heading</h1><p>Paragraph from Word document.</p>',
        messages: [],
      });

      const buffer = Buffer.from('mock-docx-binary');
      const md = await docxToMarkdown(buffer);

      expect(mammoth.convertToHtml).toHaveBeenCalled();
      expect(md).toContain('# DOCX Heading');
      expect(md).toContain('Paragraph from Word document.');
    });

    it('extracts paragraphs from PDF buffer', async () => {
      vi.spyOn(PDFParse.prototype, 'getText').mockResolvedValue({
        text: 'System Architecture Overview\n\nMicroservices with distributed consensus.',
      } as any);
      vi.spyOn(PDFParse.prototype, 'destroy').mockResolvedValue(undefined as any);

      const buffer = Buffer.from('mock-pdf-binary');
      const res = await convertFileToMarkdown({
        buffer,
        filename: 'system-architecture.pdf',
      });

      expect(res.tier).toBe(1);
      expect(res.format).toBe('pdf');
      expect(res.title).toBe('System Architecture');
      expect(res.filename).toBe('system-architecture.md');
      expect(res.markdown).toContain('Microservices with distributed consensus.');
    });

    it('handles corrupt or empty PDF files gracefully', async () => {
      vi.spyOn(PDFParse.prototype, 'getText').mockResolvedValue({
        text: '',
      } as any);
      vi.spyOn(PDFParse.prototype, 'destroy').mockResolvedValue(undefined as any);

      const buffer = Buffer.from('empty-pdf');
      const md = await pdfToMarkdown(buffer);

      expect(md).toContain('Note: This PDF does not contain extractable text');
    });
  });

  describe('Tier 1: Image OCR via Tesseract.js (On-Device)', () => {
    it('runs OCR on image buffer and returns extracted text in Markdown', async () => {
      const buffer = Buffer.from('mock-image-bytes');
      const md = await imageToMarkdown(buffer, 'diagram.png');

      expect(md).toContain('Architecture Overview');
      expect(md).toContain('Client requests hit the reverse proxy');
    });
  });

  describe('Tier 1: Zero Remote Network Calls Guarantee & Robust Boundaries', () => {
    it('executes all Tier 1 handlers without making any HTTP/fetch network requests', async () => {
      const fetchSpy = vi.fn();
      global.fetch = fetchSpy;

      // 1. Text/Markdown
      await convertFileToMarkdown({
        buffer: Buffer.from('# Local Markdown\n\nDirect passthrough content.'),
        filename: 'article.md',
      });

      // 2. HTML
      await convertFileToMarkdown({
        buffer: Buffer.from('<h1>Local HTML</h1><p>Offline conversion.</p>'),
        filename: 'page.html',
      });

      // 3. CSV
      await convertFileToMarkdown({
        buffer: Buffer.from('Key,Value\nLocal,True\nNetwork,False'),
        filename: 'data.csv',
      });

      // 4. JSON
      await convertFileToMarkdown({
        buffer: Buffer.from(JSON.stringify([{ offline: true }])),
        filename: 'data.json',
      });

      // Assert zero external network calls were triggered during Tier 1 conversions
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('excludes code block comments from being selected as article title', async () => {
      const codeSnippet =
        '```bash\n# Comment inside bash script\necho "test"\n```\n\nArticle body paragraph.';
      const res = await convertFileToMarkdown({
        buffer: Buffer.from(codeSnippet),
        filename: 'devops-guide.md',
      });

      // Heading inside code block should NOT become article title; derived title should be used
      expect(res.title).toBe('Devops Guide');
    });

    it('rejects binary files containing null bytes in default fallback', async () => {
      // Buffer containing null byte 0x00
      const binaryBuffer = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x00, 0x01]);
      await expect(
        convertFileToMarkdown({
          buffer: binaryBuffer,
          filename: 'program.bin',
        })
      ).rejects.toThrow('Unsupported binary file format .bin for conversion');
    });
  });

  describe('Tier 2: Audio Transcription via Groq Whisper (BYOK)', () => {
    it('throws MissingGroqApiKeyError with plain-language guidance when no Groq key is provided', async () => {
      const buffer = Buffer.from('mock-audio-data');

      await expect(audioToMarkdown(buffer, 'podcast-interview.mp3')).rejects.toThrow(
        MissingGroqApiKeyError
      );

      await expect(audioToMarkdown(buffer, 'podcast-interview.mp3')).rejects.toThrow(
        'Add a Groq API key in Settings to convert audio files'
      );
    });

    it('fails clearly in convertFileToMarkdown dispatcher when audio file is uploaded without key', async () => {
      const buffer = Buffer.from('mock-audio-data');

      await expect(
        convertFileToMarkdown({
          buffer,
          filename: 'tech-talk.wav',
        })
      ).rejects.toThrow('Add a Groq API key in Settings to convert audio files');
    });

    it('transcribes audio via Groq Whisper Large V3 when valid BYOK key is supplied', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          text: 'Welcome to the tech podcast. Today we talk about distributed state machines.',
        }),
      });
      global.fetch = mockFetch;

      const buffer = Buffer.from('mock-audio-bytes');
      const apiKey = 'gsk_test_mock_groq_api_key_12345';

      const res = await convertFileToMarkdown({
        buffer,
        filename: 'episode-42.mp3',
        groqApiKey: apiKey,
      });

      expect(res.tier).toBe(2);
      expect(res.format).toBe('audio-whisper');
      expect(res.filename).toBe('episode-42.md');
      expect(res.markdown).toContain('Welcome to the tech podcast');

      // Verify Groq Whisper API endpoint and auth header
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.groq.com/openai/v1/audio/transcriptions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        })
      );
    });

    it('handles Groq API HTTP failure with clear error explanation', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ error: { message: 'Invalid API Key provided' } }),
      });
      global.fetch = mockFetch;

      const buffer = Buffer.from('mock-audio-bytes');
      await expect(
        convertFileToMarkdown({
          buffer,
          filename: 'meeting.m4a',
          groqApiKey: 'gsk_invalid_key',
        })
      ).rejects.toThrow('Groq API Error: Invalid API Key provided');
    });
  });

  describe('UI Component Integration', () => {
    it('renders SettingsTab with BYOK Groq API Key management and Tier 2 badge', async () => {
      const container = await AstroContainer.create();
      const result = await container.renderToString(SettingsTab);

      expect(result).toContain('BYOK API Integrations (Groq Whisper)');
      expect(result).toContain('Tier 2 Audio');
      expect(result).toContain('id="byok-groq-key"');
      expect(result).toContain('data-action="save-groq-key"');
      expect(result).toContain('Zero-Knowledge BYOK Guarantee');
    });

    it('renders FileUploadTab with full format support and Phase 5 conversion seam', async () => {
      const container = await AstroContainer.create();
      const result = await container.renderToString(FileUploadTab);

      expect(result).toContain(
        'Supports DOCX, PDF, HTML, CSV, JSON, OCR, and Audio via the Phase 5 conversion seam'
      );
      expect(result).toContain('id="file-dropzone"');
      expect(result).toContain('id="raw-markdown-input"');
      expect(result).toContain('id="rendered-markdown-output"');
    });
  });
});
