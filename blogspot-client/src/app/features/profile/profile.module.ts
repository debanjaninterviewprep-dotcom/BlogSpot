import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { AuthGuard } from '../../core/guards/auth.guard';
import { ProfileViewComponent } from './profile-view/profile-view.component';
import { ProfileEditComponent } from './profile-edit/profile-edit.component';
import { AnalyticsComponent } from './analytics/analytics.component';

const routes: Routes = [
  { path: 'me', component: ProfileViewComponent, canActivate: [AuthGuard] },
  { path: 'edit', component: ProfileEditComponent, canActivate: [AuthGuard] },
  { path: 'analytics', component: AnalyticsComponent, canActivate: [AuthGuard] },
  { path: ':username', component: ProfileViewComponent }
];

@NgModule({
  declarations: [
    ProfileViewComponent,
    ProfileEditComponent,
    AnalyticsComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class ProfileModule { }
