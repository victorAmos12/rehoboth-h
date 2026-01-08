import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PatientService, Patient } from '../services/patient.service';
import { ModalService } from '../services/modal.service';
import { CanDirective } from '../directives/can.directive';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, CanDirective],
  templateUrl: './patient-detail.page.html',
  styleUrls: ['./patient-detail.page.css'],
})
export class PatientDetailPage implements OnInit {
  protected readonly patient = signal<Patient | null>(null);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly patientId = signal<number | null>(null);

  constructor(
    private readonly patientService: PatientService,
    private readonly modalService: ModalService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const rawId = params['id'];
      if (rawId) {
        const id = Number(rawId);
        this.patientId.set(id);
        this.loadPatient(id);
      }
    });
  }

  private loadPatient(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.patientService.getPatient(id).subscribe({
      next: (response) => {
        console.log('PatientDetailPage: Response reçue:', response);
        if (response.data) {
          console.log('PatientDetailPage: Patient après normalisation:', response.data);
          this.patient.set(response.data);
        } else {
          console.warn('PatientDetailPage: Pas de données dans la réponse');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement du patient:', err);
        this.error.set('Erreur lors du chargement du patient');
        this.loading.set(false);
      },
    });
  }

  protected editPatient(): void {
    this.router.navigate(['/patients', this.patientId(), 'edit']);
  }

  protected deletePatient(): void {
    this.modalService.confirm({
      title: 'Supprimer le patient',
      message: 'Êtes-vous sûr de vouloir supprimer ce patient ? Cette action est irréversible.',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      confirmClass: 'danger',
      icon: 'fa-trash'
    }).then((confirmed) => {
      if (confirmed) {
        this.patientService.deletePatient(this.patientId()!).subscribe({
          next: () => {
            this.router.navigate(['/patients']);
          },
          error: (err) => {
            // console.error('Erreur lors de la suppression:', err);
            this.error.set('Erreur lors de la suppression du patient');
          },
        });
      }
    });
  }

  protected exportPDF(): void {
    const id = this.patientId();
    if (!id) {
      this.error.set('Patient introuvable (id manquant)');
      return;
    }

    this.patientService.exportPatientPDF(id).subscribe({
      next: (blob) => {
        this.downloadFile(blob, `patient_${id}.pdf`);
      },
      error: (err) => {
        // console.error('Erreur lors de l\'export PDF:', err);
        // Message explicite (ne pas confondre avec chargement patient)
        this.error.set('Erreur lors de l\'export PDF');
      },
    });
  }

  protected exportDossierMedical(): void {
    const id = this.patientId();
    if (!id) {
      this.error.set('Patient introuvable (id manquant)');
      return;
    }

    this.patientService.exportDossierMedical(id).subscribe({
      next: (blob) => {
        this.downloadFile(blob, `dossier_medical_${id}.pdf`);
      },
      error: (err) => {
        // console.error('Erreur lors de l\'export du dossier médical:', err);
        this.error.set("Erreur lors de l'export du dossier médical");
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

  protected calculateAge(dateNaissance: string): number {
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }
}
