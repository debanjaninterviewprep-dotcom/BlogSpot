import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-error-state',
  template: `
    <div class="error-state">
      <mat-icon>cloud_off</mat-icon>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <button mat-stroked-button color="primary" (click)="onRetry.emit()">
        <mat-icon>refresh</mat-icon> Try again
      </button>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .error-state {
      text-align: center;
      padding: 64px 24px;
      color: var(--color-text-secondary);
    }
    .error-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--color-danger);
      margin-bottom: 12px;
      opacity: 0.8;
    }
    .error-state h3 {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      margin: 0 0 4px;
    }
    .error-state p {
      font-size: var(--font-size-base);
      margin: 0 0 16px;
    }
  `]
})
export class ErrorStateComponent {
  @Input() title = 'Something went wrong';
  @Input() message = 'Failed to load. Please check your connection and try again.';
  @Output() onRetry = new EventEmitter<void>();
}
