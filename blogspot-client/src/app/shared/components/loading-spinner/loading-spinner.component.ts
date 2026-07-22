import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  template: `
    <ng-container *ngIf="inline; else fullOverlay">
      <div class="spinner-inline">
        <div class="ring-inline"></div>
      </div>
    </ng-container>
    <ng-template #fullOverlay>
      <div class="spinner-overlay">
        <div class="spinner-backdrop"></div>
        <div class="spinner-content">
          <div class="ring-full"></div>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    /* Inline (load-more) spinner */
    .spinner-inline {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 32px;
    }
    .ring-inline {
      width: 36px; height: 36px;
      border: 3px solid rgba(29, 155, 240, 0.2);
      border-top-color: #1d9bf0;
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
