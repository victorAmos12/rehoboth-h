import { Routes } from '@angular/router';
import { LoginPage } from './login/login.page';
import { LayoutPage } from './layout/layout.page';
import { ForgotPasswordPage } from './forgot-password/forgot-password.page';
import { DashboardPageNew } from './dashboard/dashboard-new.page';
import { PatientsListPage } from './patients/patients-list.page';
import { PatientFormPage } from './patients/patient-form.page';
import { PatientDetailPage } from './patients/patient-detail.page';
import { MedicalFilePage } from './dossiers-medicaux/medical-file.page';
import { DossiersMedicauxListPage } from './dossiers-medicaux/dossiers-medicaux-list.page';
import { DossiersMedicauxCreatePage } from './dossiers-medicaux/dossiers-medicaux-create.page';
import { UtilisateursListPage } from './rh/utilisateurs/utilisateurs-list.page';
import { UtilisateurDetailPage } from './rh/utilisateurs/utilisateur-detail.page';
import { UtilisateurFormPage } from './rh/utilisateurs/utilisateur-form.page';
import { RolesListPage } from './parametres/roles/roles-list.page';
import { RoleDetailPage } from './parametres/roles/role-detail.page';

import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginPage },
  { path: 'forgot-password', component: ForgotPasswordPage },
  {
    path: '',
    component: LayoutPage,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardPageNew },
      { path: 'patients', component: PatientsListPage },
      { path: 'patients/list', component: PatientsListPage },
      { path: 'patients/create', component: PatientFormPage },
      { path: 'patients/:id', component: PatientDetailPage },
      { path: 'patients/:id/edit', component: PatientFormPage },
      { path: 'patients/:id/dossier-medical', component: MedicalFilePage },
      // Alias plus cohérent (si le backend envoie une route côté menu)
      { path: 'dossiers-medicaux/patient/:id', component: MedicalFilePage },
      { path: 'patients/export/csv', redirectTo: 'patients', pathMatch: 'full' },

      // Dossiers médicaux (écrans dédiés)
      { path: 'dossiers-medicaux', redirectTo: 'dossiers-medicaux/list', pathMatch: 'full' },
      { path: 'dossiers-medicaux/list', component: DossiersMedicauxListPage },
      { path: 'dossiers-medicaux/create', component: DossiersMedicauxCreatePage },

      // Ressources Humaines
      { path: 'rh/utilisateurs', component: UtilisateursListPage },
      { path: 'rh/utilisateurs/:id', component: UtilisateurDetailPage },
      { path: 'rh/utilisateurs/:id/edit', component: UtilisateurFormPage },
      // Alias de compatibilité si l'API menu envoie /api/utilisateurs
      { path: 'api/utilisateurs', redirectTo: 'rh/utilisateurs', pathMatch: 'full' },

      // Paramètres
      { path: 'parametres/roles', component: RolesListPage },
      { path: 'parametres/roles/:id', component: RoleDetailPage },
      // Alias de compatibilité si l'API menu envoie /api/roles-profils/roles
      { path: 'api/roles-profils/roles', redirectTo: 'parametres/roles', pathMatch: 'full' },
    ],
  },
];
