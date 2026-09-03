import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { BlogService } from '@core/services/blog.service';
import { GrammarService, GrammarMatch } from '@core/services/grammar.service';
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

            <!-- Rich Text Editor -->
            <div class="editor-section">
              <label class="editor-label">Content</label>
              <quill-editor
                formControlName="content"
                [modules]="quillModules"
                [styles]="{ height: '350px' }"
                placeholder="Write your blog post content here..."
                (onContentChanged)="onContentChanged($event)">
              </quill-editor>
              <mat-error *ngIf="postForm.get('content')?.touched && postForm.get('content')?.hasError('required')">
                Content is required
              </mat-error>
              <mat-error *ngIf="postForm.get('content')?.touched && postForm.get('content')?.hasError('minlength')">
                Content must be at least 20 characters
              </mat-error>
            </div>

            <!-- Grammar Check -->
            <div class="grammar-section">
              <button mat-stroked-button type="button" color="accent"
                      (click)="checkGrammar()" [disabled]="grammarChecking">
                <mat-icon>spellcheck</mat-icon>
                {{ grammarChecking ? 'Checking...' : 'Check Grammar' }}
                <mat-spinner *ngIf="grammarChecking" diameter="16" class="inline-spinner"></mat-spinner>
              </button>
              <span class="grammar-status" *ngIf="grammarResult !== null">
                <mat-icon [color]="grammarIssues.length === 0 ? 'primary' : 'warn'">
                  {{ grammarIssues.length === 0 ? 'check_circle' : 'warning' }}
                </mat-icon>
                {{ grammarIssues.length === 0 ? 'No issues found!' : grammarIssues.length + ' issue(s) found' }}
              </span>
            </div>

            <!-- Grammar Issues List -->
            <div class="grammar-issues" *ngIf="grammarIssues.length > 0">
              <div class="grammar-issue" *ngFor="let issue of grammarIssues; let i = index">
                <div class="issue-header">
                  <mat-icon color="warn" class="issue-icon">error_outline</mat-icon>
                  <span class="issue-message">{{ issue.message }}</span>
                </div>
                <div class="issue-context">
                  <span class="issue-text">"...{{ issue.context }}..."</span>
                </div>
                <div class="issue-replacements" *ngIf="issue.replacements.length > 0">
                  <span class="suggestion-label">Suggestions:</span>
                  <button mat-stroked-button class="suggestion-btn"
                          *ngFor="let replacement of issue.replacements.slice(0, 3)"
                          (click)="applyGrammarFix(issue, replacement)">
                    {{ replacement }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Publishing Options -->
            <div class="publish-section">
              <label class="section-label">Publishing Options</label>
              <mat-radio-group [(ngModel)]="publishMode" [ngModelOptions]="{ standalone: true }" (change)="setMinScheduleDate()">
                <mat-radio-button value="now">
                  <mat-icon>publish</mat-icon>
                  <span>{{ isEditing ? 'Update Post' : 'Publish Now' }}</span>
                </mat-radio-button>
                <mat-radio-button value="later">
                  <mat-icon>schedule</mat-icon>
                  <span>Schedule for Later</span>
                </mat-radio-button>
              </mat-radio-group>

              <!-- Scheduled Publish Date/Time -->
              <div class="schedule-datetime" *ngIf="publishMode === 'later'">
                <mat-form-field appearance="outline" class="schedule-field">
                  <mat-label>Publish date</mat-label>
                  <input matInput readonly [matDatepicker]="picker" [min]="minDate"
                         formControlName="scheduleDate" (click)="picker.open()" required>
                  <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                  <mat-error *ngIf="postForm.get('scheduleDate')?.hasError('required')">
                    Please select a date
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="schedule-field">
                  <mat-label>Publish time</mat-label>
                  <input matInput type="time" formControlName="scheduleTime" required>
                  <mat-icon matSuffix>schedule</mat-icon>
                  <mat-error *ngIf="postForm.get('scheduleTime')?.hasError('required')">
                    Please select a time
                  </mat-error>
                </mat-form-field>

                <p class="schedule-hint">
                  <mat-icon>info</mat-icon>
                  You can schedule a post at least 1 hour ahead — not in the past or sooner. It will be published automatically at the selected time.
                </p>
              </div>
            </div>

            <div class="actions">
              <button mat-button type="button" (click)="cancel()">Cancel</button>
              <button mat-stroked-button type="button" color="accent"
                      *ngIf="!isEditing" (click)="saveDraft()" [disabled]="isLoading">
                <mat-icon>save</mat-icon>
                Save Draft
              </button>
              <button mat-raised-button color="primary" type="submit" 
                      [disabled]="postForm.invalid || isLoading">
                <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
                {{ isEditing ? 'Update Post' : (publishMode === 'later' ? 'Schedule Post' : 'Publish Post') }}
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
      min-height: calc(100vh - 56px);
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
    .editor-section {
      margin: 8px 0 16px;
    }
    .editor-label {
      display: block;
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
      margin-bottom: 4px;
      font-weight: var(--font-weight-medium);
    }
    .grammar-section {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 8px 0;
    }
    .grammar-status {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
    }
    .inline-spinner {
      display: inline-block;
      margin-left: 8px;
    }
    .grammar-issues {
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 12px;
      max-height: 250px;
      overflow-y: auto;
      background: var(--color-bg-secondary);
    }
    .grammar-issue {
      padding: 10px 0;
      border-bottom: 1px solid var(--color-border);
    }
    .grammar-issue:last-child { border-bottom: none; }
    .issue-header {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    .issue-icon { font-size: 18px; width: 18px; height: 18px; margin-top: 2px; }
    .issue-message { font-size: 14px; font-weight: 500; }
    .issue-context {
      margin: 4px 0 4px 26px;
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }
    .issue-text {
      background: #fff3cd;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .issue-replacements {
      margin: 6px 0 0 26px;
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .suggestion-label { font-size: var(--font-size-xs); color: var(--color-text-secondary); }
    .suggestion-btn {
      font-size: 12px !important;
      padding: 2px 8px !important;
      min-height: 24px !important;
      line-height: 24px !important;
      color: var(--color-primary);
    }
    .publish-section {
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 16px;
      background: var(--color-bg-secondary);
      margin: 16px 0;
    }
    .section-label {
      display: block;
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
      margin-bottom: 12px;
      font-weight: var(--font-weight-medium);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    mat-radio-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    mat-radio-button {
      display: flex !important;
      align-items: center;
      gap: 8px;
    }
    mat-radio-button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .schedule-datetime {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--color-border);
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: flex-start;
    }
    .schedule-field {
      flex: 1 1 200px;
      min-width: 180px;
    }
    .schedule-hint {
      flex-basis: 100%;
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0;
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
    }
    .schedule-hint mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
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

  // Grammar check
  grammarChecking = false;
  grammarResult: boolean | null = null;
  grammarIssues: GrammarMatch[] = [];

  // Quill editor config
  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }, { 'header': 3 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ]
  };

  categories = [
    'Technology', 'Programming', 'Design', 'Science',
    'Business', 'Lifestyle', 'Travel', 'Health',
    'Education', 'Entertainment', 'Sports', 'Other'
  ];

  // Scheduling
  publishMode: 'now' | 'later' = 'now';
  minDate: Date = new Date();

  constructor(
    private fb: FormBuilder,
    private blogService: BlogService,
    private grammarService: GrammarService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.postForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      summary: ['', Validators.maxLength(500)],
      content: ['', [Validators.required, Validators.minLength(20)]],
      category: [''],
      scheduleDate: [null], // Calendar date for scheduled posts
      scheduleTime: ['']    // Time of day for scheduled posts
    });
    // Set minimum schedule date to today
    this.setMinScheduleDate();
  }

  setMinScheduleDate(): void {
    this.minDate = new Date();
  }

  ngOnInit(): void {
    this.editPostId = this.route.snapshot.paramMap.get('id');
    const draftIdParam = this.route.snapshot.queryParamMap.get('draftId');

    if (this.editPostId) {
      this.isEditing = true;
      this.loadPost(this.editPostId);
    } else if (draftIdParam) {
      this.loadDraft(draftIdParam);
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
        if (post.scheduledPublishAt) {
          const dt = new Date(post.scheduledPublishAt);
          this.postForm.patchValue({
            scheduleDate: dt,
            scheduleTime: this.toTimeString(dt)
          });
        }
        this.tags = post.tags || [];
        // Set publish mode based on post status
        if (post.status === 1) this.publishMode = 'later';
        else this.publishMode = 'now';
      },
      error: () => {
        this.snackBar.open('Failed to load post', 'Close', { duration: 3000 });
        this.router.navigate(['/feed']);
      }
    });
  }

  loadDraft(id: string): void {
    this.blogService.getDraftById(id).subscribe({
      next: (draft) => {
        this.draftId = draft.id;
        this.postForm.patchValue({
          title: draft.title,
          summary: draft.summary || '',
          content: draft.content,
          category: draft.category || ''
        });
        this.tags = draft.tags || [];
        // Enable auto-save for the loaded draft
        this.postForm.valueChanges
          .pipe(debounceTime(30000), takeUntil(this.destroy$))
          .subscribe(() => this.autoSaveDraft());
      },
      error: () => {
        this.snackBar.open('Failed to load draft', 'Close', { duration: 3000 });
        this.router.navigate(['/blog/drafts']);
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

  private toTimeString(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  saveDraft(): void {
    const val = this.postForm.value;
    this.isLoading = true;
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
        this.isLoading = false;
        this.snackBar.open('Draft saved!', 'Close', { duration: 2000 });
        this.router.navigate(['/blog/drafts']);
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Failed to save draft', 'Close', { duration: 3000 });
      }
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

    let scheduledIso: string | null = null;

    // Validate and build scheduled datetime
    if (this.publishMode === 'later') {
      const dateVal = this.postForm.get('scheduleDate')?.value;
      const timeVal = this.postForm.get('scheduleTime')?.value;
      if (!dateVal || !timeVal) {
        this.snackBar.open('Please select both a date and time to schedule the post', 'Close', { duration: 3000 });
        return;
      }
      const scheduled = new Date(dateVal);
      const [hours, minutes] = timeVal.split(':').map(Number);
      scheduled.setHours(hours, minutes, 0, 0);
      // Must be at least 1 hour in the future
      const minAllowed = new Date();
      minAllowed.setHours(minAllowed.getHours() + 1);
      if (scheduled < minAllowed) {
        this.snackBar.open('You can only schedule a post at least 1 hour from now (not in the past or sooner)', 'Close', { duration: 4000 });
        return;
      }
      scheduledIso = scheduled.toISOString();
    }

    this.isLoading = true;
    const formVal = this.postForm.value;
    
    const payload: any = {
      title: formVal.title,
      content: formVal.content,
      summary: formVal.summary,
      category: formVal.category,
      tags: this.tags,
      isDraft: false
    };

    // Add scheduling if selected
    if (scheduledIso) {
      payload.scheduledPublishAt = scheduledIso;
    }

    const request = this.isEditing
      ? this.blogService.updatePost(this.editPostId!, payload)
      : this.blogService.createPost(payload);

    request.subscribe({
      next: (post) => {
        // Delete draft if we had one
        if (this.draftId) {
          this.blogService.deleteDraft(this.draftId).subscribe();
        }
        const message = this.isEditing 
          ? 'Post updated!' 
          : this.publishMode === 'later'
            ? 'Post scheduled!'
            : 'Post published!';
        
        this.snackBar.open(message, 'Close', { duration: 3000 });
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

  onContentChanged(event: any): void {
    // Reset grammar results when content changes
    if (this.grammarResult !== null) {
      this.grammarResult = null;
      this.grammarIssues = [];
    }
  }

  checkGrammar(): void {
    const content = this.postForm.get('content')?.value;
    if (!content) {
      this.snackBar.open('Write some content first', 'Close', { duration: 2000 });
      return;
    }

    this.grammarChecking = true;
    this.grammarService.checkGrammar(content).subscribe({
      next: (issues) => {
        this.grammarIssues = issues;
        this.grammarResult = true;
        this.grammarChecking = false;
      },
      error: (err) => {
        this.grammarChecking = false;
        const msg = err?.status === 429
          ? 'Too many requests to grammar service. Wait a moment and try again.'
          : 'Grammar check failed. The free LanguageTool API may be temporarily overloaded.';
        this.snackBar.open(msg, 'Close', { duration: 4000 });
      }
    });
  }

  applyGrammarFix(issue: GrammarMatch, replacement: string): void {
    let content = this.postForm.get('content')?.value || '';
    // Replace the error text with the suggestion
    const before = content.substring(0, issue.offset);
    const after = content.substring(issue.offset + issue.length);
    content = before + replacement + after;
    this.postForm.patchValue({ content });
    // Remove the fixed issue
    this.grammarIssues = this.grammarIssues.filter(i => i !== issue);
    this.snackBar.open('Fix applied!', 'Close', { duration: 1500 });
  }
}
