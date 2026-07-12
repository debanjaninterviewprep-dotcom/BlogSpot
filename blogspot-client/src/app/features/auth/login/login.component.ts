import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>Welcome Back</mat-card-title>
          <mat-card-subtitle>Sign in to your account</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
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

            <button mat-raised-button color="primary" class="full-width submit-btn"
                    type="submit" [disabled]="loginForm.invalid || isLoading">
              <mat-icon *ngIf="!isLoading">login</mat-icon>
              <span *ngIf="!isLoading">Sign In</span>
              <span *ngIf="isLoading">Signing in...</span>
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions align="end">
          <span>Don't have an account?</span>
          <a mat-button color="primary" routerLink="/auth/register">Register</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 64px);
      padding: 16px;
      box-sizing: border-box;
    }
    .auth-card {
      width: 100%;
      max-width: 440px;
      padding: 24px;
      box-sizing: border-box;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 16px;
    }
    .submit-btn { height: 44px; margin-top: 8px; }
    @media (max-width: 480px) {
      .auth-card { padding: 16px; }
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
