import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LitService, Lit } from '../../services/lit.service';
import { PatientService, Patient } from '../../services/patient.service';
import { ServiceService, Service } from '../../services/service.service';
import { ChambreService } from '../../services/chambre.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-lit-detail',
  imports: [CommonModule, RouterLink],
  templateUrl: './lit-detail.page.html',
})
export class LitDetailPage implements OnInit {
  protected readonly lit = signal<Lit | null>(null);
  protected readonly patient = signal<Patient | null>(null);
  protected readonly service = signal<Service | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly litId = signal<number | null>(null);

  constructor(
    private readonly litService: LitService,
    private readonly patientService: PatientService,
    private readonly serviceService: ServiceService,
    private readonly chambreService: ChambreService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly location: Location
  ) {}
  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        const id = parseInt(params['id'], 10);
        this.litId.set(id);
        this.loadLit(id);
      }
    });
  }

  private loadLit(id: number): void {
    this.loading.set(true);
    this.litService.getById(id).subscribe({
      next: (l) => {
        this.lit.set(l);
        if ((l as any).patient_id) {
          this.patientService.getPatient((l as any).patient_id).subscribe({ next: (p: any) => this.patient.set(p as Patient), error: () => {} });
        } else if ((l as any).patient) {
          this.patient.set((l as any).patient as Patient);
        }
        if (l.service_id) {
          this.serviceService.getById(l.service_id).subscribe({ next: (s) => this.service.set(s), error: () => {} });
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement lit:', err);
        this.error.set('Erreur lors du chargement du lit');
        this.loading.set(false);
      },
    });
  }

  protected edit(): void {
    if (!this.litId()) return;
    this.router.navigate(['/administration/lits', this.litId(), 'edit']);
  }

  protected delete(): void {
    if (!this.litId()) return;
    if (!confirm('Supprimer ce lit ?')) return;
    this.litService.delete(this.litId()!).subscribe({ next: () => this.router.navigate(['/administration/lits']), error: (err) => console.error(err) });
  }

  protected downloadTicket(): void {
    if (!this.litId()) return;
    this.litService.downloadTicket(this.litId()!).subscribe({ next: (blob) => this.downloadBlob(blob, `ticket-lit-${this.litId()}.pdf`), error: (err) => console.error(err) });
  }

  protected printTicket(): void {
    if (!this.litId()) return;
    this.litService.printTicket(this.litId()!).subscribe({ next: (blob) => this.openBlobAndPrint(blob), error: (err) => console.error(err) });
  }

  protected onBack(): void {
    // Prefer browser history so the user returns to the exact previous screen
    try {
      if (window.history && window.history.length > 1) {
        this.location.back();
        return;
      }
    } catch (e) {
      // ignore and fallback
    }

    // Fallback: if we know the chambre, go to its detail, otherwise go to lits list
    const lit = this.lit();
    if (lit && lit.chambre_id) {
      this.router.navigate(['/administration/chambres', lit.chambre_id]);
      return;
    }
    this.router.navigate(['/administration/lits']);
  }
  protected isLitOccupied(lit?: Lit | null): boolean {
    if (!lit) return false;
    const s = (lit.statut || '').toLowerCase();
    // Prefer DB 'statut' as the source of truth
    if (s.includes('occupe') || s.includes('occup') || s.includes('reserve') || s.includes('réserv') ) return true;
    const anyLit = lit as any;
    if (anyLit.patient_id || anyLit.patient) return true;
    return false;
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
