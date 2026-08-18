import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-brand">
          <img src="favicon.svg" class="brand-logo" alt="BlogSpot">
        </div>
        <h1 class="auth-title">Sign in to BlogSpot</h1>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email or Username</mat-label>
            <input matInput formControlName="emailOrUsername" autocomplete="username">
            <mat-icon matPrefix>person</mat-icon>
            <mat-error *ngIf="loginForm.get('emailOrUsername')?.hasError('required')">
              Email or username is required
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Password</mat-label>
            <input matInput formControlName="password"
                   [type]="hidePassword ? 'password' : 'text'"
                   autocomplete="current-password">
            <mat-icon matPrefix>lock</mat-icon>
            <button mat-icon-button matSuffix type="button"
                    [attr.aria-label]="hidePassword ? 'Show password' : 'Hide password'"
                    (click)="hidePassword = !hidePassword">
              <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
              Password is required
            </mat-error>
          </mat-form-field>

          <button class="submit-btn" type="submit"
                  [disabled]="loginForm.invalid || isLoading">
            <span *ngIf="!isLoading">Sign in</span>
            <span *ngIf="isLoading">Signing in...</span>
          </button>
        </form>

        <div class="auth-footer">
          <span>Don't have an account?</span>
          <a routerLink="/auth/register" class="auth-link">Create account</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 56px);
      padding: 24px 16px;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
    }
    .auth-container::before,
    .auth-container::after {
      content: '';
      position: absolute;
      width: 420px;
      height: 420px;
      border-radius: 50%;
      filter: blur(90px);
      opacity: 0.25;
      z-index: 0;
      pointer-events: none;
    }
    .auth-container::before {
      background: var(--gradient-primary, linear-gradient(135deg, #6c5ce7, #a29bfe));
      top: -120px;
      left: -120px;
      animation: blobFloat1 14s ease-in-out infinite;
    }
    .auth-container::after {
      background: var(--gradient-accent, linear-gradient(135deg, #00cec9, #81ecec));
      bottom: -120px;
      right: -120px;
      animation: blobFloat2 16s ease-in-out infinite;
    }
    @keyframes blobFloat1 {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(40px, 30px) scale(1.1); }
    }
    @keyframes blobFloat2 {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(-30px, -40px) scale(1.15); }
    }
    .auth-card {
      width: 100%;
      max-width: 440px;
      padding: 32px;
      box-sizing: border-box;
      background: #fff;
      border-radius: 20px;
      border: 1px solid var(--color-border);
      position: relative;
      z-index: 1;
    }
    .auth-brand {
      display: flex;
      justify-content: center;
      margin-bottom: 24px;
    }
    .brand-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: var(--color-primary);
    }
    .brand-logo {
      width: 48px;
      height: 48px;
      border-radius: 50%;
    }
    .auth-title {
      font-size: 28px;
      font-weight: 800;
      color: var(--color-text-primary);
      text-align: center;
      margin: 0 0 28px;
      letter-spacing: -0.03em;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .submit-btn {
      width: 100%;
      height: 48px;
      border: none;
      border-radius: 24px;
      background: var(--gradient-primary);
      color: #fff;
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-bold);
      cursor: pointer;
      margin-top: 12px;
      transition: opacity 0.15s;
      font-family: inherit;
    }
    .submit-btn:hover:not(:disabled) { opacity: 0.85; }
    .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .auth-footer {
      display: flex;
      justify-content: center;
      gap: 6px;
      margin-top: 24px;
      font-size: var(--font-size-base);
      color: var(--color-text-secondary);
    }
    .auth-link {
      color: var(--color-primary);
      text-decoration: none;
      font-weight: var(--font-weight-semibold);
    }
    .auth-link:hover { text-decoration: underline; }
    @media (max-width: 480px) {
      .auth-card { padding: 24px 16px; border: none; border-radius: 0; }
      .auth-title { font-size: 24px; }
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      emailOrUsername: ['', [Validators.required]],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/feed';
        this.router.navigateByUrl(returnUrl);
        this.snackBar.open('Welcome back!', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(
          err.error?.message || err.error?.error || 'Login failed. Please check your credentials.',
          'Close',
          { duration: 5000 }
        );
      }
    });
  }
}
