import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="badgeClass">
      <span class="badge-dot"></span>
      <span class="badge-text">{{ label || status }}</span>
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 11.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border: 1px solid transparent;
      line-height: 1.2;
    }

    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: currentColor;
    }

    .badge-success {
      background-color: #f0fdf4;
      color: #15803d;
      border-color: #bbf7d0;
    }

    .badge-warning {
      background-color: #fffbeb;
      color: #b45309;
      border-color: #fde68a;
    }

    .badge-danger {
      background-color: #fef2f2;
      color: #b91c1c;
      border-color: #fecaca;
    }

    .badge-info {
      background-color: #f0f9ff;
      color: #0369a1;
      border-color: #bae6fd;
    }

    .badge-default {
      background-color: #f8fafc;
      color: #64748b;
      border-color: #e2e8f0;
    }
  `]
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: string;
  @Input() label?: string;

  get badgeClass(): string {
    const s = this.status?.toLowerCase();
    if (['entregado', 'completado', 'disponible', 'activo'].includes(s)) return 'badge-success';
    if (['en_ruta', 'pendiente', 'en_proceso'].includes(s)) return 'badge-warning';
    if (['cancelado', 'rechazado', 'inactivo', 'mantenimiento'].includes(s)) return 'badge-danger';
    if (['asignado', 'programado'].includes(s)) return 'badge-info';
    return 'badge-default';
  }
}
