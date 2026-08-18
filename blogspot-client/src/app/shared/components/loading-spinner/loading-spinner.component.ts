import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  template: `
    <ng-container *ngIf="inline; else fullOverlay">
      <div class="spinner-inline" role="status" aria-live="polite">
        <div class="ring-inline"></div>
        <span class="sr-only">Loading...</span>
      </div>
    </ng-container>
    <ng-template #fullOverlay>
      <div class="spinner-overlay" role="status" aria-live="polite">
        <div class="spinner-backdrop"></div>
        <div class="spinner-content">
          <div class="ring-full"></div>
          <span class="sr-only">Loading...</span>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    :host { display: block; }
    .sr-only {
      position: absolute;
      width: 1px; height: 1px;
      padding: 0; margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    /* Inline (load-more) spinner */
    .spinner-inline {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 32px;
    }
    .ring-inline {
      width: 36px; height: 36px;
      border: 3px solid var(--color-primary-light);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.75s ease-in-out infinite;
    }
    /* Full-page blur overlay */
    .spinner-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .spinner-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.38);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
    }
    .spinner-content {
      position: relative;
      z-index: 1;
    }
    .ring-full {
      width: 56px; height: 56px;
      border: 5px solid rgba(255, 255, 255, 0.25);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.75s ease-in-out infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class LoadingSpinnerComponent {
  @Input() inline = false;
}
