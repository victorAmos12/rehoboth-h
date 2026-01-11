import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, effect } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UtilisateursService, UtilisateurDetail } from './services/utilisateurs.service';
import { ToastService } from '../../services/toast.service';
import { RolesService, Role } from '../../parametres/roles/services/roles.service';
import { SpecialitesService, Specialite } from '../../services/specialites.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-utilisateur-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './utilisateur-form.page.html',
  styleUrls: ['./utilisateur-form.page.css'],
})
export class UtilisateurFormPage implements OnInit {
  protected readonly loading = signal(false);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly user = signal<UtilisateurDetail | null>(null);
  protected readonly hopitaux = signal<any[]>([]);
  protected readonly roles = signal<Role[]>([]);
  protected readonly profils = signal<any[]>([]);
  protected readonly specialites = signal<any[]>([]);
  protected readonly userHopitalId = signal<number | null>(null);
  protected readonly photoPreview = signal<string | null>(null);

  protected form!: FormGroup;
  private userId: number = 0;
  private isEditMode = false;
  private photoFile: File | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly service: UtilisateursService,
    private readonly toast: ToastService,
    private readonly rolesService: RolesService,
    private readonly specialitesService: SpecialitesService,
    private readonly authService: AuthService,
    private readonly http: HttpClient
  ) {
    this.initForm();

    // Effet pour pré-sélectionner le premier hôpital quand les hôpitaux sont chargés
    effect(() => {
      const hopitaux = this.hopitaux();
      if (!this.isEditMode && hopitaux.length > 0 && !this.form.get('hopital_id')?.value) {
        this.form.patchValue({ hopital_id: hopitaux[0].id });
      }
    });
  }

  ngOnInit(): void {
    // Charger les données communes (rôles, profils, hôpitaux)
    this.loadCommonData();

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id && !Number.isNaN(id)) {
      this.userId = id;
      this.isEditMode = true;
      this.loadUser(id);
    } else {
      // Mode création : le mot de passe est requis
      this.form.get('mot_de_passe')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.form.get('mot_de_passe')?.updateValueAndValidity();
    }
  }

  private loadCommonData(): void {
    // Charger les rôles
    this.rolesService.list(1, 100).subscribe({
      next: (res) => {
        this.roles.set(res.data ?? []);
      },
      error: (e) => {
        console.error('Erreur lors du chargement des rôles:', e);
      },
    });

    // Charger les profils via l'API
    this.loadProfils();

    // Charger les hôpitaux
    this.loadHopitaux();

    // Charger les spécialités
    this.loadSpecialites();
  }

  private loadSpecialites(): void {
    this.specialitesService.list(1, 100).subscribe({
      next: (res) => {
        this.specialites.set(res.data ?? []);
      },
      error: (e) => {
        console.error('Erreur lors du chargement des spécialités:', e);
      },
    });
  }

  private loadProfils(): void {
    // Charger les profils via l'API
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      Accept: 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    });

    const url = `${environment.apiUrl}/api/roles-profils/profils`;
    this.http.get<any>(url, { headers }).subscribe({
      next: (res: any) => {
        this.profils.set(res.data ?? []);
      },
      error: (e: any) => {
        console.error('Erreur lors du chargement des profils:', e);
      },
    });
  }

  private loadHopitaux(): void {
    // Charger les hôpitaux via l'API
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      Accept: 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    });

    // Charger les hôpitaux
    const url = `${environment.apiUrl}/api/hopitaux`;
    this.http.get<any>(url, { headers }).subscribe({
      next: (res: any) => {
        const hopitaux = res.data ?? [];
        this.hopitaux.set(hopitaux);
        
        // Pré-sélectionner le premier hôpital par défaut si en mode création
        if (!this.isEditMode && hopitaux.length > 0) {
          this.form.patchValue({ hopital_id: hopitaux[0].id });
        }
      },
      error: (e: any) => {
        console.error('Erreur lors du chargement des hôpitaux:', e);
      },
    });
  }

  private initForm(): void {
    this.form = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      login: ['', [Validators.required, Validators.minLength(3)]],
      telephone: [''],
      mot_de_passe: [''],
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
      date_embauche: [''],
      bio: [''],
      hopital_id: ['', Validators.required],
      role_id: ['', Validators.required],
      profil_id: ['', Validators.required],
      specialite_id: [''],
      actif: [true],
      contact_urgence_nom: [''],
      telephone_urgence: [''],
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
      hopital_id: user.informations_administratives.hopital?.id,
      role_id: user.informations_administratives.role?.id,
      profil_id: user.informations_administratives.profil?.id,
      specialite_id: user.informations_professionnelles.specialite?.id,
      actif: user.securite.actif,
      contact_urgence_nom: user.informations_personnelles.contact_urgence?.nom,
      telephone_urgence: user.informations_personnelles.contact_urgence?.telephone,
    });

    // Charger la photo de profil existante
    if (user.informations_professionnelles.photo_profil) {
      this.photoPreview.set(user.informations_professionnelles.photo_profil);
    }
  }

  protected onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Vérifier que c'est une image
      if (!file.type.startsWith('image/')) {
        this.toast.warning('Veuillez sélectionner une image');
        return;
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.toast.warning('La photo ne doit pas dépasser 5MB');
        return;
      }

      this.photoFile = file;

      // Debug: log file info pour s'assurer qu'il est bien sélectionné
      console.log('onPhotoSelected:', { name: file.name, type: file.type, size: file.size });

      // Afficher l'aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        this.photoPreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  protected removePhoto(): void {
    this.photoFile = null;
    this.photoPreview.set(null);
  }

  protected submit(): void {
    if (!this.form.valid) {
      this.toast.warning('Veuillez remplir tous les champs requis');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const formValue = this.form.value;
    
    // Créer un FormData pour supporter l'upload de fichier
    const formData = new FormData();
    
    // Ajouter tous les champs texte
    formData.append('nom', formValue.nom);
    formData.append('prenom', formValue.prenom);
    formData.append('email', formValue.email);
    formData.append('login', formValue.login);
    formData.append('telephone', formValue.telephone || '');
    formData.append('hopital_id', String(Number(formValue.hopital_id)));
    formData.append('role_id', String(Number(formValue.role_id)));
    formData.append('profil_id', String(Number(formValue.profil_id)));
    formData.append('specialite_id', formValue.specialite_id ? String(Number(formValue.specialite_id)) : '');
    formData.append('actif', String(formValue.actif === true || formValue.actif === 'true' ? 1 : 0));
    formData.append('adresse', formValue.adresse || '');
    formData.append('ville', formValue.ville || '');
    formData.append('code_postal', formValue.code_postal || '');
    formData.append('date_naissance', formValue.date_naissance || '');
    formData.append('sexe', formValue.sexe || '');
    formData.append('nationalite', formValue.nationalite || '');
    formData.append('numero_identite', formValue.numero_identite || '');
    formData.append('type_identite', formValue.type_identite || '');
    formData.append('numero_licence', formValue.numero_licence || '');
    formData.append('numero_ordre', formValue.numero_ordre || '');
    formData.append('date_embauche', formValue.date_embauche || '');
    formData.append('bio', formValue.bio || '');
    formData.append('contact_urgence_nom', formValue.contact_urgence_nom || '');
    formData.append('telephone_urgence', formValue.telephone_urgence || '');

    // Ajouter le mot de passe uniquement en mode création
    if (!this.isEditMode) {
      if (formValue.mot_de_passe) {
        formData.append('mot_de_passe', formValue.mot_de_passe);
      } else {
        // Le mot de passe est requis en création
        this.toast.warning('Le mot de passe est requis');
        this.submitting.set(false);
        return;
      }
    }

    // Ajouter la photo de profil si elle a été sélectionnée
    if (this.photoFile) {
      formData.append('photo_profil', this.photoFile);
    }

    // Log du payload pour débogage
    console.log('FormData envoyé au backend');
    console.log('Mode édition:', this.isEditMode);
    console.log('Photo présente:', !!this.photoFile);

    // Debug: si une photo est présente, lister les champs du FormData pour vérifier
    if (this.photoFile) {
      for (const [k, v] of (formData as any).entries()) {
        console.log('FormData field:', k, v);
      }
    }

    // En mode édition, utiliser l'endpoint /profile si une photo est présente
    // Sinon utiliser l'endpoint standard (JSON si pas de fichier)
    let request: Observable<any>;
    
    if (this.isEditMode) {
      if (this.photoFile) {
        // Utiliser le nouvel endpoint /profile pour les uploads de fichiers
        console.log('submit: édition avec photo -> updateProfileWithFile', { userId: this.userId });
        request = this.service.updateProfileWithFile(this.userId, formData);
      } else {
        // Utiliser l'endpoint standard pour les mises à jour sans fichier (envoyer JSON)
        const payload: any = {
          nom: formValue.nom,
          prenom: formValue.prenom,
          email: formValue.email,
          login: formValue.login,
          telephone: formValue.telephone || '',
          hopital_id: Number(formValue.hopital_id),
          role_id: Number(formValue.role_id),
          profil_id: Number(formValue.profil_id),
          specialite_id: formValue.specialite_id ? Number(formValue.specialite_id) : null,
          actif: formValue.actif === true || formValue.actif === 'true' ? 1 : 0,
          adresse: formValue.adresse || '',
          ville: formValue.ville || '',
          code_postal: formValue.code_postal || '',
          date_naissance: formValue.date_naissance || '',
          sexe: formValue.sexe || '',
          nationalite: formValue.nationalite || '',
          numero_identite: formValue.numero_identite || '',
          type_identite: formValue.type_identite || '',
          numero_licence: formValue.numero_licence || '',
          numero_ordre: formValue.numero_ordre || '',
          date_embauche: formValue.date_embauche || '',
          bio: formValue.bio || '',
          contact_urgence_nom: formValue.contact_urgence_nom || '',
          telephone_urgence: formValue.telephone_urgence || ''
        };
        console.log('submit: édition sans photo -> update (JSON payload)', payload);
        request = this.service.update(this.userId, payload);
      }
    } else {
      // En création, utiliser l'endpoint standard (JSON) si aucune photo, sinon multipart
      if (this.photoFile) {
        console.log('submit: création avec photo -> createWithFile');
        request = this.service.createWithFile(formData);
      } else {
        const payload: any = {
          nom: formValue.nom,
          prenom: formValue.prenom,
          email: formValue.email,
          login: formValue.login,
          telephone: formValue.telephone || '',
          hopital_id: Number(formValue.hopital_id),
          role_id: Number(formValue.role_id),
          profil_id: Number(formValue.profil_id),
          specialite_id: formValue.specialite_id ? Number(formValue.specialite_id) : null,
          actif: formValue.actif === true || formValue.actif === 'true' ? 1 : 0,
          adresse: formValue.adresse || '',
          ville: formValue.ville || '',
          code_postal: formValue.code_postal || '',
          date_naissance: formValue.date_naissance || '',
          sexe: formValue.sexe || '',
          nationalite: formValue.nationalite || '',
          numero_identite: formValue.numero_identite || '',
          type_identite: formValue.type_identite || '',
          numero_licence: formValue.numero_licence || '',
          numero_ordre: formValue.numero_ordre || '',
          date_embauche: formValue.date_embauche || '',
          bio: formValue.bio || '',
          contact_urgence_nom: formValue.contact_urgence_nom || '',
          telephone_urgence: formValue.telephone_urgence || '',
          mot_de_passe: formValue.mot_de_passe
        };
        console.log('submit: création sans photo -> create (JSON payload)', { login: payload.login, email: payload.email });
        request = this.service.create(payload);
      }
    }

    request.subscribe({
      next: (res) => {
        this.toast.success(
          this.isEditMode
            ? 'Utilisateur modifié avec succès'
            : 'Utilisateur créé avec succès'
        );
        this.submitting.set(false);

        // Si le backend renvoie le chemin de la photo, mettre à jour l'aperçu
        const data: any = res?.data;
        const photoPath = data?.photo_profil ?? data?.photoProfil ?? null;
        if (photoPath) {
          const full = photoPath.startsWith('http') ? photoPath : `${environment.apiUrl}${photoPath.startsWith('/') ? '' : '/'}${photoPath}`;
          this.photoPreview.set(full);
        }

        // Redirection vers la page de détail si modification, sinon vers la liste
        if (this.isEditMode) {
          this.router.navigate(['/rh/utilisateurs', this.userId]);
        } else {
          // Pour la création, rediriger vers la liste
          this.router.navigate(['/rh/utilisateurs']);
        }
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
