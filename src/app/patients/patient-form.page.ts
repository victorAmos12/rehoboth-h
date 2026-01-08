import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PatientService, Patient } from '../services/patient.service';

@Component({
  selector: 'app-patient-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-form.page.html',
  styleUrls: ['./patient-form.page.css'],
})
export class PatientFormPage implements OnInit {
  protected readonly formData = signal<Patient>({
    nom: '',
    prenom: '',
    dateNaissance: '',
    sexe: 'M',
    email: '',
    telephone: '',
    hopitalId: 1,
    actif: true,
  });

  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);
  protected readonly isEditMode = signal<boolean>(false);
  protected readonly patientId = signal<number | null>(null);

  constructor(
    private readonly patientService: PatientService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const rawId = params['id'];
      if (rawId) {
        const id = Number(rawId);
        this.patientId.set(id);
        this.isEditMode.set(true);
        this.loadPatient(id);
      }
    });
  }

  private loadPatient(id: number): void {
    this.loading.set(true);
    this.patientService.getPatient(id).subscribe({
      next: (response) => {
        // Si l'API renvoie directement l'objet patient, patient.service normalise maintenant.
        console.log('PatientFormPage: Response reçue:', response);
        if (response.data) {
          console.log('PatientFormPage: Patient après normalisation:', response.data);
          this.formData.set(response.data);
        } else {
          // Debug utile si la réponse n'est pas celle attendue
          console.warn('PatientFormPage: réponse sans data', response);
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

  protected submit(): void {
    this.error.set(null);
    this.success.set(null);

    const data = this.formData();
    if (!data.nom || !data.prenom) {
      this.error.set('Le nom et le prénom sont obligatoires');
      return;
    }

    if (!data.email) {
      this.error.set('L\'email est obligatoire');
      return;
    }

    if (!data.telephone) {
      this.error.set('Le téléphone est obligatoire');
      return;
    }

    this.loading.set(true);

    if (this.isEditMode()) {
      this.patientService.updatePatient(this.patientId()!, data).subscribe({
        next: () => {
          this.success.set('Patient mis à jour avec succès');
          this.loading.set(false);
          setTimeout(() => {
            this.router.navigate(['/patients']);
          }, 1500);
        },
        error: (err) => {
          console.error('Erreur lors de la mise à jour:', err);
          this.error.set('Erreur lors de la mise à jour du patient');
          this.loading.set(false);
        },
      });
    } else {
      this.patientService.createPatient(data).subscribe({
        next: () => {
          this.success.set('Patient créé avec succès');
          this.loading.set(false);
          setTimeout(() => {
            this.router.navigate(['/patients']);
          }, 1500);
        },
        error: (err) => {
          console.error('Erreur lors de la création:', err);
          this.error.set('Erreur lors de la création du patient');
          this.loading.set(false);
        },
      });
    }
  }

  protected cancel(): void {
    this.router.navigate(['/patients']);
  }

  protected updatePatient(field: keyof Patient, value: any): void {
    const current = this.formData();
    const newValue = value.target?.value !== undefined ? value.target.value : value;
    const finalValue =
      field === 'hopitalId'
        ? parseInt(newValue, 10)
        : field === 'actif'
          ? value.target?.checked
          : newValue;
    
    this.formData.set({ ...current, [field]: finalValue });
  }
}
