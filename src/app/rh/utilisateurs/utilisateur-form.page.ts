import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UtilisateursService, UtilisateurDetail } from './services/utilisateurs.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-utilisateur-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './utilisateur-form.page.html',
  styleUrls: ['./utilisateur-form.page.css'],
})
export class UtilisateurFormPage implements OnInit {
  protected readonly loading = signal(false);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly user = signal<UtilisateurDetail | null>(null);

  protected form!: FormGroup;
  private userId: number = 0;
  private isEditMode = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly service: UtilisateursService,
    private readonly toast: ToastService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id && !Number.isNaN(id)) {
      this.userId = id;
      this.isEditMode = true;
      this.loadUser(id);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      login: ['', [Validators.required, Validators.minLength(3)]],
      telephone: [''],
      adresse: [''],
      ville: [''],
      code_postal: [''],
      date_naissance: [''],
      sexe: [''],
      nationalite: [''],
      numero_identite: [''],
      type_identite: [''],
      numero_licence: [''],
      numero_ordre: [''],
      date_embauche: ['', Validators.required],
      bio: [''],
    });
  }

  private loadUser(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getDetail(id).subscribe({
      next: (res) => {
        if (res.data) {
          this.user.set(res.data);
          this.populateForm(res.data);
        }
        this.loading.set(false);
      },
      error: (e) => {
        const msg = e?.error?.error || e?.error?.message || "Erreur lors du chargement de l'utilisateur.";
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  private populateForm(user: UtilisateurDetail): void {
    this.form.patchValue({
      nom: user.identite.nom,
      prenom: user.identite.prenom,
      email: user.identite.email,
      login: user.identite.login,
      telephone: user.informations_personnelles.telephone,
      adresse: user.informations_personnelles.adresse,
      ville: user.informations_personnelles.ville,
      code_postal: user.informations_personnelles.code_postal,
      date_naissance: user.informations_personnelles.date_naissance,
      sexe: user.informations_personnelles.sexe,
      nationalite: user.informations_personnelles.nationalite,
      numero_identite: user.informations_personnelles.numero_identite,
      type_identite: user.informations_personnelles.type_identite,
      numero_licence: user.informations_professionnelles.numero_licence,
      numero_ordre: user.informations_professionnelles.numero_ordre,
      date_embauche: user.informations_professionnelles.date_embauche,
      bio: user.informations_professionnelles.bio,
    });
  }

  protected submit(): void {
    if (!this.form.valid) {
      this.toast.warning('Veuillez remplir tous les champs requis');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const payload = this.form.value;

    const request = this.isEditMode
      ? this.service.update(this.userId, payload)
      : this.service.create(payload);

    request.subscribe({
      next: (res) => {
        this.toast.success(
          this.isEditMode
            ? 'Utilisateur modifié avec succès'
            : 'Utilisateur créé avec succès'
        );
        this.submitting.set(false);
        this.router.navigate(['/rh/utilisateurs']);
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
    if (this.isEditMode) {
      this.router.navigate(['/rh/utilisateurs', this.userId]);
    } else {
      this.router.navigate(['/rh/utilisateurs']);
    }
  }

  protected get isSubmitDisabled(): boolean {
    return !this.form.valid || this.submitting();
  }
}
