import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ChambreService, Chambre } from '../../services/chambre.service';
import { ServiceService, Service } from '../../services/service.service';
import { LitService, Lit } from '../../services/lit.service';

@Component({
  selector: 'app-chambre-detail',
  imports: [CommonModule, RouterLink],
  templateUrl: './chambre-detail.page.html',
})
export class ChambreDetailPage implements OnInit {
  protected readonly chambre = signal<Chambre | null>(null);
  protected readonly lits = signal<Lit[]>([]);
  protected readonly service = signal<Service | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly chambreId = signal<number | null>(null);

  constructor(
    private readonly chambreService: ChambreService,
    private readonly serviceService: ServiceService,
    private readonly litService: LitService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        const id = parseInt(params['id'], 10);
        this.chambreId.set(id);
        this.loadChambreDetail(id);
        this.loadLitsDeChambre(id);
      }
    });
  }

  private loadChambreDetail(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.chambreService.getById(id).subscribe({
      next: (chambre) => {
        this.chambre.set(chambre);
        if (chambre.service_id) {
          this.loadService(chambre.service_id);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement de la chambre:', err);
        this.error.set('Erreur lors du chargement de la chambre');
        this.loading.set(false);
      },
    });
  }

  private loadService(serviceId: number): void {
    this.serviceService.getById(serviceId).subscribe({
      next: (service) => {
        this.service.set(service);
      },
      error: (err) => {
        console.error('Erreur lors du chargement du service:', err);
      },
    });
  }

  private loadLitsDeChambre(chambreId: number): void {
    this.litService.getAll().subscribe({
      next: (lits) => {
        const litsFiltered = lits.filter(lit => lit.chambre_id === chambreId);
        this.lits.set(litsFiltered);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des lits:', err);
      },
    });
  }

  protected isLitOccupied(lit: Lit): boolean {
    // Prefer explicit patient_id or patient object when available
    if ((lit as any).patient_id) return true;
    if ((lit as any).patient) return true;
    const s = lit.statut?.toLowerCase() || '';
    return s.includes('occupe') || s.includes('occup') || s.includes('reserve');
  }

  protected getNombreLitsOccupes(): number {
    return this.lits().filter(l => this.isLitOccupied(l)).length;
  }

  protected getPatientDisplay(lit: Lit): string {
    const anyLit = lit as any;
    const patient = anyLit.patient;
    const patientId = anyLit.patient_id;
    if (patient) {
      // prefer human-readable name when available
      return (patient.nom || patient.name || (`#${patient.id || patientId || '-'}`));
    }
    if (patientId) return `#${patientId}`;
    return 'Vide';
  }

  protected getStatutStyle(statut?: string): { [key: string]: string } {
    switch (statut?.toLowerCase()) {
      case 'disponible':
        return { 'background-color': 'rgba(34, 197, 94, 0.1)', 'color': 'var(--color-success)' };
      case 'occupée':
      case 'occupee':
        return { 'background-color': 'rgba(202, 138, 4, 0.1)', 'color': 'var(--color-warning)' };
      case 'maintenance':
        return { 'background-color': 'rgba(220, 38, 38, 0.1)', 'color': 'var(--color-error)' };
      case 'réservée':
      case 'reservee':
        return { 'background-color': 'rgba(59, 130, 246, 0.1)', 'color': 'var(--color-primary)' };
      default:
        return { 'background-color': 'rgba(107, 114, 128, 0.1)', 'color': 'var(--color-text-secondary)' };
    }
  }

  protected getStatutLitBadgeClass(statut?: string): string {
    switch (statut?.toLowerCase()) {
      case 'disponible':
        return 'badge-success';
      case 'occupe':
        return 'badge-warning';
      case 'maintenance':
        return 'badge-danger';
      default:
        return 'badge-default';
    }
  }

  protected getTauxOccupation(): number {
    const chamb = this.chambre();
    if (!chamb || !chamb.nombre_lits) return 0;
    const occ = this.getNombreLitsOccupes();
    return Math.round((occ / chamb.nombre_lits) * 100);
  }

  protected onEdit(): void {
    this.router.navigate(['/administration/chambres', this.chambreId(), 'edit']);
  }

  protected onBack(): void {
    this.router.navigate(['/administration/chambres']);
  }

  // Printing / downloading tickets for lits in this chambre
  protected downloadTicket(litId: number): void {
    this.litService.downloadTicket(litId).subscribe({
      next: (blob: Blob) => this.downloadBlob(blob, `ticket-lit-${litId}.pdf`),
      error: (err) => console.error('Erreur téléchargement ticket:', err),
    });
  }

  protected printTicket(litId: number): void {
    this.litService.printTicket(litId).subscribe({
      next: (blob: Blob) => this.openBlobAndPrint(blob),
      error: (err) => console.error('Erreur impression ticket:', err),
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  private openBlobAndPrint(blob: Blob): void {
    const url = window.URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (w) {
      w.onload = () => {
        try {
          w.focus();
          w.print();
        } catch (e) {
          console.error('Print failed', e);
        }
      };
    } else {
      this.downloadBlob(blob, `ticket-${Date.now()}.pdf`);
    }
  }
}
