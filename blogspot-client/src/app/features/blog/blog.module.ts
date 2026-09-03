import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { AuthGuard } from '../../core/guards/auth.guard';
import { BlogCreateComponent } from './blog-create/blog-create.component';
import { BlogDetailComponent } from './blog-detail/blog-detail.component';
import { BlogSearchComponent } from './blog-search/blog-search.component';
import { BookmarksComponent } from './bookmarks/bookmarks.component';
import { DraftsComponent } from './drafts/drafts.component';
import { ScheduledPostsComponent } from './scheduled/scheduled-posts.component';
import { QuillModule } from 'ngx-quill';

const routes: Routes = [
  { path: 'create', component: BlogCreateComponent, canActivate: [AuthGuard] },
  { path: 'edit/:id', component: BlogCreateComponent, canActivate: [AuthGuard] },
  { path: 'bookmarks', component: BookmarksComponent, canActivate: [AuthGuard] },
  { path: 'drafts', component: DraftsComponent, canActivate: [AuthGuard] },
  { path: 'scheduled', component: ScheduledPostsComponent, canActivate: [AuthGuard] },
  { path: 'search', component: BlogSearchComponent },
  { path: ':slug', component: BlogDetailComponent }
];

@NgModule({
  declarations: [
    BlogCreateComponent,
    BlogDetailComponent,
    BlogSearchComponent,
    BookmarksComponent,
    DraftsComponent,
    ScheduledPostsComponent
  ],
  imports: [
    SharedModule,
    QuillModule.forRoot(),
    RouterModule.forChild(routes)
  ]
})
export class BlogModule { }
