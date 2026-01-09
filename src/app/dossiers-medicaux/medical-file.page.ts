import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MedicalFileService, MedicalFile, FamilyHistory, Vaccination, CriticalInfo } from '../dossiers-medicaux/services/medical-file.service';
import { PatientService, Patient } from '../services/patient.service';
import { ModalService } from '../services/modal.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-medical-file',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './medical-file.page.html',
  styleUrls: ['./medical-file.page.css'],
})
export class MedicalFilePage implements OnInit {
  protected readonly patient = signal<Patient | null>(null);
  protected readonly medicalFile = signal<MedicalFile | null>(null);
  protected readonly familyHistories = signal<FamilyHistory[]>([]);
  protected readonly vaccinations = signal<Vaccination[]>([]);
  protected readonly criticalInfos = signal<CriticalInfo[]>([]);

  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly patientId = signal<number | null>(null);
  protected readonly medicalFileId = signal<number | null>(null);
  protected readonly exporting = signal<boolean>(false);

  protected readonly activeTab = signal<'overview' | 'family' | 'vaccinations' | 'critical'>('overview');
  protected readonly showAddFamilyHistory = signal<boolean>(false);
  protected readonly showAddVaccination = signal<boolean>(false);
  protected readonly showAddCriticalInfo = signal<boolean>(false);

  protected readonly familyHistoryForm = new FormGroup({
    relation: new FormControl('', Validators.required),
    maladie: new FormControl('', Validators.required),
    description: new FormControl(''),
  });

  protected readonly vaccinationForm = new FormGroup({
    nom: new FormControl('', Validators.required),
    dateVaccination: new FormControl('', Validators.required),
    dateProchainRappel: new FormControl(''),
    medecin: new FormControl(''),
    notes: new FormControl(''),
  });

  protected readonly criticalInfoForm = new FormGroup({
    type: new FormControl('', Validators.required),
    description: new FormControl('', Validators.required),
    severite: new FormControl('moyen', Validators.required),
  });

