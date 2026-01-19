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
import { UtilisateurCardsPage } from './rh/utilisateurs/utilisateur-cards.page';
import { RolesListPage } from './parametres/roles/roles-list.page';
import { RoleDetailPage } from './parametres/roles/role-detail.page';
import { ChambresListPage } from './parametres/chambres/chambres-list.page';
import { ChambreFormPage } from './parametres/chambres/chambre-form.page';
import { ChambreDetailPage } from './parametres/chambres/chambre-detail.page';
import { ServicesListPage } from './parametres/services/services-list.page';
import { ServiceFormPage } from './parametres/services/service-form.page';
import { PoleFormPage } from './parametres/poles/pole-form.page';
import { AffectationsListPage } from './parametres/affectations/affectations-list.page';
import { LitsListPage } from './parametres/lits/lits-list.page';
import { LitFormPage } from './parametres/lits/lit-form.page';
import { LitDetailPage } from './parametres/lits/lit-detail.page';
import { EquipementsListPage } from './parametres/equipements/equipements-list.page';
import { EquipementFormPage } from './parametres/equipements/equipement-form.page';
import { MaintenancesListPage } from './parametres/maintenances/maintenances-list.page';
import { MaintenanceFormPage } from './parametres/maintenances/maintenance-form.page';
import { SpecialitesListPage } from './parametres/specialites/specialites-list.page';
import { SpecialiteFormPage } from './parametres/specialites/specialite-form.page';
import { LogsAuditListPage } from './administrations/logs-audit/logs-audit-list.page';
import { LogsStatsPage } from './administrations/logs-audit/logs-stats.page';
import { LogsTracePage } from './administrations/logs-audit/logs-trace.page';
import { SauvegardesListPage } from './administrations/sauvegardes/sauvegardes-list.page';

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
      { path: 'rh/utilisateurs/create', component: UtilisateurFormPage },
      { path: 'rh/utilisateurs/:id', component: UtilisateurDetailPage },
      { path: 'rh/utilisateurs/:id/cartes', component: UtilisateurCardsPage },
      { path: 'rh/utilisateurs/:id/edit', component: UtilisateurFormPage },
      // Alias de compatibilité si l'API menu envoie /api/utilisateurs
      { path: 'api/utilisateurs', redirectTo: 'rh/utilisateurs', pathMatch: 'full' },

      // Paramètres
      { path: 'parametres/roles', component: RolesListPage },
      { path: 'parametres/roles/:id', component: RoleDetailPage },
      // Alias de compatibilité si l'API menu envoie /api/roles-profils/roles
      { path: 'api/roles-profils/roles', redirectTo: 'parametres/roles', pathMatch: 'full' },

      // Paramètres - Logs & Sauvegardes (alias pour compatibilité avec le mapping du backend)
      { path: 'parametres/logs', redirectTo: 'administration/logs-audit', pathMatch: 'full' },
      { path: 'parametres/logs-audit', redirectTo: 'administration/logs-audit', pathMatch: 'full' },
      { path: 'parametres/sauvegardes', redirectTo: 'administration/sauvegardes', pathMatch: 'full' },
      { path: 'parametres/archives', redirectTo: 'administration/sauvegardes', pathMatch: 'full' },

      // Administration - Chambres (avant Services, Lits, Équipements, Maintenances)
      { path: 'administration/chambres', component: ChambresListPage },
      { path: 'administration/chambres/create', component: ChambreFormPage },
      { path: 'administration/chambres/:id', component: ChambreDetailPage },
      { path: 'administration/chambres/:id/edit', component: ChambreFormPage },

      // Administration - Pôles
      { path: 'administration/poles/create', component: PoleFormPage },
      { path: 'administration/poles/:id', component: PoleFormPage },

      // Administration - Services, Affectations, Lits, Équipements, Maintenances
      { path: 'administration/services', component: ServicesListPage },
      { path: 'administration/services/create', component: ServiceFormPage },
      { path: 'administration/services/:id', component: ServiceFormPage },
      
      { path: 'administration/affectations', component: AffectationsListPage },
      
      { path: 'administration/lits', component: LitsListPage },
      { path: 'administration/lits/create', component: LitFormPage },
      { path: 'administration/lits/:id', component: LitDetailPage },
      { path: 'administration/lits/:id/edit', component: LitFormPage },
      
      { path: 'administration/equipements', component: EquipementsListPage },
      { path: 'administration/equipements/create', component: EquipementFormPage },
      { path: 'administration/equipements/:id', component: EquipementFormPage },
      
      { path: 'administration/maintenances', component: MaintenancesListPage },
      { path: 'administration/maintenances/create', component: MaintenanceFormPage },
      { path: 'administration/maintenances/:id', component: MaintenanceFormPage },

      { path: 'administration/specialites', component: SpecialitesListPage },
      { path: 'administration/specialites/create', component: SpecialiteFormPage },
      { path: 'administration/specialites/:id/edit', component: SpecialiteFormPage },

      // Administration - Logs & Audits
      { path: 'administration/logs-audit', component: LogsAuditListPage },
      { path: 'administrations/logs', component: LogsAuditListPage },
      { path: 'administrations/logs-stats', component: LogsStatsPage },
      { path: 'administrations/logs-trace', component: LogsTracePage },

      // Administration - Sauvegardes
      { path: 'administration/sauvegardes', component: SauvegardesListPage },
    ],
  },
];
