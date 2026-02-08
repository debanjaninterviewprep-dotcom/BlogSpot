import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeSubject = new BehaviorSubject<Theme>(this.getStoredTheme());
  public theme$ = this.themeSubject.asObservable();

  get currentTheme(): Theme {
    return this.themeSubject.value;
  }

  get isDark(): boolean {
    return this.currentTheme === 'dark';
  }

  toggleTheme(): void {
    const newTheme: Theme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  setTheme(theme: Theme): void {
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${theme}-theme`);
    localStorage.setItem('blogspot-theme', theme);
    this.themeSubject.next(theme);
  }

  private getStoredTheme(): Theme {
    const stored = localStorage.getItem('blogspot-theme');
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    // Respect system preference
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  init(): void {
    this.setTheme(this.currentTheme);
  }
}
