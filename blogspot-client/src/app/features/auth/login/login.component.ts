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
          <mat-icon class="brand-icon">rss_feed</mat-icon>
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
    }
    .auth-card {
      width: 100%;
      max-width: 440px;
      padding: 32px;
      box-sizing: border-box;
      background: #fff;
      border-radius: 20px;
      border: 1px solid #eff3f4;
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
      color: #1d9bf0;
    }
    .auth-title {
      font-size: 28px;
      font-weight: 800;
      color: #0f1419;
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
      background: #0f1419;
      color: #fff;
      font-size: 15px;
      font-weight: 700;
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
      font-size: 14px;
      color: #536471;
    }
    .auth-link {
      color: #1d9bf0;
      text-decoration: none;
      font-weight: 600;
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
          err.error?.message || 'Login failed. Please check your credentials.',
          'Close',
          { duration: 5000 }
        );
      }
    });
  }
}
