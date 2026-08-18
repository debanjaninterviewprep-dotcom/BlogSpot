import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, timeout, retry } from 'rxjs';

export interface GrammarMatch {
  message: string;
  offset: number;
  length: number;
  context: string;
  replacements: string[];
  rule: string;
}

interface LanguageToolResponse {
  matches: Array<{
    message: string;
    offset: number;
    length: number;
    context: {
      text: string;
      offset: number;
      length: number;
    };
    replacements: Array<{ value: string }>;
    rule: {
      id: string;
      description: string;
      category: { id: string; name: string };
    };
  }>;
}

/**
 * Grammar checking service using LanguageTool's free public API.
 * No API key needed for basic usage (rate-limited).
 * https://languagetool.org/http-api/
 */
@Injectable({
  providedIn: 'root'
})
export class GrammarService {
  private readonly apiUrl = 'https://api.languagetool.org/v2/check';

  constructor(private http: HttpClient) {}

  /**
   * Check grammar of the given text/HTML content.
   * Strips HTML before sending to API.
   */
  checkGrammar(content: string, language: string = 'en-US'): Observable<GrammarMatch[]> {
    const plainText = this.stripHtml(content);

    // HttpParams handles special-character encoding correctly (URLSearchParams does not)
    const body = new HttpParams()
      .set('text', plainText)
      .set('language', language)
      .set('enabledOnly', 'false');

    return this.http.post<LanguageToolResponse>(this.apiUrl, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).pipe(
      timeout(15000),
      retry({ count: 1, delay: 2000 }),
      map(response => this.mapMatches(response, plainText))
    );
  }

  private mapMatches(response: LanguageToolResponse, text: string): GrammarMatch[] {
    return response.matches.map(match => {
      // Extract context around the error (up to 40 chars before/after)
      const start = Math.max(0, match.offset - 20);
      const end = Math.min(text.length, match.offset + match.length + 20);
      const context = text.substring(start, end);

      return {
        message: match.message,
        offset: match.offset,
        length: match.length,
        context,
        replacements: match.replacements.map(r => r.value).slice(0, 5),
        rule: match.rule.id
      };
    });
  }

  private stripHtml(html: string): string {
    // Create a temporary element to parse HTML and extract text
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }
}
