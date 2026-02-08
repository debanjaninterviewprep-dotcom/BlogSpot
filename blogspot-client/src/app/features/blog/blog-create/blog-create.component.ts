import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { BlogService } from '@core/services/blog.service';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';

@Component({
  selector: 'app-blog-create',
  template: `
    <div class="create-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ isEditing ? 'Edit Post' : 'Create New Post' }}</mat-card-title>
          <span class="spacer"></span>
          <span class="autosave-status" *ngIf="autoSaveStatus">{{ autoSaveStatus }}</span>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="postForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Title</mat-label>
              <input matInput formControlName="title" placeholder="Enter your post title">
              <mat-error>Title must be 5-200 characters</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Summary (optional)</mat-label>
              <textarea matInput formControlName="summary" rows="2"
                        placeholder="Brief summary of your post"></textarea>
              <mat-hint>Max 500 characters</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Category</mat-label>
              <mat-select formControlName="category">
                <mat-option value="">None</mat-option>
                <mat-option *ngFor="let cat of categories" [value]="cat">{{ cat }}</mat-option>
              </mat-select>
            </mat-form-field>

            <!-- Tags -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Tags</mat-label>
              <mat-chip-grid #chipGrid>
                <mat-chip-row *ngFor="let tag of tags" (removed)="removeTag(tag)">
                  {{ tag }}
                  <mat-icon matChipRemove>cancel</mat-icon>
                </mat-chip-row>
                <input placeholder="Add a tag..."
                       [matChipInputFor]="chipGrid"
                       [matChipInputSeparatorKeyCodes]="separatorKeyCodes"
                       (matChipInputTokenEnd)="addTag($event)">
              </mat-chip-grid>
              <mat-hint>Press Enter or comma to add</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Content</mat-label>
              <textarea matInput formControlName="content" rows="15"
                        placeholder="Write your blog post content here... (supports rich text)"></textarea>
              <mat-error>Content must be at least 20 characters</mat-error>
            </mat-form-field>

            <div class="actions">
              <button mat-button type="button" (click)="cancel()">Cancel</button>
              <button mat-stroked-button type="button" (click)="saveDraft()"
                      [disabled]="isLoading" *ngIf="!isEditing">
                <mat-icon>save</mat-icon> Save as Draft
              </button>
              <button mat-raised-button color="primary" type="submit" 
                      [disabled]="postForm.invalid || isLoading">
                <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
                {{ isEditing ? 'Update Post' : 'Publish Post' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .create-container {
      max-width: 800px;
      margin: 0 auto;
    }
    mat-card { padding: 24px; }
    mat-card-header {
      display: flex;
      align-items: center;
    }
    .spacer { flex: 1; }
    .autosave-status {
      font-size: 12px;
      color: #888;
      font-style: italic;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 16px;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 16px;
    }
  `]
})
export class BlogCreateComponent implements OnInit, OnDestroy {
  postForm: FormGroup;
  isEditing = false;
  editPostId: string | null = null;
  isLoading = false;
  tags: string[] = [];
  autoSaveStatus = '';
  separatorKeyCodes = [ENTER, COMMA];
  private destroy$ = new Subject<void>();
  private draftId: string | null = null;

  categories = [
    'Technology', 'Programming', 'Design', 'Science',
    'Business', 'Lifestyle', 'Travel', 'Health',
    'Education', 'Entertainment', 'Sports', 'Other'
  ];

  constructor(
    private fb: FormBuilder,
    private blogService: BlogService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.postForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      summary: ['', Validators.maxLength(500)],
      content: ['', [Validators.required, Validators.minLength(20)]],
      category: ['']
    });
  }

  ngOnInit(): void {
    this.editPostId = this.route.snapshot.paramMap.get('id');
    if (this.editPostId) {
      this.isEditing = true;
      this.loadPost(this.editPostId);
    } else {
      // Auto-save draft every 30 seconds
      this.postForm.valueChanges
        .pipe(debounceTime(30000), takeUntil(this.destroy$))
        .subscribe(() => this.autoSaveDraft());
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPost(id: string): void {
    this.blogService.getPostById(id).subscribe({
      next: (post) => {
        this.postForm.patchValue({
          title: post.title,
          summary: post.summary,
          content: post.content,
          category: post.category || ''
        });
        this.tags = post.tags || [];
      },
      error: () => {
        this.snackBar.open('Failed to load post', 'Close', { duration: 3000 });
        this.router.navigate(['/feed']);
      }
    });
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.tags.includes(value) && this.tags.length < 10) {
      this.tags.push(value);
    }
    event.chipInput!.clear();
  }

  removeTag(tag: string): void {
    this.tags = this.tags.filter(t => t !== tag);
  }

  saveDraft(): void {
    const val = this.postForm.value;
    this.blogService.saveDraft({
      id: this.draftId || undefined,
      title: val.title || 'Untitled Draft',
      content: val.content || '',
      summary: val.summary,
      category: val.category,
      tags: this.tags
    }).subscribe({
      next: (draft) => {
        this.draftId = draft.id;
        this.snackBar.open('Draft saved!', 'Close', { duration: 2000 });
      },
      error: () => this.snackBar.open('Failed to save draft', 'Close', { duration: 3000 })
    });
  }

  private autoSaveDraft(): void {
    const val = this.postForm.value;
    if (!val.title && !val.content) return;

    this.autoSaveStatus = 'Saving...';
    this.blogService.saveDraft({
      id: this.draftId || undefined,
      title: val.title || 'Untitled Draft',
      content: val.content || '',
      summary: val.summary,
      category: val.category,
      tags: this.tags
    }).subscribe({
      next: (draft) => {
        this.draftId = draft.id;
        this.autoSaveStatus = 'Draft saved';
        setTimeout(() => this.autoSaveStatus = '', 3000);
      },
      error: () => {
        this.autoSaveStatus = 'Save failed';
        setTimeout(() => this.autoSaveStatus = '', 3000);
      }
    });
  }

  onSubmit(): void {
    if (this.postForm.invalid) return;

    this.isLoading = true;
    const formVal = this.postForm.value;
    const payload = { ...formVal, tags: this.tags, isDraft: false };

    const request = this.isEditing
      ? this.blogService.updatePost(this.editPostId!, payload)
      : this.blogService.createPost(payload);

    request.subscribe({
      next: (post) => {
        // Delete draft if we had one
        if (this.draftId) {
          this.blogService.deleteDraft(this.draftId).subscribe();
        }
        this.snackBar.open(
          this.isEditing ? 'Post updated!' : 'Post published!',
          'Close',
          { duration: 3000 }
        );
        this.router.navigate(['/blog', post.slug]);
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(
          err.error?.message || 'Failed to save post',
          'Close',
          { duration: 5000 }
        );
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/feed']);
  }
}
