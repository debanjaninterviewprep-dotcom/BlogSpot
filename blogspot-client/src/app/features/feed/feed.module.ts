import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { FeedComponent } from './feed/feed.component';

const routes: Routes = [
  { path: '', component: FeedComponent }
];

@NgModule({
  declarations: [
    FeedComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class FeedModule { }
