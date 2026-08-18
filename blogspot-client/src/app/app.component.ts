import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-root',
  template: `
    <app-navbar></app-navbar>
    <main class="container mt-2">
      <div [@routeFade]="getRouteState(outlet)">
        <router-outlet #outlet="outlet"></router-outlet>
      </div>
    </main>
  `,
  styles: [`
    main {
      min-height: calc(100vh - 64px);
    }
  `],
  animations: [
    trigger('routeFade', [
      transition('* <=> *', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('220ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class AppComponent {
  title = 'BlogSpot';

  getRouteState(outlet: RouterOutlet): string {
    return outlet?.isActivated ? outlet.activatedRoute.snapshot.url.join('/') : '';
  }
}
