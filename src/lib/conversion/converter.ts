import path from 'node:path';
import mammoth from 'mammoth';
import TurndownService from 'turndown';
import { PDFParse } from 'pdf-parse';
import Papa from 'papaparse';
import { createWorker } from 'tesseract.js';

export class MissingGroqApiKeyError extends Error {
  constructor(message = 'Add a Groq API key in Settings to convert audio files') {
    super(message);
    this.name = 'MissingGroqApiKeyError';
  }
}

export interface ConversionOptions {
  buffer: Buffer;
  filename: string;
  mimeType?: string;
  groqApiKey?: string;
}

export interface ConversionResult {
  markdown: string;
  title: string;
  description?: string;
  filename: string;
  tier: 1 | 2;
  format: string;
  warning?: string;
}

/**
 * Escape cell text to protect GitHub-Flavored Markdown table syntax
 */
function escapeTableCell(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br/>')
    .trim();
}

/**
 * Format CSV content into a GitHub-Flavored Markdown table
 */
export function csvToMarkdown(csvString: string): string {
  const parsed = Papa.parse<string[]>(csvString.trim(), { skipEmptyLines: true });
  const rows = parsed.data;
  if (!rows || rows.length === 0) return '';
  const headers = rows[0];
  const dataRows = rows.slice(1);
  const headerLine = `| ${headers.map((h) => escapeTableCell(h)).join(' | ')} |`;
  const separatorLine = `| ${headers.map(() => '---').join(' | ')} |`;
  const bodyLines = dataRows.map((row) => {
    const cells = headers.map((_, i) => escapeTableCell(row[i]));
    return `| ${cells.join(' | ')} |`;
  });
  return [headerLine, separatorLine, ...bodyLines].join('\n');
}

/**
 * Format JSON content into Markdown table or code block
 */
export function jsonToMarkdown(jsonString: string): string {
  const data = JSON.parse(jsonString);
  if (Array.isArray(data) && data.length > 0) {
    const objectItems = data.filter((item) => item !== null && typeof item === 'object' && !Array.isArray(item));
    // Format as a table only when every element is a non-null object
    if (objectItems.length === data.length && objectItems.length > 0) {
      const keys = Array.from(new Set(objectItems.flatMap((item) => Object.keys(item))));
      if (keys.length > 0) {
        const headerLine = `| ${keys.map((k) => escapeTableCell(k)).join(' | ')} |`;
        const separatorLine = `| ${keys.map(() => '---').join(' | ')} |`;
        const bodyLines = data.map((item) => {
          const cells = keys.map((k) => escapeTableCell(item && (item as any)[k]));
          return `| ${cells.join(' | ')} |`;
        });
        return [headerLine, separatorLine, ...bodyLines].join('\n');
      }
    }
  }
  return '```json\n' + JSON.stringify(data, null, 2) + '\n```';
}

/**
 * Convert HTML string into clean Markdown
 */
export function htmlToMarkdown(htmlString: string): string {
  const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
  return td.turndown(htmlString);
}

/**
 * Convert DOCX buffer into clean Markdown via Mammoth and Turndown
 */
export async function docxToMarkdown(buffer: Buffer): Promise<string> {
  const result = await mammoth.convertToHtml({ buffer });
  const html = result.value || '';
  return htmlToMarkdown(html);
}

/**
 * Extract text from PDF buffer and format into Markdown paragraphs
 */
export async function pdfToMarkdown(buffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: buffer });
    try {
      const textResult = await parser.getText();
      const rawText = (textResult.text || '').trim();
      if (!rawText) {
        return '> *Note: This PDF does not contain extractable text (it may be a scanned image or protected document).*';
      }
      // Split on double line breaks for distinct paragraphs/sections
      const blocks = rawText.split(/\r?\n\s*\r?\n+/);
      const formattedBlocks = blocks
        .map((block) => {
          const lines = block
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean);
          // If lines start with list markers or headings, keep line breaks intact
          if (lines.some((l) => /^[-*•#]|\d+\./.test(l))) {
            return lines.join('\n');
          }
          // Otherwise join wrapped prose lines with space
          return lines.join(' ');
        })
        .filter(Boolean);
      return formattedBlocks.join('\n\n');
    } finally {
      await parser.destroy();
    }
  } catch (err: any) {
    throw new Error(`Failed to parse PDF: ${err.message || 'Invalid or encrypted PDF structure'}`);
  }
}

/**
 * Optical character recognition (OCR) on image buffer via Tesseract.js (Tier 1 on-device)
 */
