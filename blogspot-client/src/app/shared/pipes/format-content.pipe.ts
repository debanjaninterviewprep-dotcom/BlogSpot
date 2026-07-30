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
}
