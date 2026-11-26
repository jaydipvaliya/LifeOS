export interface OcrInput {
  buffer: Buffer | null;
  mimeType: string;
  title: string;
  originalFilename: string;
  tags: string[];
  expiryDate: string | null;
}

export interface IOcrService {
  extractText(input: OcrInput): Promise<string>;
}

function extractReadablePdfStrings(buffer: Buffer): string {
  const rawLatin = buffer.toString('latin1');
  const fragments: string[] = [];
  const parenRegex = /\(([^()\\]{3,160})\)/g;
  let match: RegExpExecArray | null = parenRegex.exec(rawLatin);
  while (match !== null && fragments.length < 250) {
    const cleaned = match[1]?.replace(/[^\x20-\x7E]/g, ' ').trim();
    if (cleaned && /[a-zA-Z0-9]{2,}/.test(cleaned)) {
      fragments.push(cleaned);
    }
    match = parenRegex.exec(rawLatin);
  }
  return fragments.join(' ');
}

/**
 * Local OCR & metadata text extractor.
 * Parses searchable PDF text literals and enriches with verified document metadata.
 */
export class LocalOcrService implements IOcrService {
  async extractText(input: OcrInput): Promise<string> {
    const lines: string[] = [
      `Document Title: ${input.title}`,
      `Original Filename: ${input.originalFilename}`,
    ];

    if (input.expiryDate) {
      lines.push(`Expiry Date: ${input.expiryDate}`);
    }
    if (input.tags.length > 0) {
      lines.push(`Tags: ${input.tags.join(', ')}`);
    }

    if (input.buffer && input.mimeType === 'application/pdf') {
      const pdfText = extractReadablePdfStrings(input.buffer);
      if (pdfText.length > 0) {
        lines.push(pdfText.slice(0, 8000));
      }
    }

    return lines.join('\n');
  }
}
