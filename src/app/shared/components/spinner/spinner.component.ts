import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  standalone: true,
  template: `
    <div class="spinner-container" [class.inline]="inline">
      <div
        class="spinner-circle"
        [style.width.px]="size"
        [style.height.px]="size"
        [style.border-width.px]="strokeWidth"
      ></div>
      @if (message) {
        <span class="spinner-message">{{ message }}</span>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 2.5rem 1rem;
      color: #64748b;
      font-size: 13.5px;
      font-weight: 500;
    }

    .spinner-container.inline {
      display: inline-flex;
      flex-direction: row;
      gap: 8px;
      padding: 0;
    }

    .spinner-circle {
      border-radius: 50%;
      border-style: solid;
      border-color: rgba(24, 214, 0, 0.15);
      border-top-color: #18d600;
      animation: spin-smooth 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      box-sizing: border-box;
      flex-shrink: 0;
    }

    .spinner-message {
      letter-spacing: -0.2px;
      animation: pulse-opacity 1.5s ease-in-out infinite alternate;
    }

    @keyframes spin-smooth {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }

    @keyframes pulse-opacity {
      0% {
        opacity: 0.6;
      }
      100% {
        opacity: 1;
      }
    }
  `]
})
export class SpinnerComponent {
  @Input() size = 34;
  @Input() strokeWidth = 2.5;
  @Input() message = 'Cargando información...';
  @Input() inline = false;
}