export async function imageToMarkdown(buffer: Buffer, filename: string): Promise<string> {
  const cachePath = path.resolve(process.cwd(), '.tesseract-cache');
  try {
    const worker = await createWorker('eng', 1, {
      cachePath,
    });
    try {
      const ret = await worker.recognize(buffer);
      const text = (ret.data?.text || '').trim();
      if (!text) {
        return `> *Image OCR completed for ${filename}: No text recognized in image.*`;
      }
      return text
        .split(/\r?\n\s*\r?\n+/)
        .map((p) => p.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .join('\n\n');
    } finally {
      await worker.terminate();
    }
  } catch (err: any) {
    throw new Error(
      `On-device image OCR failed: ${err.message || 'Unable to initialize Tesseract language model. Ensure initial internet connection to cache language data or provide a text format.'}`
    );
  }
}

/**
 * Transcribe audio buffer via Groq-hosted Whisper Large V3 (Tier 2 BYOK)
 */
export async function audioToMarkdown(
  buffer: Buffer,
  filename: string,
  apiKey?: string,
  mimeType?: string
): Promise<string> {
  const key = apiKey?.trim();
  if (!key) {
    throw new MissingGroqApiKeyError();
  }

  const formData = new FormData();
  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType || 'audio/mpeg' });
  formData.append('file', blob, filename);
  formData.append('model', 'whisper-large-v3');
  formData.append('response_format', 'verbose_json');

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errMsg = `Groq Whisper transcription failed (${response.status})`;
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed.error?.message) {
        errMsg = `Groq API Error: ${parsed.error.message}`;
      }
    } catch {}
    throw new Error(errMsg);
  }

  const data = await response.json();
  const text = (data.text || '').trim();
  if (!text) {
    return `> *Audio transcription completed for ${filename}: No speech detected.*`;
  }

  const paragraphs = text
    .split(/\r?\n\s*\r?\n+/)
    .map((p: string) => p.trim())
    .filter(Boolean);

  return paragraphs.join('\n\n');
}

/**
 * Generate human-friendly title from filename
 */
function deriveTitleFromFilename(filename: string): string {
  const base = path.basename(filename).replace(/\.[^/.]+$/, '');
  return (
    base
      .replace(/^[0-9]+[-_]?/, '')
      .split(/[-_]+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') || 'Untitled Article'
  );
}

/**
 * Primary conversion dispatcher: routes by extension/format to appropriate Tier 1 or Tier 2 handler
 */
export async function convertFileToMarkdown(options: ConversionOptions): Promise<ConversionResult> {
  const { buffer, filename, mimeType, groqApiKey } = options;
  const ext = path.extname(filename).toLowerCase().replace('.', '') || '';
  const baseName = path.basename(filename).replace(/\.[^/.]+$/, '');
  const derivedTitle = deriveTitleFromFilename(filename);

  let rawContent = '';
  let tier: 1 | 2 = 1;
  let format = ext;
  let warning: string | undefined;

  switch (ext) {
    case 'md':
    case 'markdown':
    case 'mdx':
    case 'txt': {
      tier = 1;
      format = 'markdown';
      rawContent = buffer.toString('utf-8');
      break;
    }

    case 'html':
    case 'htm': {
      tier = 1;
      format = 'html';
      const htmlStr = buffer.toString('utf-8');
      rawContent = htmlToMarkdown(htmlStr);
      break;
    }

    case 'docx': {
      tier = 1;
      format = 'docx';
      rawContent = await docxToMarkdown(buffer);
      break;
    }

    case 'pdf': {
      tier = 1;
      format = 'pdf';
      rawContent = await pdfToMarkdown(buffer);
      break;
    }

    case 'csv': {
      tier = 1;
      format = 'csv';
      const csvStr = buffer.toString('utf-8');
      rawContent = csvToMarkdown(csvStr);
      break;
    }

    case 'json': {
      tier = 1;
      format = 'json';
      const jsonStr = buffer.toString('utf-8');
      rawContent = jsonToMarkdown(jsonStr);
      break;
    }

    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'webp':
    case 'bmp':
    case 'tiff':
    case 'gif': {
      tier = 1;
      format = 'image-ocr';
      rawContent = await imageToMarkdown(buffer, filename);
      break;
    }

    case 'mp3':
    case 'wav':
    case 'm4a':
    case 'ogg':
    case 'flac':
    case 'aac': {
      tier = 2;
      format = 'audio-whisper';
      rawContent = await audioToMarkdown(buffer, filename, groqApiKey, mimeType);
      break;
    }

    default: {
      tier = 1;
      format = 'unknown';
      // Reject binary file with null bytes rather than corrupting text
      if (buffer.includes(0)) {
        throw new Error(`Unsupported binary file format .${ext} for conversion`);
      }
      try {
        rawContent = buffer.toString('utf-8');
        warning = `Unrecognized format .${ext}. Treated as plain text.`;
      } catch {
        throw new Error(`Unsupported file format .${ext} for conversion`);
      }
    }
  }

  // Ensure content has a title heading if not already present, ignoring code blocks
  let finalMarkdown = rawContent.trim();
  const strippedOfCode = finalMarkdown.replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, '');
  const headingMatch = strippedOfCode.match(/^#\s+(.+)$/m);
  let title = derivedTitle;

  if (headingMatch) {
    title = headingMatch[1].trim();
  } else {
    finalMarkdown = `# ${derivedTitle}\n\n${finalMarkdown}`;
  }

  // Extract description if blockquote follows title
  let description: string | undefined;
  const descMatch = finalMarkdown.match(/^#\s+.+\r?\n\r?\n>\s+(.+)$/m);
  if (descMatch) {
    description = descMatch[1].trim();
  }

  const targetFilename = `${baseName}.md`;

  return {
    markdown: finalMarkdown,
    title,
    description,
    filename: targetFilename,
    tier,
    format,
    warning,
  };
}
