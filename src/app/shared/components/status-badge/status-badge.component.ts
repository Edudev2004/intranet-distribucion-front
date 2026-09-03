import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="badgeClass">
      {{ label || status }}
    </span>
  `,
  styles: [`
    .badge {
      padding: 0.35rem 0.65rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: inline-block;
    }
    .badge-success { background-color: #d1fae5; color: #065f46; }
    .badge-warning { background-color: #fef3c7; color: #92400e; }
    .badge-danger { background-color: #fee2e2; color: #991b1b; }
    .badge-info { background-color: #e0f2fe; color: #075985; }
    .badge-default { background-color: #f3f4f6; color: #374151; }
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
