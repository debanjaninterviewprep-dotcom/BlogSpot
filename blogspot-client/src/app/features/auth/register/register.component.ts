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
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>Create Account</mat-card-title>
          <mat-card-subtitle>Join the BlogSpot community</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Username*</mat-label>
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
              <mat-label>Email*</mat-label>
              <input matInput formControlName="email" type="email" autocomplete="email">
              <mat-icon matPrefix>email</mat-icon>
              <mat-error *ngIf="registerForm.get('email')?.hasError('required')">Email is required</mat-error>
              <mat-error *ngIf="registerForm.get('email')?.hasError('email')">Invalid email format</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password*</mat-label>
              <input matInput formControlName="password"
                     [type]="hidePassword ? 'password' : 'text'"
                     autocomplete="new-password">
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix type="button"
                      (click)="hidePassword = !hidePassword">
                <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="registerForm.get('password')?.hasError('required')">Password is required</mat-error>
              <mat-error *ngIf="registerForm.get('password')?.hasError('minlength')">Minimum 8 characters</mat-error>
              <mat-error *ngIf="registerForm.get('password')?.hasError('noUppercase')">Add an uppercase letter</mat-error>
              <mat-error *ngIf="registerForm.get('password')?.hasError('noLowercase')">Add a lowercase letter</mat-error>
              <mat-error *ngIf="registerForm.get('password')?.hasError('noNumber')">Add a number</mat-error>
              <mat-error *ngIf="registerForm.get('password')?.hasError('noSpecial')">Add a special character (&#64;$!%*?&amp;#)</mat-error>
            </mat-form-field>

            <!-- Password strength indicator -->
            <div class="password-hints" *ngIf="registerForm.get('password')?.dirty">
              <span [class.met]="!registerForm.get('password')?.hasError('minlength')">âœ“ 8+ characters</span>
              <span [class.met]="!registerForm.get('password')?.hasError('noUppercase')">âœ“ Uppercase</span>
              <span [class.met]="!registerForm.get('password')?.hasError('noLowercase')">âœ“ Lowercase</span>
              <span [class.met]="!registerForm.get('password')?.hasError('noNumber')">âœ“ Number</span>
              <span [class.met]="!registerForm.get('password')?.hasError('noSpecial')">âœ“ Special char</span>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirm Password*</mat-label>
              <input matInput formControlName="confirmPassword" type="password"
                     autocomplete="new-password">
              <mat-icon matPrefix>lock_outline</mat-icon>
              <mat-error *ngIf="registerForm.get('confirmPassword')?.hasError('required')">Please confirm your password</mat-error>
              <mat-error *ngIf="registerForm.hasError('passwordMismatch') && registerForm.get('confirmPassword')?.touched">Passwords do not match</mat-error>
            </mat-form-field>

            <button mat-raised-button color="primary" class="full-width submit-btn"
                    type="submit" [disabled]="registerForm.invalid || isLoading">
              <mat-icon *ngIf="!isLoading">person_add</mat-icon>
              <span *ngIf="!isLoading">Register</span>
              <span *ngIf="isLoading">Creating account...</span>
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions align="end">
          <span>Already have an account?</span>
          <a mat-button color="primary" routerLink="/auth/login">Sign In</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: calc(100vh - 64px);
      padding: 24px 16px;
      box-sizing: border-box;
    }
    .auth-card {
      width: 100%;
      max-width: 480px;
      padding: 24px;
      box-sizing: border-box;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 16px;
    }
    .submit-btn { height: 44px; margin-top: 8px; }
    .password-hints {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: -4px 0 8px;
      font-size: 12px;
    }
    .password-hints span { color: #aaa; transition: color 0.2s; }
    .password-hints span.met { color: #4caf50; }
    @media (max-width: 480px) {
      .auth-card { padding: 16px; }
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
    const { confirmPassword, ...payload } = this.registerForm.value;
    this.authService.register(payload).subscribe({
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
