import { Injectable, signal } from '@angular/core';

export interface ConfirmModalOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmClass?: 'danger' | 'primary' | 'warning';
  icon?: string;
  isHtml?: boolean;
}

export interface ConfirmModalState {
  isOpen: boolean;
  options: ConfirmModalOptions | null;
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;
}

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  public readonly modalState = signal<ConfirmModalState>({
    isOpen: false,
    options: null,
    onConfirm: null,
    onCancel: null,
  });

  constructor() {}

  /**
   * Ouvrir une modal de confirmation
   * @param options Options de la modal
   * @returns Promise<boolean> - true si confirmé, false si annulé
   */
  public confirm(options: ConfirmModalOptions): Promise<boolean> {
    return new Promise((resolve) => {
      const state = this.modalState();

      this.modalState.set({
        isOpen: true,
        options: {
          title: options.title,
          message: options.message,
          confirmText: options.confirmText || 'Confirmer',
          cancelText: options.cancelText || 'Annuler',
          confirmClass: options.confirmClass || 'primary',
          icon: options.icon,
          isHtml: options.isHtml || false,
        },
        onConfirm: () => {
          this.closeModal();
          resolve(true);
        },
        onCancel: () => {
          this.closeModal();
          resolve(false);
        },
      });
    });
  }

  /**
   * Fermer la modal
   */
  public closeModal(): void {
    this.modalState.set({
      isOpen: false,
      options: null,
      onConfirm: null,
      onCancel: null,
    });
  }

  /**
   * Confirmer l'action
   */
  public confirmAction(): void {
    const state = this.modalState();
    if (state.onConfirm) {
      state.onConfirm();
    }
  }

  /**
   * Annuler l'action
   */
  public cancelAction(): void {
    const state = this.modalState();
    if (state.onCancel) {
      state.onCancel();
    }
  }
}
