import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ServiceService, Service, ServiceDetails } from '../../services/service.service';

@Component({
  selector: 'app-services-list',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './services-list.page.html',
})
export class ServicesListPage implements OnInit {
  protected readonly services = signal<Service[]>([]);
  protected readonly poles = signal<any[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly searchTerm = signal('');
  protected readonly selectedType = signal('');
  protected readonly selectedPole = signal('');
  protected readonly selectedStatus = signal('');
  protected readonly showPoles = signal(false);
  protected readonly selectedServiceDetails = signal<ServiceDetails | null>(null);
  protected readonly selectedPoleDetails = signal<any | null>(null);
  protected readonly poleServices = signal<Service[] | null>(null);

  constructor(
    private readonly serviceService: ServiceService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadServices();
    this.loadPoles();
  }

  private loadServices(): void {
    this.loading.set(true);
    this.error.set(null);

    this.serviceService.getAll().subscribe({
      next: (data) => {
        this.services.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des services:', err);
        this.error.set('Erreur lors du chargement des services');
        this.loading.set(false);
      },
    });
  }

  private loadPoles(): void {
    this.serviceService.getAllPoles().subscribe({
      next: (data) => {
        this.poles.set(data);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des pôles:', err);
      },
    });
  }

  protected togglePoleView(): void {
    this.showPoles.set(!this.showPoles());
  }

  protected viewServiceDetails(id: number | undefined): void {
    if (!id) return;
    this.serviceService.getDetails(id).subscribe({
      next: (data) => {
        this.selectedServiceDetails.set(data);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des détails:', err);
        this.error.set('Erreur lors du chargement des détails du service');
      },
    });
  }

  protected closeDetails(): void {
    this.selectedServiceDetails.set(null);
  }

  protected viewPoleDetails(id: number | undefined): void {
    if (!id) return;
    this.serviceService.getPoleById(id).subscribe({
      next: (data) => {
        this.selectedPoleDetails.set(data);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des détails du pôle:', err);
        this.error.set('Erreur lors du chargement des détails du pôle');
      },
    });
  }

  protected closePoleDetails(): void {
    this.selectedPoleDetails.set(null);
  }

  protected viewPoleServices(id: number | undefined): void {
    if (!id) return;
    this.serviceService.getServicesOfPole(id).subscribe({
      next: (data) => {
        this.poleServices.set(data);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des services du pôle:', err);
        this.error.set('Erreur lors du chargement des services du pôle');
      },
    });
  }

  protected closePoleServices(): void {
    this.poleServices.set(null);
  }

  protected openAffectations(serviceId: number | undefined): void {
    if (!serviceId) return;
    // Naviguer vers la page des affectations avec le service_id en paramètre
    this.router.navigate(['/administration/affectations'], { queryParams: { service_id: serviceId } });
  }

  protected deleteService(id: number | undefined): void {
    if (!id) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce service?')) return;

    this.serviceService.delete(id).subscribe({
      next: () => {
        this.loadServices();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression:', err);
        this.error.set('Erreur lors de la suppression du service');
      },
    });
  }

  protected deletePole(id: number | undefined): void {
    if (!id) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce pôle?')) return;

    this.serviceService.deletePole(id).subscribe({
      next: () => {
        this.loadPoles();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression:', err);
        this.error.set('Erreur lors de la suppression du pôle');
      },
    });
  }

  protected get filteredServices(): Service[] {
    let filtered = this.services();

    // Filtre par recherche
    const term = this.searchTerm().toLowerCase();
    if (term) {
      filtered = filtered.filter(
        (s) =>
          s.nom.toLowerCase().includes(term) ||
          s.code.toLowerCase().includes(term) ||
          s.type_service?.toLowerCase().includes(term) ||
          s.description?.toLowerCase().includes(term)
      );
    }

    // Filtre par type
    const type = this.selectedType();
    if (type) {
      filtered = filtered.filter((s) => s.type_service === type);
    }

    // Filtre par pôle
    const pole = this.selectedPole();
    if (pole) {
      filtered = filtered.filter((s) => s.pole_id === parseInt(pole));
    }

    // Filtre par statut
    const status = this.selectedStatus();
    if (status !== '') {
      const isActive = status === 'true';
      filtered = filtered.filter((s) => s.actif === isActive);
    }

    return filtered;
  }

  protected get filteredPoles(): any[] {
    let filtered = this.poles();

    // Filtre par recherche
    const term = this.searchTerm().toLowerCase();
    if (term) {
      filtered = filtered.filter(
        (p) =>
          p.nom.toLowerCase().includes(term) ||
          p.code.toLowerCase().includes(term) ||
          p.type_pole?.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term)
      );
    }

    // Filtre par statut
    const status = this.selectedStatus();
    if (status !== '') {
      const isActive = status === 'true';
      filtered = filtered.filter((p) => p.actif === isActive);
    }

    return filtered;
  }
}
