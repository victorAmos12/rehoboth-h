import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { ToastService } from '../../services/toast.service';
import { UtilisateursService, UtilisateurDetail } from './services/utilisateurs.service';

interface ServiceRef {
  id: number;
  code?: string;
  nom: string;
  typeService?: string;
  hopital?: string;
  couleur?: string;
  actif?: boolean;
}

@Component({
  selector: 'app-utilisateur-cards',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './utilisateur-cards.page.html',
})
export class UtilisateurCardsPage implements OnInit {
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly user = signal<UtilisateurDetail | null>(null);
  protected readonly services = signal<ServiceRef[]>([]);
  protected readonly selectedServiceId = signal<number | null>(null);

  protected readonly previewUrl = signal<SafeResourceUrl | null>(null);

  private userId: number = 0;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly sanitizer: DomSanitizer,
    private readonly toast: ToastService,
    private readonly utilisateursService: UtilisateursService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || Number.isNaN(id)) {
      this.error.set('Identifiant utilisateur invalide');
      return;
    }

    this.userId = id;
    this.load();
  }

  protected goBack(): void {
    this.router.navigate(['/rh/utilisateurs', this.userId]);
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);

    // 1) Charger l'utilisateur (détail) pour affichage en en-tête
    this.utilisateursService.getDetail(this.userId).subscribe({
      next: (res) => {
        this.user.set(res.data ?? null);
      },
      error: (e) => {
        const msg = e?.error?.error || e?.error?.message || e?.message || "Erreur lors du chargement de l'utilisateur.";
        this.error.set(msg);
      },
    });

    // 2) Charger les services affectés (badges à produire)
    this.utilisateursService.getAffectedServices(this.userId).subscribe({
      next: (res) => {
        const list = (res?.data ?? []) as ServiceRef[];
        this.services.set(list);

        // pré-sélection
        if (list.length > 0) {
          const firstId = list[0].id;
          this.selectedServiceId.set(firstId);
          this.updatePreview(firstId);
        } else {
          this.previewUrl.set(null);
        }

        this.loading.set(false);
      },
      error: (e) => {
        const msg = e?.error?.error || e?.error?.message || e?.message || 'Erreur lors du chargement des services affectés.';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  protected onSelectService(idStr: string): void {
    const id = Number(idStr);
    if (!id || Number.isNaN(id)) return;
    this.selectedServiceId.set(id);
    this.updatePreview(id);
  }

  private updatePreview(serviceId: number): void {
    const url = this.utilisateursService.getServiceCardPreviewUrl(this.userId, serviceId);
    this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
  }

  protected downloadPdf(): void {
    const serviceId = this.selectedServiceId();
    if (!serviceId) {
      this.toast.warning('Veuillez sélectionner un service');
      return;
    }

    this.utilisateursService.downloadServiceCardPdf(this.userId, serviceId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `carte_service_${this.userId}_${serviceId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toast.success('PDF téléchargé');
      },
      error: (e) => {
        const msg = e?.error?.error || e?.error?.message || 'Erreur lors du téléchargement du PDF';
        this.toast.error(msg);
      },
    });
  }

  protected downloadImage(format: 'png' | 'jpg' = 'png'): void {
    const serviceId = this.selectedServiceId();
    if (!serviceId) {
      this.toast.warning('Veuillez sélectionner un service');
      return;
    }

    this.utilisateursService.downloadServiceCardImage(this.userId, serviceId, format).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `carte_service_${this.userId}_${serviceId}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toast.success('Image téléchargée');
      },
      error: (e) => {
        const msg = e?.error?.error || e?.error?.message || "Erreur lors du téléchargement de l'image";
        this.toast.error(msg);
      },
    });
  }

  protected downloadMultiplePdf(): void {
    // Si tu veux une sélection multiple plus tard, on peut l'ajouter.
    this.utilisateursService.downloadMultipleServiceCardsPdf(this.userId, []).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cartes_services_${this.userId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toast.success('PDF multiple téléchargé');
      },
      error: (e) => {
        const msg = e?.error?.error || e?.error?.message || 'Erreur lors du téléchargement du PDF multiple';
        this.toast.error(msg);
      },
    });
  }
}
