import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PatientService, Patient, SearchCriteria } from '../services/patient.service';
import { ModalService } from '../services/modal.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-patients-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './patients-list.page.html',
  styleUrls: ['./patients-list.page.css'],
})
export class PatientsListPage implements OnInit {
  protected readonly patients = signal<Patient[]>([]);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly currentPage = signal<number>(1);
  protected readonly pageSize = signal<number>(10);
  protected readonly totalPatients = signal<number>(0);

  protected readonly searchNom = signal<string>('');
  protected readonly searchPrenom = signal<string>('');
  protected readonly searchHopital = signal<number | null>(null);
  protected readonly searchGroupeSanguin = signal<string>('');
  protected readonly searchActif = signal<boolean | null>(null);

  protected readonly showSearchForm = signal<boolean>(false);

  constructor(
    private readonly patientService: PatientService,
    private readonly modalService: ModalService,
    private readonly authService: AuthService
  ) {}

  protected canCreatePatient(): boolean {
    const user = this.authService.getCurrentUser();
    const roles = user?.roles ?? [];
    // Ajuste selon ta politique: ici on autorise Admin, Réceptionniste, RH, Directeur.
    return (
      roles.includes('ROLE_ADMIN') ||
      roles.includes('ROLE_RECEPTIONNISTE') ||
      roles.includes('ROLE_RH') ||
      roles.includes('ROLE_DIRECTEUR')
    );
  }

  protected canEditPatient(): boolean {
    // Même règle que la création (le médecin ne doit pas modifier)
    return this.canCreatePatient();
  }

  protected canDeletePatient(): boolean {
    // Suppression encore plus sensible: par défaut, uniquement ADMIN/RH
    const user = this.authService.getCurrentUser();
    const roles = user?.roles ?? [];
    return roles.includes('ROLE_ADMIN') || roles.includes('ROLE_RH');
  }

  ngOnInit(): void {
    this.loadPatients();
  }

  protected loadPatients(): void {
    this.loading.set(true);
    this.error.set(null);

    this.patientService.getPatients(this.currentPage(), this.pageSize()).subscribe({
      next: (response) => {
        this.patients.set(response.data || []);
        this.totalPatients.set(response.total || 0);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des patients:', err);
        this.error.set('Erreur lors du chargement des patients');
        this.loading.set(false);
      },
    });
  }

  protected search(): void {
    this.loading.set(true);
    this.error.set(null);

    const criteria: SearchCriteria = {
      page: this.currentPage(),
      limit: this.pageSize(),
    };

    if (this.searchNom()) criteria.nom = this.searchNom();
    if (this.searchPrenom()) criteria.prenom = this.searchPrenom();
    if (this.searchHopital()) criteria.hopitalId = this.searchHopital()!;
    if (this.searchGroupeSanguin()) criteria.groupeSanguin = this.searchGroupeSanguin();
    if (this.searchActif() !== null) criteria.actif = this.searchActif()!;

    this.patientService.searchPatients(criteria).subscribe({
      next: (response) => {
        this.patients.set(response.data || []);
        this.totalPatients.set(response.total || 0);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors de la recherche:', err);
        this.error.set('Erreur lors de la recherche');
        this.loading.set(false);
      },
    });
  }

  protected resetSearch(): void {
    this.searchNom.set('');
    this.searchPrenom.set('');
    this.searchHopital.set(null);
    this.searchGroupeSanguin.set('');
    this.searchActif.set(null);
    this.currentPage.set(1);
    this.loadPatients();
  }

  protected deletePatient(id: number | undefined): void {
    if (!id) return;

    this.modalService.confirm({
      title: 'Supprimer le patient',
      message: 'Êtes-vous sûr de vouloir supprimer ce patient ? Cette action est irréversible.',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      confirmClass: 'danger',
      icon: 'fa-trash'
    }).then((confirmed) => {
      if (confirmed) {
        this.patientService.deletePatient(id).subscribe({
          next: () => {
            this.loadPatients();
          },
          error: (err) => {
            console.error('Erreur lors de la suppression:', err);
            this.error.set('Erreur lors de la suppression du patient');
          },
        });
      }
    });
  }

  protected exportCSV(): void {
    this.patientService.exportCSV().subscribe({
      next: (blob) => {
        this.downloadFile(blob, 'patients.csv');
      },
      error: (err) => {
        console.error('Erreur lors de l\'export CSV:', err);
        this.error.set('Erreur lors de l\'export CSV');
      },
    });
  }

  protected exportPatientPDF(id: number | undefined): void {
    if (!id) return;

    this.patientService.exportPatientPDF(id).subscribe({
      next: (blob) => {
        this.downloadFile(blob, `patient_${id}.pdf`);
      },
      error: (err) => {
        console.error('Erreur lors de l\'export PDF:', err);
        this.error.set('Erreur lors de l\'export PDF');
      },
    });
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  protected nextPage(): void {
    if (this.currentPage() * this.pageSize() < this.totalPatients()) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadPatients();
    }
  }

  protected previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadPatients();
    }
  }

  protected get totalPages(): number {
    return Math.ceil(this.totalPatients() / this.pageSize());
  }
}
