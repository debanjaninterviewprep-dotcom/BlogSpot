import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '@core/services/auth.service';

function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const val = control.value as string;
  if (!val) return null;
  const errors: ValidationErrors = {};
  if (val.length < 8) errors['minlength'] = true;
  if (!/[A-Z]/.test(val)) errors['noUppercase'] = true;
  if (!/[a-z]/.test(val)) errors['noLowercase'] = true;
  if (!/\d/.test(val)) errors['noNumber'] = true;
  if (!/[@$!%*?&#]/.test(val)) errors['noSpecial'] = true;
  return Object.keys(errors).length ? errors : null;
}

@Component({
  selector: 'app-register',
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-brand">
          <mat-icon class="brand-icon">rss_feed</mat-icon>
        </div>
        <h1 class="auth-title">Create your account</h1>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Username</mat-label>
            <input matInput formControlName="userName" autocomplete="username">
            <mat-icon matPrefix>person</mat-icon>
            <mat-error *ngIf="registerForm.get('userName')?.hasError('required')">Username is required</mat-error>
            <mat-error *ngIf="registerForm.get('userName')?.hasError('minlength')">Minimum 3 characters</mat-error>
            <mat-error *ngIf="registerForm.get('userName')?.hasError('maxlength')">Maximum 50 characters</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Display Name (optional)</mat-label>
            <input matInput formControlName="displayName">
            <mat-icon matPrefix>badge</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email" autocomplete="email">
            <mat-icon matPrefix>email</mat-icon>
            <mat-error *ngIf="registerForm.get('email')?.hasError('required')">Email is required</mat-error>
            <mat-error *ngIf="registerForm.get('email')?.hasError('email')">Invalid email format</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Password</mat-label>
            <input matInput formControlName="password"
                   [type]="hidePassword ? 'password' : 'text'"
                   autocomplete="new-password">
            <mat-icon matPrefix>lock</mat-icon>
            <button mat-icon-button matSuffix type="button"
                    (click)="hidePassword = !hidePassword">
              <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-error *ngIf="registerForm.get('password')?.hasError('required')">Password is required</mat-error>
            <mat-error *ngIf="registerForm.get('password')?.invalid && !registerForm.get('password')?.hasError('required')">Password does not meet requirements</mat-error>
          </mat-form-field>

          <!-- Password strength indicator -->
          <div class="password-hints" *ngIf="registerForm.get('password')?.dirty">
            <span [class.met]="!registerForm.get('password')?.hasError('minlength')">
              <mat-icon>{{ !registerForm.get('password')?.hasError('minlength') ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
              8+ chars
            </span>
            <span [class.met]="!registerForm.get('password')?.hasError('noUppercase')">
              <mat-icon>{{ !registerForm.get('password')?.hasError('noUppercase') ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
              Uppercase
            </span>
            <span [class.met]="!registerForm.get('password')?.hasError('noLowercase')">
              <mat-icon>{{ !registerForm.get('password')?.hasError('noLowercase') ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
              Lowercase
            </span>
            <span [class.met]="!registerForm.get('password')?.hasError('noNumber')">
              <mat-icon>{{ !registerForm.get('password')?.hasError('noNumber') ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
              Number
            </span>
            <span [class.met]="!registerForm.get('password')?.hasError('noSpecial')">
              <mat-icon>{{ !registerForm.get('password')?.hasError('noSpecial') ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
              Special char
            </span>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Confirm Password</mat-label>
            <input matInput formControlName="confirmPassword" type="password"
                   autocomplete="new-password">
            <mat-icon matPrefix>lock_outline</mat-icon>
            <mat-error *ngIf="registerForm.get('confirmPassword')?.hasError('required')">Please confirm your password</mat-error>
            <mat-error *ngIf="registerForm.hasError('passwordMismatch') && registerForm.get('confirmPassword')?.touched">Passwords do not match</mat-error>
          </mat-form-field>

          <button class="submit-btn" type="submit"
                  [disabled]="registerForm.invalid || isLoading">
            <span *ngIf="!isLoading">Create account</span>
            <span *ngIf="isLoading">Creating account...</span>
          </button>
        </form>

        <div class="auth-footer">
          <span>Already have an account?</span>
          <a routerLink="/auth/login" class="auth-link">Sign in</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: calc(100vh - 56px);
      padding: 32px 16px;
      box-sizing: border-box;
    }
    .auth-card {
      width: 100%;
      max-width: 480px;
      padding: 32px;
      box-sizing: border-box;
      background: #fff;
      border-radius: 20px;
      border: 1px solid #eff3f4;
    }
    .auth-brand {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
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
      margin: 0 0 24px;
      letter-spacing: -0.03em;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 2px;
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
    .password-hints {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: -2px 0 8px;
      font-size: 12px;
    }
    .password-hints span {
      display: flex;
      align-items: center;
      gap: 3px;
      color: #536471;
      transition: color 0.2s;
    }
    .password-hints span mat-icon {
      font-size: 15px;
      width: 15px;
      height: 15px;
    }
    .password-hints span.met { color: #00ba7c; }
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
      .auth-container { padding: 16px; }
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  hidePassword = true;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      displayName: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, passwordStrengthValidator]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const pw = group.get('password')?.value;
    const cpw = group.get('confirmPassword')?.value;
    return pw && cpw && pw !== cpw ? { passwordMismatch: true } : null;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.isLoading = true;
    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.router.navigate(['/feed']);
        this.snackBar.open('Welcome to BlogSpot!', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(
          err.error?.message || 'Registration failed. Please try again.',
          'Close',
          { duration: 5000 }
        );
      }
    });
  }
}
