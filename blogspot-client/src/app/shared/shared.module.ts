import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule } from '@angular/material/list';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { PostCardComponent } from './components/post-card/post-card.component';
import { UserCardComponent } from './components/user-card/user-card.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { ErrorStateComponent } from './components/error-state/error-state.component';
import { ImageUrlPipe } from './pipes/image-url.pipe';
import { FormatContentPipe } from './pipes/format-content.pipe';

const materialModules = [
  MatToolbarModule,
  MatButtonModule,
  MatIconModule,
  MatCardModule,
  MatFormFieldModule,
  MatInputModule,
  MatMenuModule,
  MatDividerModule,
  MatChipsModule,
  MatTabsModule,
  MatProgressSpinnerModule,
  MatSnackBarModule,
  MatDialogModule,
  MatTooltipModule,
  MatPaginatorModule,
  MatTableModule,
  MatSelectModule,
  MatBadgeModule,
  MatProgressBarModule,
  MatListModule,
  MatSlideToggleModule,
  MatRadioModule,
  MatDatepickerModule,
  MatNativeDateModule
];

@NgModule({
  declarations: [
    PostCardComponent,
    UserCardComponent,
    LoadingSpinnerComponent,
    ErrorStateComponent,
    ImageUrlPipe,
    FormatContentPipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ...materialModules
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ...materialModules,
    PostCardComponent,
    UserCardComponent,
    LoadingSpinnerComponent,
    ErrorStateComponent,
    ImageUrlPipe,
    FormatContentPipe
  ]
})
export class SharedModule { }
