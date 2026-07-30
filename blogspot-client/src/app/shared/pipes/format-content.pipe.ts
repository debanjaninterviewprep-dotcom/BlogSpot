import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Converts plain-text blog content to properly formatted HTML.
 * If content already contains HTML tags (e.g. <p>, <h1>, <div>), it passes through as-is.
 * For plain text, it converts:
 *   - Double newlines → paragraph breaks
 *   - Single newlines → <br> tags
 *   - Markdown-style headings (# ## ###) → <h2>, <h3>, <h4>
 *   - **bold** → <strong>
 *   - *italic* → <em>
 *   - `code` → <code>
 *   - Lines starting with - or * → unordered lists
 *   - Lines starting with numbers (1. 2.) → ordered lists
 *
 * Usage: <div [innerHTML]="post.content | formatContent"></div>
 */
@Pipe({
  name: 'formatContent'
})
export class FormatContentPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {}

  transform(content: string | null | undefined): SafeHtml {
    if (!content) {
      return '';
    }

    // If content already contains HTML block-level tags, it's already formatted
    if (this.isHtmlContent(content)) {
      return this.sanitizer.bypassSecurityTrustHtml(this.sanitizeHtml(content));
    }

    // Convert plain text to professional HTML
    const html = this.convertPlainTextToHtml(content);
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private isHtmlContent(content: string): boolean {
    // Check for common block-level HTML tags
    return /<(p|div|h[1-6]|ul|ol|li|blockquote|pre|table|br\s*\/?)[\s>]/i.test(content);
  }

  private convertPlainTextToHtml(text: string): string {
    // Normalize line endings
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // If no newlines and text is long, split into paragraphs intelligently
    if (!text.includes('\n') && text.length > 200) {
      return this.splitIntoParagraphs(text);
    }

    // Split into paragraphs by double newlines
    const blocks = text.split(/\n{2,}/);
    const htmlBlocks: string[] = [];

    for (const block of blocks) {
      const trimmed = block.trim();
      if (!trimmed) continue;

      const lines = trimmed.split('\n');

      // Check if this block is a list
      if (this.isUnorderedList(lines)) {
        htmlBlocks.push(this.convertToUnorderedList(lines));
      } else if (this.isOrderedList(lines)) {
        htmlBlocks.push(this.convertToOrderedList(lines));
      } else if (this.isHeading(trimmed)) {
        htmlBlocks.push(this.convertHeading(trimmed));
      } else if (this.isBlockquote(trimmed)) {
        htmlBlocks.push(this.convertBlockquote(lines));
      } else if (lines.length === 1 && trimmed.length > 200) {
        // Single long block without newlines — split intelligently
        htmlBlocks.push(this.splitIntoParagraphs(trimmed));
      } else {
        // Regular paragraph - join with <br> for single newlines
        const formattedLines = lines.map(l => this.formatInlineText(l.trim())).join('<br>');
        htmlBlocks.push(`<p>${formattedLines}</p>`);
      }
    }

    return htmlBlocks.join('\n');
  }

  private isHeading(line: string): boolean {
    return /^#{1,4}\s/.test(line);
  }

  private convertHeading(line: string): string {
    const match = line.match(/^(#{1,4})\s+(.+)$/);
    if (!match) return `<p>${this.formatInlineText(line)}</p>`;
    const level = Math.min(match[1].length + 1, 5); // # → h2, ## → h3, etc.
    return `<h${level}>${this.formatInlineText(match[2])}</h${level}>`;
  }

  private isUnorderedList(lines: string[]): boolean {
    return lines.every(l => /^\s*[-*•]\s/.test(l));
  }

  private convertToUnorderedList(lines: string[]): string {
    const items = lines
      .map(l => l.replace(/^\s*[-*•]\s+/, ''))
      .map(l => `  <li>${this.formatInlineText(l)}</li>`);
    return `<ul>\n${items.join('\n')}\n</ul>`;
  }

  private isOrderedList(lines: string[]): boolean {
    return lines.every(l => /^\s*\d+[.)]\s/.test(l));
  }

  private convertToOrderedList(lines: string[]): string {
    const items = lines
      .map(l => l.replace(/^\s*\d+[.)]\s+/, ''))
      .map(l => `  <li>${this.formatInlineText(l)}</li>`);
    return `<ol>\n${items.join('\n')}\n</ol>`;
  }

  private isBlockquote(text: string): boolean {
    return /^>\s/.test(text);
  }

  private convertBlockquote(lines: string[]): string {
    const content = lines
      .map(l => l.replace(/^>\s?/, ''))
      .join('<br>');
    return `<blockquote>${this.formatInlineText(content)}</blockquote>`;
  }

  private formatInlineText(text: string): string {
    // Bold: **text** or __text__
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__(.+?)__/g, '<strong>$1</strong>');
    // Italic: *text* or _text_
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    text = text.replace(/_(.+?)_/g, '<em>$1</em>');
    // Code: `text`
    text = text.replace(/`(.+?)`/g, '<code>$1</code>');
    return text;
  }

  private sanitizeHtml(html: string): string {
    // Remove potentially dangerous tags/attributes while keeping formatting
    html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
    html = html.replace(/on\w+="[^"]*"/gi, '');
    html = html.replace(/on\w+='[^']*'/gi, '');
    html = html.replace(/javascript:/gi, '');
    return html;
  }

  /**
   * Splits a long block of text (no newlines) into logical paragraphs
   * using sentence boundaries and transition phrase detection.
   */
  private splitIntoParagraphs(text: string): string {
    // Split into sentences
    const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);

    if (sentences.length <= 2) {
      return `<p>${this.formatInlineText(text)}</p>`;
    }

    // Transition phrases that indicate a new paragraph
    const transitionPattern = /^(However|Moreover|Furthermore|Additionally|In addition|On the other hand|Nevertheless|Nonetheless|In contrast|Conversely|Meanwhile|Therefore|Consequently|As a result|Thus|Hence|Accordingly|For example|For instance|Specifically|In particular|To illustrate|In conclusion|To summarize|In summary|Overall|Finally|Ultimately|First|Second|Third|Next|Then|Lastly|Initially|The transition|The honest|The key|The main|The problem|The solution|Common pitfalls|Common mistakes|Key benefits|Key challenges|Microservices|Monoliths|This approach|This means|This is|When you|When it|If you|While this|Although|Despite)/i;

    const paragraphs: string[][] = [];
    let currentParagraph: string[] = [];

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      let shouldBreak = false;

      if (i > 0 && currentParagraph.length >= 2) {
        // Check for transition phrases
        if (transitionPattern.test(sentence)) {
          shouldBreak = true;
        }
        // Break if paragraph is getting too long (4+ sentences)
        if (!shouldBreak && currentParagraph.length >= 4) {
          shouldBreak = true;
        }
      }

      if (shouldBreak && currentParagraph.length > 0) {
        paragraphs.push(currentParagraph);
        currentParagraph = [];
      }

      currentParagraph.push(sentence);
    }

    if (currentParagraph.length > 0) {
      paragraphs.push(currentParagraph);
    }

    return paragraphs
      .map(p => `<p>${this.formatInlineText(p.join(' '))}</p>`)
      .join('\n');
  }
}
