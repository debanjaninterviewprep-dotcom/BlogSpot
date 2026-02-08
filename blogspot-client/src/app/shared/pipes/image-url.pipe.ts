import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Resolves relative image URLs (e.g. /uploads/images/abc.jpg)
 * to absolute URLs pointing to the backend API server.
 * 
 * Usage: [src]="imageUrl | imageUrl"
 *        or: 'url(' + (coverUrl | imageUrl) + ')'
 */
@Pipe({
  name: 'imageUrl'
})
export class ImageUrlPipe implements PipeTransform {
  private baseUrl: string;

  constructor() {
    // Extract base URL from apiUrl by removing '/api' suffix
    this.baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
  }

  transform(url: string | null | undefined): string {
    if (!url) {
      return '';
    }

    // Already an absolute URL (http/https/data/blob) — return as-is
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }

    // Relative path like /uploads/images/abc.jpg — prepend backend base URL
    return `${this.baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }
}
