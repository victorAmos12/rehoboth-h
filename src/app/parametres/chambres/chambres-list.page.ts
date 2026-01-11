import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ChambreService, Chambre } from '../../services/chambre.service';

@Component({
  selector: 'app-chambres-list',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './chambres-list.page.html',
})
export class ChambresListPage implements OnInit {
  protected readonly chambres = signal<Chambre[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly searchTerm = signal('');
  protected readonly filterType = signal('');
  protected readonly filterStatut = signal('');

  constructor(private readonly chambreService: ChambreService) {}

  ngOnInit(): void {
    this.loadChambres();
  }

  private loadChambres(): void {
    this.loading.set(true);
    this.error.set(null);

    this.chambreService.getAll().subscribe({
      next: (data) => {
        this.chambres.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des chambres:', err);
        this.error.set('Erreur lors du chargement des chambres');
        this.loading.set(false);
      },
    });
  }

  protected deleteChambre(id: number | undefined): void {
    if (!id) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette chambre? Les lits associés seront également supprimés.')) return;

    this.chambreService.delete(id).subscribe({
      next: () => {
        this.loadChambres();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression:', err);
        this.error.set('Erreur lors de la suppression de la chambre');
      },
    });
  }

  protected get filteredChambres(): Chambre[] {
    let filtered = this.chambres();

    // Filtre par terme de recherche
    const term = this.searchTerm().toLowerCase();
    if (term) {
      filtered = filtered.filter(
        (c) =>
          c.numero_chambre.toLowerCase().includes(term) ||
          c.type_chambre?.toLowerCase().includes(term) ||
          c.localisation?.toLowerCase().includes(term)
      );
    }

    // Filtre par type
    const type = this.filterType();
    if (type) {
      filtered = filtered.filter((c) => c.type_chambre === type);
    }

    // Filtre par statut
    const statut = this.filterStatut();
    if (statut) {
      filtered = filtered.filter((c) => c.statut === statut);
    }

    return filtered;
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
}
