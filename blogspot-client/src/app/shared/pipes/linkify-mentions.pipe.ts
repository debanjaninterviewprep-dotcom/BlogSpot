import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { linkifyMentions } from '../utils/mention.util';

/**
 * Escapes plain-text content (comments/replies) then converts @username tokens into profile links.
 * Usage: <p [innerHTML]="comment.content | linkifyMentions"></p>
 */
@Pipe({
  name: 'linkifyMentions'
})
export class LinkifyMentionsPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {}

  transform(content: string | null | undefined): SafeHtml {
    if (!content) return '';

    const escaped = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    return this.sanitizer.bypassSecurityTrustHtml(linkifyMentions(escaped));
  }
}
