import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaintenanceService, Maintenance } from '../../services/maintenance.service';

@Component({
  selector: 'app-maintenances-list',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './maintenances-list.page.html',
})
export class MaintenancesListPage implements OnInit {
  protected readonly maintenances = signal<Maintenance[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly searchTerm = signal('');

  constructor(private readonly maintenanceService: MaintenanceService) {}

  ngOnInit(): void {
    this.loadMaintenances();
  }

  private loadMaintenances(): void {
    this.loading.set(true);
    this.error.set(null);

    this.maintenanceService.getAll().subscribe({
      next: (data) => {
        this.maintenances.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des maintenances:', err);
        this.error.set('Erreur lors du chargement des maintenances');
        this.loading.set(false);
      },
    });
  }

  protected deleteMaintenance(id: number | undefined): void {
    if (!id) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette intervention?')) return;

    this.maintenanceService.delete(id).subscribe({
      next: () => {
        this.loadMaintenances();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression:', err);
        this.error.set('Erreur lors de la suppression de l\'intervention');
      },
    });
  }

  protected get filteredMaintenances(): Maintenance[] {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.maintenances();
    return this.maintenances().filter(
      (m) =>
        m.numero_intervention.toLowerCase().includes(term) ||
        m.type_intervention?.toLowerCase().includes(term) ||
        m.description_intervention?.toLowerCase().includes(term)
    );
  }

  protected getStatutBadgeClass(statut?: string): string {
    switch (statut?.toLowerCase()) {
      case 'completee':
      case 'completed':
        return 'badge-success';
      case 'en-cours':
      case 'in-progress':
        return 'badge-warning';
      case 'planifiee':
      case 'scheduled':
        return 'badge-info';
      case 'annulee':
      case 'cancelled':
        return 'badge-danger';
      default:
        return 'badge-default';
    }
  }
}
