import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LitService, Lit } from '../../services/lit.service';
import { ServiceService, Service } from '../../services/service.service';

@Component({
  selector: 'app-lits-list',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './lits-list.page.html',
})
export class LitsListPage implements OnInit {
  protected readonly lits = signal<Lit[]>([]);
  protected readonly services = signal<Service[]>([]);
  protected readonly selectedServiceId = signal<number | null>(null);

  // ngModel-compatible accessor for templates (signals are functions; template bindings should use values)
  protected get selectedServiceIdValue(): number | null {
    return this.selectedServiceId();
  }
  protected set selectedServiceIdValue(v: number | null) {
    this.selectedServiceId.set(v);
  }
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly searchTerm = signal('');
  protected readonly selectedLitIds = signal<number[]>([]);

  constructor(private readonly litService: LitService, private readonly serviceService: ServiceService) {}

  ngOnInit(): void {
    this.loadLits();
    this.loadServices();
  }

  private loadLits(): void {
    this.loading.set(true);
    this.error.set(null);

    this.litService.getAll().subscribe({
      next: (data) => {
        this.lits.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des lits:', err);
        this.error.set('Erreur lors du chargement des lits');
        this.loading.set(false);
      },
    });
  }

  protected deleteLit(id: number | undefined): void {
    if (!id) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce lit?')) return;

    this.litService.delete(id).subscribe({
      next: () => {
        this.loadLits();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression:', err);
        this.error.set('Erreur lors de la suppression du lit');
      },
    });
  }

  protected toggleSelect(litId: number): void {
    const current = this.selectedLitIds();
    if (current.includes(litId)) {
      this.selectedLitIds.set(current.filter((i) => i !== litId));
    } else {
      this.selectedLitIds.set([...current, litId]);
    }
  }

  protected isSelected(litId: number): boolean {
    return this.selectedLitIds().includes(litId);
  }

  protected isAllVisibleSelected(): boolean {
    const visibleIds = this.filteredLits.map((l) => l.id!).filter(Boolean) as number[];
    if (visibleIds.length === 0) return false;
    return visibleIds.every(id => this.selectedLitIds().includes(id));
  }

  protected toggleSelectAll(): void {
    const visibleIds = this.filteredLits.map((l) => l.id!).filter(Boolean) as number[];
    const current = this.selectedLitIds();
    // If all visible are already selected, deselect them; else select them (merge)
    if (visibleIds.length > 0 && visibleIds.every(id => current.includes(id))) {
      this.selectedLitIds.set(current.filter(i => !visibleIds.includes(i)));
    } else {
      this.selectedLitIds.set(Array.from(new Set([...current, ...visibleIds])));
    }
  }

  protected clearSelection(): void {
    this.selectedLitIds.set([]);
  }

  // Download single ticket (PDF)
  protected downloadTicket(litId: number): void {
    this.litService.downloadTicket(litId).subscribe({
      next: (blob: Blob) => this.downloadBlob(blob, `ticket-lit-${litId}.pdf`),
      error: (err) => console.error('Erreur téléchargement ticket:', err),
    });
  }

  // Open PDF in new tab and trigger print for single ticket
  protected printTicket(litId: number): void {
    this.litService.printTicket(litId).subscribe({
      next: (blob: Blob) => this.openBlobAndPrint(blob),
      error: (err) => console.error('Erreur impression ticket:', err),
    });
  }

  protected downloadSelectedTickets(): void {
    const ids = this.selectedLitIds().map(id => Number(id));
    if (!ids || ids.length === 0) return;
    console.log('Downloading multiple tickets for IDs:', ids);
    this.litService.downloadMultipleTickets(ids).subscribe({
      next: (blob: Blob) => this.downloadBlob(blob, `tickets-lits-${Date.now()}.pdf`),
      error: (err) => console.error('Erreur téléchargement tickets multiples:', err),
    });
  }

  protected printSelectedTickets(): void {
    const ids = this.selectedLitIds();
    if (!ids || ids.length === 0) return;
    this.litService.printMultipleTickets(ids).subscribe({
      next: (blob: Blob) => this.openBlobAndPrint(blob),
      error: (err) => console.error('Erreur impression tickets multiples:', err),
    });
  }

  protected downloadTicketsByService(serviceId?: number | null): void {
    if (!serviceId) return;
    this.litService.downloadTicketsByService(Number(serviceId)).subscribe({
      next: (blob: Blob) => this.downloadBlob(blob, `tickets-service-${serviceId}-${Date.now()}.pdf`),
      error: (err) => console.error('Erreur téléchargement tickets service:', err),
    });
  }

  private loadServices(): void {
    this.serviceService.getAll().subscribe({
      next: (services) => this.services.set(services),
      error: (err) => console.error('Erreur chargement services:', err),
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
      // Fallback: download
      this.downloadBlob(blob, `ticket-${Date.now()}.pdf`);
    }
  }

  protected get filteredLits(): Lit[] {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.lits();
    return this.lits().filter(
      (l) =>
        l.numero_lit.toLowerCase().includes(term) ||
        l.type_lit?.toLowerCase().includes(term) ||
        l.chambre_numero?.toLowerCase().includes(term)
    );
  }

  protected get selectedCount(): number {
    return this.selectedLitIds().length;
  }

  protected getStatutBadgeClass(statut?: string): string {
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
}
