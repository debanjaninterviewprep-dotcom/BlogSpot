import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { UserService } from '@core/services/user.service';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-profile-edit',
  template: `
    <div class="edit-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Edit Profile</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <!-- Cover Photo -->
          <div class="cover-section">
            <div class="cover-preview" [style.backgroundImage]="coverPreviewUrl ? 'url(' + coverPreviewUrl + ')' : ''">
              <button mat-mini-fab color="primary" (click)="coverInput.click()">
                <mat-icon>photo_camera</mat-icon>
              </button>
            </div>
            <input #coverInput type="file" accept="image/*" hidden (change)="onCoverSelected($event)">
          </div>

          <!-- Avatar -->
          <div class="avatar-section">
            <img [src]="previewUrl || 'assets/default-avatar.svg'" class="avatar-preview">
            <button mat-stroked-button (click)="fileInput.click()">
              <mat-icon>photo_camera</mat-icon>
              Change Photo
            </button>
            <input #fileInput type="file" accept="image/*" hidden (change)="onFileSelected($event)">
          </div>

          <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Display Name</mat-label>
              <input matInput formControlName="displayName">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Bio</mat-label>
              <textarea matInput formControlName="bio" rows="4" maxlength="1000"></textarea>
              <mat-hint>{{ profileForm.get('bio')?.value?.length || 0 }}/1000</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Website</mat-label>
              <input matInput formControlName="website">
              <mat-icon matPrefix>link</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Location</mat-label>
              <input matInput formControlName="location">
              <mat-icon matPrefix>location_on</mat-icon>
            </mat-form-field>

            <!-- Skills -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Skills</mat-label>
              <mat-chip-grid #skillChipGrid>
                <mat-chip-row *ngFor="let skill of skills" (removed)="removeSkill(skill)">
                  {{ skill }}
                  <button matChipRemove><mat-icon>cancel</mat-icon></button>
                </mat-chip-row>
              </mat-chip-grid>
              <input matInput placeholder="Add a skill..."
                     [matChipInputFor]="skillChipGrid"
                     [matChipInputSeparatorKeyCodes]="separatorKeyCodes"
                     (matChipInputTokenEnd)="addSkill($event)">
              <mat-hint>Press Enter or comma to add</mat-hint>
            </mat-form-field>

            <!-- Social Links -->
            <h3 class="section-title">Social Links</h3>
            <div formGroupName="socialLinks">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>GitHub URL</mat-label>
                <input matInput formControlName="github" placeholder="https://github.com/username">
                <mat-icon matPrefix>code</mat-icon>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Twitter URL</mat-label>
                <input matInput formControlName="twitter" placeholder="https://twitter.com/username">
                <mat-icon matPrefix>tag</mat-icon>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>LinkedIn URL</mat-label>
                <input matInput formControlName="linkedin" placeholder="https://linkedin.com/in/username">
                <mat-icon matPrefix>work</mat-icon>
              </mat-form-field>
            </div>

            <div class="actions">
              <button mat-button type="button" routerLink="/profile/me">Cancel</button>
              <button mat-raised-button color="primary" type="submit" 
                      [disabled]="profileForm.invalid || isLoading">
                Save Changes
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .edit-container { max-width: 600px; margin: 0 auto; }
    mat-card { padding: 24px; }
    .cover-section { margin-bottom: 16px; }
    .cover-preview {
      height: 150px;
      background: linear-gradient(135deg, #3f51b5, #7986cb);
      background-size: cover;
      background-position: center;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .avatar-section { display: flex; align-items: center; gap: 16px; margin: 16px 0 24px; }
    .avatar-preview { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; }
    form { display: flex; flex-direction: column; gap: 8px; }
    .section-title { margin: 16px 0 8px; font-size: 16px; color: #555; }
    .actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
  `]
})
export class ProfileEditComponent implements OnInit {
  profileForm: FormGroup;
  previewUrl: string | null = null;
  coverPreviewUrl: string | null = null;
  selectedFile: File | null = null;
  selectedCoverFile: File | null = null;
  isLoading = false;
  skills: string[] = [];
  readonly separatorKeyCodes = [ENTER, COMMA] as const;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.profileForm = this.fb.group({
      displayName: ['', Validators.maxLength(100)],
      bio: ['', Validators.maxLength(1000)],
      website: ['', Validators.maxLength(200)],
      location: ['', Validators.maxLength(100)],
      socialLinks: this.fb.group({
        github: [''],
        twitter: [''],
        linkedin: ['']
      })
    });
  }

  ngOnInit(): void {
    if (this.authService.currentUser) {
      this.userService.getProfile(this.authService.currentUser.id).subscribe({
        next: (profile) => {
          this.profileForm.patchValue({
            displayName: profile.displayName,
            bio: profile.bio,
            website: profile.website,
            location: profile.location,
            socialLinks: profile.socialLinks || {}
          });
          this.previewUrl = profile.profilePictureUrl || null;
          this.coverPreviewUrl = profile.coverPhotoUrl || null;
          this.skills = profile.skills || [];
        }
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => this.previewUrl = reader.result as string;
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onCoverSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedCoverFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => this.coverPreviewUrl = reader.result as string;
      reader.readAsDataURL(this.selectedCoverFile);
    }
  }

  addSkill(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.skills.includes(value)) {
      this.skills.push(value);
    }
    event.chipInput!.clear();
  }

  removeSkill(skill: string): void {
    this.skills = this.skills.filter(s => s !== skill);
  }

  onSubmit(): void {
    if (this.profileForm.invalid) return;
    this.isLoading = true;

    // Upload pictures first if selected
    const uploads: Promise<void>[] = [];

    if (this.selectedFile) {
      uploads.push(new Promise((resolve, reject) => {
        this.userService.updateProfilePicture(this.selectedFile!).subscribe({
          next: () => resolve(),
          error: () => reject('Failed to upload profile picture')
        });
      }));
    }

    if (this.selectedCoverFile) {
      uploads.push(new Promise((resolve, reject) => {
        this.userService.updateCoverPhoto(this.selectedCoverFile!).subscribe({
          next: () => resolve(),
          error: () => reject('Failed to upload cover photo')
        });
      }));
    }

    Promise.all(uploads)
      .then(() => this.saveProfile())
      .catch((msg) => {
        this.isLoading = false;
        this.snackBar.open(msg, 'Close', { duration: 3000 });
      });
  }

  private saveProfile(): void {
    const formValue = this.profileForm.value;
    const payload = {
      ...formValue,
      socialLinks: JSON.stringify(formValue.socialLinks),
      skills: this.skills.join(',')
    };

    this.userService.updateProfile(payload).subscribe({
      next: () => {
        this.snackBar.open('Profile updated!', 'Close', { duration: 3000 });
        this.router.navigate(['/profile/me']);
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(err.error?.message || 'Failed to update profile', 'Close', { duration: 3000 });
      }
    });
  }
}
