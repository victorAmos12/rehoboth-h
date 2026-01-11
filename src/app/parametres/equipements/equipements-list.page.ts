import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EquipementService, Equipement } from '../../services/equipement.service';

@Component({
  selector: 'app-equipements-list',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './equipements-list.page.html',
})
export class EquipementsListPage implements OnInit {
  protected readonly equipements = signal<Equipement[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly searchTerm = signal('');

  constructor(private readonly equipementService: EquipementService) {}

  ngOnInit(): void {
    this.loadEquipements();
  }

  private loadEquipements(): void {
    this.loading.set(true);
    this.error.set(null);

    this.equipementService.getAll().subscribe({
      next: (data) => {
        this.equipements.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des équipements:', err);
        this.error.set('Erreur lors du chargement des équipements');
        this.loading.set(false);
      },
    });
  }

  protected deleteEquipement(id: number | undefined): void {
    if (!id) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet équipement?')) return;

    this.equipementService.delete(id).subscribe({
      next: () => {
        this.loadEquipements();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression:', err);
        this.error.set('Erreur lors de la suppression de l\'équipement');
      },
    });
  }

  protected get filteredEquipements(): Equipement[] {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.equipements();
    return this.equipements().filter(
      (e) =>
        e.nom_equipement.toLowerCase().includes(term) ||
        e.code_equipement.toLowerCase().includes(term) ||
        e.type_equipement?.toLowerCase().includes(term) ||
        e.marque?.toLowerCase().includes(term)
    );
  }

  protected getStatutBadgeClass(statut?: string): string {
    switch (statut?.toLowerCase()) {
      case 'operationnel':
        return 'badge-success';
      case 'maintenance':
        return 'badge-warning';
      case 'hors-service':
        return 'badge-danger';
      default:
        return 'badge-default';
    }
  }
}
