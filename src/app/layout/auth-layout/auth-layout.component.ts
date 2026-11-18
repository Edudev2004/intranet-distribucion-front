import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="auth-wrapper">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      min-height: 100vh;
    }
    .auth-wrapper {
      width: 100%;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
  `]
})
export class AuthLayoutComponent {}
