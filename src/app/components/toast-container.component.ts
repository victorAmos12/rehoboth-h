import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
      @for (toast of toastService.getToasts()(); track toast.id) {
        <div
          class="toast animate-in fade-in slide-in-from-right-4 duration-300 pointer-events-auto"
          [class]="'toast-' + toast.type"
        >
          <div class="flex items-center gap-3">
            <i [class]="getIcon(toast.type)" class="text-lg"></i>
            <span class="text-sm font-medium">{{ toast.message }}</span>
            <button
              (click)="toastService.remove(toast.id)"
              class="ml-auto text-lg hover:opacity-70 transition-opacity"
            >
              ×
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast {
      padding: 1rem;
      border-radius: 0.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      min-width: 300px;
      max-width: 500px;
      animation: slideIn 0.3s ease-out;
    }

    .toast-success {
      background-color: var(--color-bg-card);
      border-left: 4px solid var(--color-success);
      color: var(--color-text-primary);
    }

    .toast-error {
      background-color: var(--color-bg-card);
      border-left: 4px solid var(--color-error);
      color: var(--color-text-primary);
    }

    .toast-warning {
      background-color: var(--color-bg-card);
      border-left: 4px solid var(--color-warning);
      color: var(--color-text-primary);
    }

    .toast-info {
      background-color: var(--color-bg-card);
      border-left: 4px solid var(--color-primary);
      color: var(--color-text-primary);
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `],
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);

  protected getIcon(type: string): string {
    switch (type) {
      case 'success':
        return 'fas fa-check-circle';
      case 'error':
        return 'fas fa-exclamation-circle';
      case 'warning':
        return 'fas fa-exclamation-triangle';
      case 'info':
        return 'fas fa-info-circle';
      default:
        return 'fas fa-info-circle';
    }
  }
}