  constructor(
    private readonly medicalFileService: MedicalFileService,
    private readonly patientService: PatientService,
    private readonly modalService: ModalService,
    private readonly toastService: ToastService,
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
        this.loadMedicalFile(id);
      }
    });
  }

  private loadPatient(id: number): void {
    this.patientService.getPatient(id).subscribe({
      next: (response) => {
        if (response.data) {
          this.patient.set(response.data);
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement du patient:', err);
        this.error.set('Erreur lors du chargement du patient');
      },
    });
  }

  private loadMedicalFile(patientId: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.medicalFileService.getActiveMedicalFile(patientId).subscribe({
      next: (response) => {
        if (response.data && response.data.id) {
          this.medicalFile.set(response.data);
          this.medicalFileId.set(response.data.id);
          this.loadMedicalFileDetails(response.data.id);
        } else {
          this.error.set('Aucun dossier médical actif trouvé');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement du dossier médical:', err);
        this.error.set('Erreur lors du chargement du dossier médical');
        this.loading.set(false);
      },
    });
  }

  private loadMedicalFileDetails(medicalFileId: number | undefined): void {
    if (!medicalFileId) return;

    this.medicalFileService.getFamilyHistory(medicalFileId).subscribe({
      next: (response) => {
        if (Array.isArray(response.data)) {
          this.familyHistories.set(response.data);
        } else if (response.data) {
          this.familyHistories.set([response.data]);
        }
      },
      error: (err) => console.error('Erreur lors du chargement des antécédents:', err),
    });

    this.medicalFileService.getVaccinations(medicalFileId).subscribe({
      next: (response) => {
        if (Array.isArray(response.data)) {
          this.vaccinations.set(response.data);
        } else if (response.data) {
          this.vaccinations.set([response.data]);
        }
      },
      error: (err) => console.error('Erreur lors du chargement des vaccinations:', err),
    });

    this.medicalFileService.getCriticalInfo(medicalFileId).subscribe({
      next: (response) => {
        if (Array.isArray(response.data)) {
          this.criticalInfos.set(response.data);
        } else if (response.data) {
          this.criticalInfos.set([response.data]);
        }
      },
      error: (err) => console.error('Erreur lors du chargement des infos critiques:', err),
    });
  }

  protected addFamilyHistory(): void {
    if (this.familyHistoryForm.invalid) {
      this.toastService.error('Veuillez remplir tous les champs requis');
      return;
    }

    const medicalFileId = this.medicalFileId();
    if (!medicalFileId) {
      this.toastService.error('Dossier médical non trouvé');
      return;
    }

    const formValue = this.familyHistoryForm.getRawValue();
    const payload: Partial<FamilyHistory> = {
      relation: formValue.relation || undefined,
      maladie: formValue.maladie || undefined,
      description: formValue.description || undefined,
    };

    this.medicalFileService.addFamilyHistory(medicalFileId, payload).subscribe({
      next: () => {
        this.toastService.success('Antécédent familial ajouté');
        this.familyHistoryForm.reset();
        this.showAddFamilyHistory.set(false);
        this.loadMedicalFileDetails(medicalFileId);
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.toastService.error("Erreur lors de l'ajout de l'antécédent");
      },
    });
  }

  protected deleteFamilyHistory(id: number): void {
    this.modalService
      .confirm({
        title: 'Supprimer',
        message: 'Êtes-vous sûr de vouloir supprimer cet antécédent ?',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        confirmClass: 'danger',
      })
      .then((confirmed) => {
        if (confirmed) {
          const medicalFileId = this.medicalFileId();
          if (medicalFileId) {
            this.medicalFileService.deleteFamilyHistory(medicalFileId, id).subscribe({
              next: () => {
                this.toastService.success('Antécédent supprimé');
                this.loadMedicalFileDetails(medicalFileId);
              },
              error: (err) => {
                console.error('Erreur:', err);
                this.toastService.error('Erreur lors de la suppression');
              },
            });
          }
        }
      });
  }

  protected addVaccination(): void {
    if (this.vaccinationForm.invalid) {
      this.toastService.error('Veuillez remplir tous les champs requis');
      return;
    }

    const medicalFileId = this.medicalFileId();
    if (!medicalFileId) {
      this.toastService.error('Dossier médical non trouvé');
      return;
    }

    const formValue = this.vaccinationForm.getRawValue();
    const payload: Partial<Vaccination> = {
      nom: formValue.nom || undefined,
      dateVaccination: formValue.dateVaccination || undefined,
      dateProchainRappel: formValue.dateProchainRappel || undefined,
      medecin: formValue.medecin || undefined,
      notes: formValue.notes || undefined,
    };

    this.medicalFileService.addVaccination(medicalFileId, payload).subscribe({
      next: () => {
        this.toastService.success('Vaccination ajoutée');
        this.vaccinationForm.reset();
        this.showAddVaccination.set(false);
        this.loadMedicalFileDetails(medicalFileId);
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.toastService.error("Erreur lors de l'ajout de la vaccination");
      },
    });
  }

  protected deleteVaccination(id: number): void {
    this.modalService
      .confirm({
        title: 'Supprimer',
        message: 'Êtes-vous sûr de vouloir supprimer cette vaccination ?',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        confirmClass: 'danger',
      })
      .then((confirmed) => {
        if (confirmed) {
          const medicalFileId = this.medicalFileId();
          if (medicalFileId) {
            this.medicalFileService.deleteVaccination(medicalFileId, id).subscribe({
              next: () => {
                this.toastService.success('Vaccination supprimée');
                this.loadMedicalFileDetails(medicalFileId);
              },
              error: (err) => {
                console.error('Erreur:', err);
                this.toastService.error('Erreur lors de la suppression');
              },
            });
          }
        }
      });
  }

  protected addCriticalInfo(): void {
    if (this.criticalInfoForm.invalid) {
      this.toastService.error('Veuillez remplir tous les champs requis');
      return;
    }

    const medicalFileId = this.medicalFileId();
    if (!medicalFileId) {
      this.toastService.error('Dossier médical non trouvé');
      return;
    }

    const formValue = this.criticalInfoForm.getRawValue();
    const payload: Partial<CriticalInfo> = {
      type: formValue.type || undefined,
      description: formValue.description || undefined,
      severite: formValue.severite || undefined,
    };

    this.medicalFileService.addCriticalInfo(medicalFileId, payload).subscribe({
      next: () => {
        this.toastService.success('Information critique ajoutée');
        this.criticalInfoForm.reset();
        this.showAddCriticalInfo.set(false);
        this.loadMedicalFileDetails(medicalFileId);
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.toastService.error("Erreur lors de l'ajout de l'information");
      },
    });
  }

  protected deleteCriticalInfo(id: number): void {
    this.modalService
      .confirm({
        title: 'Supprimer',
        message: 'Êtes-vous sûr de vouloir supprimer cette information critique ?',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        confirmClass: 'danger',
      })
      .then((confirmed) => {
        if (confirmed) {
          const medicalFileId = this.medicalFileId();
          if (medicalFileId) {
            this.medicalFileService.deleteCriticalInfo(medicalFileId, id).subscribe({
              next: () => {
                this.toastService.success('Information supprimée');
                this.loadMedicalFileDetails(medicalFileId);
              },
              error: (err) => {
                console.error('Erreur:', err);
                this.toastService.error('Erreur lors de la suppression');
              },
            });
          }
        }
      });
  }

  protected exportPDF(): void {
    const medicalFileId = this.medicalFileId();
    if (!medicalFileId) {
      this.toastService.error('Dossier médical non trouvé');
      return;
    }

    this.exporting.set(true);
    this.medicalFileService.exportMedicalFilePDF(medicalFileId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const patient = this.patient();
        const fileName = patient
          ? `dossier_medical_${patient.nom}_${patient.prenom}.pdf`
          : `dossier_medical_${medicalFileId}.pdf`;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);
        this.toastService.success('PDF téléchargé avec succès');
        this.exporting.set(false);
      },
      error: (err) => {
        console.error('Erreur lors de l\'export PDF:', err);
        const msg = err?.error?.message || err?.message || 'Erreur lors de l\'export PDF';
        this.toastService.error(msg);
        this.exporting.set(false);
      },
    });
  }

  protected goBack(): void {
    // Retourner au patient
    this.router.navigate(['/patients', this.patientId()]);
  }
}
