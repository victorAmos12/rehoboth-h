import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UtilisateursService, UtilisateurDetail } from './services/utilisateurs.service';
import { ToastService } from '../../services/toast.service';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-utilisateur-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './utilisateur-detail.page.html',
})
export class UtilisateurDetailPage implements OnInit {
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly user = signal<UtilisateurDetail | null>(null);
  protected readonly actionLoading = signal(false);
  protected readonly actionInProgress = signal<string | null>(null);
  protected readonly exporting = signal(false);

  private userId: number = 0;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly service: UtilisateursService,
    private readonly toast: ToastService,
    private readonly modal: ModalService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || Number.isNaN(id)) {
      this.error.set('Identifiant utilisateur invalide');
      return;
    }
    this.userId = id;
    this.load(id);
  }

  private load(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getDetail(id).subscribe({
      next: (res) => {
        if (res.data) this.user.set(res.data);
        this.loading.set(false);
      },
      error: (e) => {
        const msg = e?.error?.error || e?.error?.message || e?.message || "Erreur lors du chargement de l'utilisateur.";
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  protected goBack(): void {
    this.router.navigate(['/rh/utilisateurs']);
  }

  protected editUser(): void {
    this.router.navigate(['/rh/utilisateurs', this.userId, 'edit']);
  }

  protected toggleLock(): void {
    if (!this.user()) return;
    
    const isLocked = this.user()!.securite.compte_verrouille;
    const action = isLocked ? 'déverrouiller' : 'verrouiller';

    this.modal.confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} le compte`,
      message: `Êtes-vous sûr de vouloir ${action} ce compte utilisateur ?`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: 'Annuler',
      confirmClass: isLocked ? 'primary' : 'warning',
      icon: isLocked ? 'fa-lock-open' : 'fa-lock',
    }).then((confirmed) => {
      if (!confirmed) return;

      this.actionLoading.set(true);
      this.actionInProgress.set('lock');

      this.service.lock(this.userId, { verrouille: !isLocked }).subscribe({
        next: (res) => {
          this.toast.success(`Compte ${action}é avec succès`);
          this.load(this.userId);
          this.actionLoading.set(false);
          this.actionInProgress.set(null);
        },
        error: (e) => {
          const msg = e?.error?.error || e?.error?.message || `Erreur lors du ${action} du compte`;
          this.toast.error(msg);
          this.actionLoading.set(false);
          this.actionInProgress.set(null);
        },
      });
    });
  }

  protected toggle2FA(): void {
    if (!this.user()) return;
    
    const isEnabled = this.user()!.securite.authentification_2fa;
    
    if (isEnabled) {
      // Désactivation : demander le PIN
      this.promptFor2FAPIN('Désactiver la 2FA', 'Entrez votre PIN pour désactiver la 2FA', (pin) => {
        this.disable2FA(pin);
      });
    } else {
      // Activation : demander le PIN
      this.promptFor2FAPIN('Activer la 2FA', 'Entrez votre PIN pour activer la 2FA', (pin) => {
        this.enable2FA(pin);
      });
    }
  }

  private promptFor2FAPIN(title: string, message: string, callback: (pin: string) => void): void {
    this.modal.confirm({
      title,
      message,
      confirmText: 'Continuer',
      cancelText: 'Annuler',
      confirmClass: 'primary',
      icon: 'fa-key',
    }).then((confirmed) => {
      if (!confirmed) return;

      const pin = prompt('Entrez votre PIN à 6 chiffres :');
      if (!pin || pin.trim().length !== 6 || !/^\d+$/.test(pin)) {
        this.toast.warning('PIN invalide. Veuillez entrer 6 chiffres.');
        return;
      }

      callback(pin);
    });
  }

  private enable2FA(pin: string): void {
    this.actionLoading.set(true);
    this.actionInProgress.set('2fa');

    this.service.enable2FA(this.userId, pin).subscribe({
      next: (res) => {
        // Afficher le QR code
        if (res.qr_code) {
          this.showQRCodeModal(res.qr_code, res.secret);
        } else {
          this.toast.success('2FA activée avec succès');
          this.load(this.userId);
        }
        this.actionLoading.set(false);
        this.actionInProgress.set(null);
      },
      error: (e) => {
        const msg = e?.error?.error || e?.error?.message || 'Erreur lors de l\'activation de la 2FA';
        this.toast.error(msg);
        this.actionLoading.set(false);
        this.actionInProgress.set(null);
      },
    });
  }

  private disable2FA(pin: string): void {
    this.actionLoading.set(true);
    this.actionInProgress.set('2fa');

    this.service.disable2FA(this.userId, pin).subscribe({
      next: (res) => {
        this.toast.success('2FA désactivée avec succès');
        this.load(this.userId);
        this.actionLoading.set(false);
        this.actionInProgress.set(null);
      },
      error: (e) => {
        const msg = e?.error?.error || e?.error?.message || 'Erreur lors de la désactivation de la 2FA';
        this.toast.error(msg);
        this.actionLoading.set(false);
        this.actionInProgress.set(null);
      },
    });
  }

  private showQRCodeModal(qrCode: string, secret: string): void {
    const message = `
      <div class="text-center">
        <p class="mb-4 text-sm">Scannez ce code QR avec Google Authenticator ou une autre application d'authentification :</p>
        <img src="${qrCode}" alt="QR Code" class="mx-auto mb-4" style="max-width: 250px; width: 100%;">
        <p class="text-xs text-gray-600 dark:text-gray-400 mb-2">Ou entrez manuellement ce code :</p>
        <p class="font-mono text-sm font-bold break-all">${secret}</p>
      </div>
    `;

    this.modal.confirm({
      title: 'Configurer Google Authenticator',
      message,
      confirmText: 'Confirmé',
      cancelText: 'Annuler',
      confirmClass: 'primary',
      icon: 'fa-qrcode',
      isHtml: true,
    }).then((confirmed) => {
      if (confirmed) {
        this.toast.success('2FA activée avec succès');
        this.load(this.userId);
      }
    });
  }

  protected resetPassword(): void {
    if (!this.user()) return;

    this.modal.confirm({
      title: 'Réinitialiser le mot de passe',
      message: 'Entrez le nouveau mot de passe pour cet utilisateur :',
      confirmText: 'Réinitialiser',
      cancelText: 'Annuler',
      confirmClass: 'warning',
      icon: 'fa-key',
    }).then((confirmed) => {
      if (!confirmed) return;

      const newPassword = prompt('Nouveau mot de passe :');
      if (!newPassword || newPassword.trim() === '') {
        this.toast.warning('Mot de passe requis');
        return;
      }

      this.actionLoading.set(true);
      this.actionInProgress.set('password');

      this.service.resetPassword(this.userId, { nouveau_mot_de_passe: newPassword }).subscribe({
        next: (res) => {
          this.toast.success('Mot de passe réinitialisé avec succès');
          this.actionLoading.set(false);
          this.actionInProgress.set(null);
        },
        error: (e) => {
          const msg = e?.error?.error || e?.error?.message || 'Erreur lors de la réinitialisation du mot de passe';
          this.toast.error(msg);
          this.actionLoading.set(false);
          this.actionInProgress.set(null);
        },
      });
    });
  }

  protected exportPDF(): void {
    if (!this.user()) return;

    this.exporting.set(true);
    this.service.exportUserPDF(this.userId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `utilisateur_${this.user()!.identite.nom}_${this.user()!.identite.prenom}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.toast.success('PDF téléchargé avec succès');
        this.exporting.set(false);
      },
      error: (e) => {
        const msg = e?.error?.error || e?.error?.message || 'Erreur lors de l\'export PDF';
        this.toast.error(msg);
        this.exporting.set(false);
      },
    });
  }
}
