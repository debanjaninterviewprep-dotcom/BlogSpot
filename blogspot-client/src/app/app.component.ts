import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <app-navbar></app-navbar>
    <main class="container mt-2">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    main {
      padding-top: 64px;
      min-height: calc(100vh - 64px);
    }
  `]
})
export class AppComponent {
  title = 'BlogSpot';
}
