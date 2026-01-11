import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SpecialitesService } from '../../services/specialites.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-specialite-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './specialite-form.page.html',
  styleUrls: ['./specialite-form.page.css'],
})
export class SpecialiteFormPage implements OnInit {
  protected readonly loading = signal(false);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly specialite = signal<any | null>(null);

  protected form!: FormGroup;
  private specialiteId: number = 0;
  private isEditMode = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly service: SpecialitesService,
    private readonly toast: ToastService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id && !Number.isNaN(id)) {
      this.specialiteId = id;
      this.isEditMode = true;
      this.loadSpecialite(id);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      code: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      code_snomed: [''],
      icone: [''],
      couleur: [''],
      actif: [true],
    });
  }

  private loadSpecialite(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.get(id).subscribe({
      next: (res) => {
        if (res.data) {
          this.specialite.set(res.data);
          this.populateForm(res.data);
        }
        this.loading.set(false);
      },
      error: (e) => {
        const msg = e?.error?.error || e?.error?.message || "Erreur lors du chargement de la spécialité.";
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  private populateForm(specialite: any): void {
    this.form.patchValue({
      nom: specialite.nom,
      code: specialite.code,
      description: specialite.description,
      code_snomed: specialite.code_snomed,
      icone: specialite.icone,
      couleur: specialite.couleur,
      actif: specialite.actif,
    });
  }

  protected submit(): void {
    if (!this.form.valid) {
      this.toast.warning('Veuillez remplir tous les champs requis');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const payload = {
      nom: this.form.value.nom,
      code: this.form.value.code,
      description: this.form.value.description || null,
      code_snomed: this.form.value.code_snomed || null,
      icone: this.form.value.icone || null,
      couleur: this.form.value.couleur || null,
      actif: this.form.value.actif === true || this.form.value.actif === 'true' ? 1 : 0,
    };

    const request = this.isEditMode
      ? this.service.update(this.specialiteId, payload)
      : this.service.create(payload);

    request.subscribe({
      next: (res) => {
        this.toast.success(
          this.isEditMode
            ? 'Spécialité modifiée avec succès'
            : 'Spécialité créée avec succès'
        );
        this.submitting.set(false);
        this.router.navigate(['/administration/specialites']);
      },
      error: (e) => {
        const msg = e?.error?.error || e?.error?.message || 'Erreur lors de la sauvegarde';
        this.error.set(msg);
        this.toast.error(msg);
        this.submitting.set(false);
      },
    });
  }

  protected goBack(): void {
    this.router.navigate(['/administration/specialites']);
  }

  protected get isSubmitDisabled(): boolean {
    return !this.form.valid || this.submitting();
  }
}
