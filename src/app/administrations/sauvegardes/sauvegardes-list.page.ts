import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SauvegardesService, Sauvegarde } from './services/sauvegardes.service';
import { ToastService } from '../../services/toast.service';

interface BackupStats {
  totalBackups: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
  totalSizeGb: number;
  lastBackupDate?: string;
  averageDurationSeconds?: number;
}

@Component({
  selector: 'app-sauvegardes-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './sauvegardes-list.page.html',
  styleUrls: ['./sauvegardes-list.page.css'],
})
export class SauvegardesListPage implements OnInit {
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly actionLoading = signal<number | null>(null);

  protected readonly sauvegardes = signal<Sauvegarde[]>([]);
  protected readonly page = signal(1);
  protected readonly limit = signal(50);
  protected readonly total = signal(0);
  protected readonly pages = signal(1);

  protected readonly scheduledBackups = signal<any[]>([]);
  protected readonly showScheduledTab = signal<boolean>(false);

  protected readonly selectedSauvegarde = signal<Sauvegarde | null>(null);
  protected readonly showDetail = signal<boolean>(false);
  protected readonly showCreateModal = signal<boolean>(false);
  protected readonly showRestoreModal = signal<boolean>(false);
  protected readonly showScheduleModal = signal<boolean>(false);
  protected readonly showStatusModal = signal<boolean>(false);
  protected readonly showRestoreConfirmModal = signal<boolean>(false);
  protected readonly restoreInstructions = signal<string[]>([]);
  protected readonly restoreChain = signal<any[]>([]);
  protected readonly isRestoringInProgress = signal<boolean>(false);

  // Formulaire de programmation
  protected readonly scheduleForm = signal({
    hopitalId: 1,
    typeBackup: 'COMPLETE',
    frequency: 'DAILY',
    time: '02:00',
    localisationBackup: '/sauvegardes',
    localisationSecondaire: '/backups/secondary',
    retentionDays: 30,
    dayOfWeek: null as number | null,
    dayOfMonth: null as number | null,
    notes: ''
  });

  // Statistiques
  protected readonly stats = signal<BackupStats>({
    totalBackups: 0,
    successCount: 0,
    failedCount: 0,
    pendingCount: 0,
    totalSizeGb: 0,
  });

  // Filtres
  protected readonly filterType = signal<string>('');
  protected readonly filterStatut = signal<string>('');
  protected readonly filterNumero = signal<string>('');
  protected readonly filterDateFrom = signal<string>('');
  protected readonly filterDateTo = signal<string>('');

  // Computed
  protected readonly successRate = computed(() => {
    const s = this.stats();
    if (s.totalBackups === 0) return 0;
    return Math.round((s.successCount / s.totalBackups) * 100);
  });

  protected readonly failureRate = computed(() => {
    const s = this.stats();
    if (s.totalBackups === 0) return 0;
    return Math.round((s.failedCount / s.totalBackups) * 100);
  });

  constructor(
    private readonly service: SauvegardesService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.load();
    this.loadStats();
    this.loadKpis();
    // Désactiver les recommandations pour l'instant (erreur 500 backend)
    // this.loadRecommendations();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);

    const filters: any = {};
    if (this.filterType()) filters.typeBackup = this.filterType();
    if (this.filterStatut()) filters.statut = this.filterStatut();
    if (this.filterNumero()) filters.numero = this.filterNumero();
    if (this.filterDateFrom()) filters.dateFrom = this.filterDateFrom();
    if (this.filterDateTo()) filters.dateTo = this.filterDateTo();

    this.service.list(this.page(), this.limit(), filters).subscribe({
      next: (res) => {
        this.sauvegardes.set(res.data ?? []);
        const p = res.pagination || { total: res.total, pages: Math.ceil((res.total || 0) / this.limit()) };
        this.total.set(p?.total ?? res.total ?? res.data?.length ?? 0);
        this.pages.set(p?.pages ?? Math.ceil((this.total() || 0) / this.limit()) ?? 1);
        this.loading.set(false);
      },
      error: (e) => {
        const msg = e?.error?.error || e?.error?.message || e?.message || 'Erreur lors du chargement des sauvegardes.';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  protected applyFilters(): void {
    this.page.set(1);
    this.load();
  }

  protected resetFilters(): void {
    this.filterType.set('');
    this.filterStatut.set('');
    this.filterNumero.set('');
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
    this.page.set(1);
    this.load();
  }

  protected next(): void {
    if (this.page() < this.pages()) {
      this.page.set(this.page() + 1);
      this.load();
    }
  }

  protected prev(): void {
    if (this.page() > 1) {
      this.page.set(this.page() - 1);
      this.load();
    }
  }

  protected viewDetail(sauvegarde: Sauvegarde): void {
    if (!sauvegarde.id) {
      this.showDetail.set(true);
      return;
    }
    this.selectedSauvegarde.set(sauvegarde);
    // Récupérer les infos complètes incluant les notes
    this.service.show(sauvegarde.id).subscribe({
      next: (res: any) => {
        if (res?.data) {
          this.selectedSauvegarde.set(res.data);
        }
        this.showDetail.set(true);
      },
      error: () => {
        this.showDetail.set(true);
      },
    });
  }

  protected getRestoreCount(): number {
    const sauvegarde = this.selectedSauvegarde();
    if (!sauvegarde?.notes) return 0;
    try {
      const notes = JSON.parse(sauvegarde.notes);
      return notes.restoreCount ?? 0;
    } catch {
      return 0;
    }
  }

  protected closeDetail(): void {
    this.showDetail.set(false);
    this.selectedSauvegarde.set(null);
  }

  protected getStatutColor(statut?: string): string {
    switch (statut?.toUpperCase()) {
      case 'SUCCESS':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700';
      case 'FAILED':
        return 'bg-red-100 text-red-700';
      case 'VERIFIED':
        return 'bg-indigo-100 text-indigo-700';
      case 'RESTORING':
        return 'bg-orange-100 text-orange-700';
      case 'DELETED':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  protected formatBytes(bytes?: number): string {
    if (!bytes) return '-';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  protected formatDuration(seconds?: number): string {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  }

  protected loadStats(): void {
    this.service.getStats(1).subscribe({
      next: (res: any) => {
        if (res?.data) {
          this.stats.set({
            totalBackups: res.data.total || res.data.totalBackups || 0,
            successCount: res.data.byStatut?.SUCCESS || res.data.successCount || 0,
            failedCount: res.data.byStatut?.FAILED || res.data.failedCount || 0,
            pendingCount: res.data.byStatut?.PENDING || res.data.pendingCount || 0,
            totalSizeGb: res.data.totalSizeGb || 0,
            lastBackupDate: res.data.lastBackupDate,
            averageDurationSeconds: res.data.averageDurationSeconds,
          });
        }
      },
      error: (e) => {
        console.warn('Endpoint stats non disponible, utilisation des KPIs:', e?.status);
        // Fallback sur les KPIs si stats n'existe pas
        this.loadKpis();
      },
    });
  }

  protected verifySauvegarde(sauvegarde: Sauvegarde): void {
    if (!sauvegarde.id) return;
    
    this.actionLoading.set(sauvegarde.id);
    this.service.verify(sauvegarde.id).subscribe({
      next: () => {
        this.toastService.success('Vérification lancée avec succès');
        this.actionLoading.set(null);
        this.load();
      },
      error: (e) => {
        const msg = e?.error?.message || 'Erreur lors de la vérification';
        this.toastService.error(msg);
        this.actionLoading.set(null);
      },
    });
  }

  protected updateStatus(sauvegarde: Sauvegarde, newStatus: string): void {
    if (!sauvegarde.id) return;
    
    this.actionLoading.set(sauvegarde.id);
    this.service.updateStatus(sauvegarde.id, { statut: newStatus }).subscribe({
      next: () => {
        this.toastService.success('Statut mis à jour');
        this.actionLoading.set(null);
        this.load();
      },
      error: (e) => {
        const msg = e?.error?.message || 'Erreur lors de la mise à jour';
        this.toastService.error(msg);
        this.actionLoading.set(null);
      },
    });
  }

  protected downloadBackup(sauvegarde: Sauvegarde): void {
    if (!sauvegarde.id) return;
    
    this.actionLoading.set(sauvegarde.id);
    this.service.download(sauvegarde.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${sauvegarde.numeroSauvegarde || 'backup'}.zip`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.toastService.success('Téléchargement lancé');
        this.actionLoading.set(null);
      },
      error: (e) => {
        const msg = e?.error?.message || 'Erreur lors du téléchargement';
        this.toastService.error(msg);
        this.actionLoading.set(null);
      },
    });
  }

  protected openCreateModal(): void {
    this.showCreateModal.set(true);
  }

  protected closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  protected openRestoreModal(sauvegarde: Sauvegarde): void {
    this.selectedSauvegarde.set(sauvegarde);
    this.showRestoreModal.set(true);
  }

  protected closeRestoreModal(): void {
    this.showRestoreModal.set(false);
    this.selectedSauvegarde.set(null);
  }

  protected createBackup(type: string): void {
    this.actionLoading.set(-1);
    
    // Payload conforme à la documentation backend
    // Essayer avec hopitalId = 1 (par défaut)
    const payload = {
      hopitalId: 1,
      typeBackup: type,
      localisationBackup: '/backups/' + new Date().toISOString().split('T')[0] + '/',
      localisationSecondaire: 's3://backups/' + new Date().toISOString().split('T')[0] + '/',
      statut: 'PENDING'
    };

    this.service.create(payload).subscribe({
      next: () => {
        this.toastService.success('Sauvegarde lancée avec succès');
        this.closeCreateModal();
        this.actionLoading.set(null);
        this.load();
        this.loadStats();
      },
      error: (e) => {
        console.error('Erreur création sauvegarde - Détails complets:', {
          status: e?.status,
          statusText: e?.statusText,
          error: e?.error,
          message: e?.message,
        });
        
        // Extraire le message d'erreur détaillé
        let msg = 'Erreur lors de la création de la sauvegarde';
        if (e?.error?.message) msg = e.error.message;
        else if (e?.error?.error) msg = e.error.error;
        else if (e?.error?.violations) {
          msg = e.error.violations.map((v: any) => `${v.propertyPath}: ${v.message}`).join(', ');
        }
        else if (typeof e?.error === 'string') msg = e.error;
        
        this.toastService.error(msg);
        this.actionLoading.set(null);
      },
    });
  }

  protected restoreBackup(): void {
    // Deprecated - use prepareRestore instead
  }

  protected getStatusIcon(statut?: string): string {
    switch (statut?.toUpperCase()) {
      case 'SUCCESS':
        return 'fa-check-circle';
      case 'PENDING':
        return 'fa-hourglass-half';
      case 'FAILED':
        return 'fa-times-circle';
      case 'VERIFIED':
        return 'fa-shield-alt';
      default:
        return 'fa-circle';
    }
  }

  protected getTypeIcon(type?: string): string {
    switch (type?.toUpperCase()) {
      case 'COMPLETE':
        return 'fa-database';
      case 'INCREMENTAL':
        return 'fa-plus-circle';
      case 'DIFFERENTIAL':
        return 'fa-exchange-alt';
      default:
        return 'fa-save';
    }
  }

  protected loadKpis(): void {
    this.service.getKpis(undefined, 30).subscribe({
      next: (res: any) => {
        if (res?.data?.kpis) {
          const kpis = res.data.kpis;
          this.stats.set({
            totalBackups: kpis.totalBackups || 0,
            successCount: kpis.successBackups || 0,
            failedCount: kpis.failedBackups || 0,
            pendingCount: 0,
            totalSizeGb: kpis.totalSizeGb || 0,
            averageDurationSeconds: kpis.avgDurationSeconds,
          });
        }
      },
      error: (e) => {
        console.error('Erreur lors du chargement des KPIs:', e);
      },
    });
  }

  protected loadRecommendations(): void {
    this.service.getRecommendations().subscribe({
      next: (res: any) => {
        if (res?.data?.recommendations) {
          console.log('Recommandations chargées:', res.data.recommendations);
        }
      },
      error: (e) => {
        console.error('Erreur lors du chargement des recommandations:', e);
      },
    });
  }

  protected exportBackup(sauvegarde: Sauvegarde, format: 'json' | 'csv' = 'json'): void {
    if (!sauvegarde.id) return;
    
    this.actionLoading.set(sauvegarde.id);
    this.service.export(sauvegarde.id, format).subscribe({
      next: (res: any) => {
        const dataStr = JSON.stringify(res.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${sauvegarde.numeroSauvegarde || 'backup'}.${format}`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.toastService.success('Export réussi');
        this.actionLoading.set(null);
      },
      error: (e) => {
        const msg = e?.error?.message || 'Erreur lors de l\'export';
        this.toastService.error(msg);
        this.actionLoading.set(null);
      },
    });
  }

  protected viewChain(sauvegarde: Sauvegarde): void {
    if (!sauvegarde.id) return;
    
    this.service.getChain(sauvegarde.id).subscribe({
      next: (res: any) => {
        if (res?.data) {
          console.log('Chaîne de sauvegarde:', res.data);
          this.toastService.info(`Chaîne de ${res.data.chainLength} sauvegarde(s)`);
        }
      },
      error: (e) => {
        const msg = e?.error?.message || 'Erreur lors du chargement de la chaîne';
        this.toastService.error(msg);
      },
    });
  }

  protected openScheduleModal(): void {
    this.showScheduleModal.set(true);
  }

  protected closeScheduleModal(): void {
    this.showScheduleModal.set(false);
  }

  protected scheduleBackup(): void {
    const form = this.scheduleForm();
    this.actionLoading.set(-2);

    // Préparer le payload conforme à la documentation
    const payload: any = {
      hopitalId: form.hopitalId,
      typeBackup: form.typeBackup,
      frequency: form.frequency,
      time: form.time,
      localisationBackup: form.localisationBackup,
      localisationSecondaire: form.localisationSecondaire,
      retentionDays: form.retentionDays,
    };

    // Ajouter les champs optionnels s'ils sont définis
    if (form.dayOfWeek !== null) payload.dayOfWeek = form.dayOfWeek;
    if (form.dayOfMonth !== null) payload.dayOfMonth = form.dayOfMonth;
    if (form.notes) payload.notes = form.notes;

    // 2. CORRECTION : On envoie tout l'objet 'payload' directement
  this.service.scheduleBackup(payload).subscribe({
    next: () => {
      this.toastService.success('Sauvegarde programmée avec succès');
      this.closeScheduleModal();
      this.actionLoading.set(null);
      this.loadScheduledBackups();
    },
    error: (e) => {
      console.error('Erreur programmation:', e);
      const msg = e?.error?.message || 'Erreur lors de la programmation';
      this.toastService.error(msg);
      this.actionLoading.set(null);
    },
    });
  }

  protected openStatusModal(sauvegarde: Sauvegarde): void {
    this.selectedSauvegarde.set(sauvegarde);
    this.showStatusModal.set(true);
  }

  protected closeStatusModal(): void {
    this.showStatusModal.set(false);
  }

  protected changeStatus(newStatus: string): void {
    const sauvegarde = this.selectedSauvegarde();
    if (!sauvegarde?.id) return;

    this.actionLoading.set(sauvegarde.id);
    
    // Préparer le payload avec les données nécessaires
    const payload: any = { statut: newStatus };
    
    // Si on passe à SUCCESS, ajouter des données de test
    if (newStatus === 'SUCCESS') {
      payload.tailleBytes = 1073741824; // 1 GB
      payload.dureeSecondes = 3600; // 1 heure
      payload.checksumSha256 = 'abc123def456' + Math.random().toString(36).substring(7);
      payload.nombreFichiers = 5000;
      payload.nombreTables = 45;
      payload.dateFin = new Date().toISOString();
    }

    this.service.updateStatus(sauvegarde.id, payload).subscribe({
      next: () => {
        this.toastService.success(`Statut changé à ${newStatus}`);
        this.closeStatusModal();
        this.actionLoading.set(null);
        this.load();
        this.loadStats();
      },
      error: (e) => {
        const msg = e?.error?.message || 'Erreur lors du changement de statut';
        this.toastService.error(msg);
        this.actionLoading.set(null);
      },
    });
  }

  protected getNextStatuses(currentStatus?: string): string[] {
    switch (currentStatus?.toUpperCase()) {
      case 'PENDING':
        return ['SUCCESS'];
      default:
        return [];
    }
  }

  protected completeBackup(sauvegarde: Sauvegarde): void {
    if (!sauvegarde.id) return;

    this.actionLoading.set(sauvegarde.id);
    
    // Préparer le payload avec les données de succès
    const payload: any = { 
      statut: 'SUCCESS',
      tailleBytes: 1073741824, // 1 GB
      dureeSecondes: 3600, // 1 heure
      checksumSha256: 'abc123def456' + Math.random().toString(36).substring(7),
      nombreFichiers: 5000,
      nombreTables: 45,
      dateFin: new Date().toISOString()
    };

    this.service.updateStatus(sauvegarde.id, payload).subscribe({
      next: () => {
        this.toastService.success('Sauvegarde complétée avec succès');
        this.actionLoading.set(null);
        this.load();
        this.loadStats();
      },
      error: (e) => {
        const msg = e?.error?.message || 'Erreur lors de la complétion de la sauvegarde';
        this.toastService.error(msg);
        this.actionLoading.set(null);
      },
    });
  }

  protected loadScheduledBackups(): void {
    this.service.getScheduledBackups(1).subscribe({
      next: (res: any) => {
        if (res?.data) {
          this.scheduledBackups.set(Array.isArray(res.data) ? res.data : [res.data]);
        }
      },
      error: (e) => {
        console.warn('Erreur lors du chargement des sauvegardes programmées:', e?.status);
      },
    });
  }

  protected deleteSchedule(scheduleId: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette programmation ?')) {
      return;
    }

    this.actionLoading.set(scheduleId);
    this.service.deleteSchedule(scheduleId).subscribe({
      next: () => {
        this.toastService.success('Programmation supprimée');
        this.actionLoading.set(null);
        this.loadScheduledBackups();
      },
      error: (e) => {
        const msg = e?.error?.message || 'Erreur lors de la suppression';
        this.toastService.error(msg);
        this.actionLoading.set(null);
      },
    });
  }

  protected toggleScheduledTab(): void {
    this.showScheduledTab.set(!this.showScheduledTab());
    if (this.showScheduledTab()) {
      this.loadScheduledBackups();
    }
  }

  protected prepareRestore(sauvegarde: Sauvegarde): void {
    if (!sauvegarde.id) return;
    
    // Fermer le modal de détail s'il est ouvert
    if (this.showDetail()) {
      this.closeDetail();
    }
    
    this.selectedSauvegarde.set(sauvegarde);
    this.actionLoading.set(sauvegarde.id);
    this.service.getRestoreChain(sauvegarde.id).subscribe({
      next: (res: any) => {
        if (res?.data) {
          this.restoreChain.set(res.data.chain || []);
          this.restoreInstructions.set(res.data.restoreInstructions || []);
        }
        this.actionLoading.set(null);
        this.showRestoreModal.set(true);
      },
      error: (e) => {
        const msg = e?.error?.message || 'Erreur lors du chargement des instructions de restauration';
        this.toastService.error(msg);
        this.actionLoading.set(null);
      },
    });
  }

  protected confirmRestore(): void {
    this.showRestoreModal.set(false);
    this.showRestoreConfirmModal.set(true);
  }

  protected cancelRestore(): void {
    this.showRestoreConfirmModal.set(false);
    this.selectedSauvegarde.set(null);
    this.restoreChain.set([]);
    this.restoreInstructions.set([]);
  }

  protected executeRestore(): void {
    const sauvegarde = this.selectedSauvegarde();
    if (!sauvegarde?.id) return;
    this.isRestoringInProgress.set(true);
    this.showRestoreConfirmModal.set(false);
    this.service.restore(sauvegarde.id).subscribe({
      next: () => {
        this.toastService.success('Restauration lancée avec succès. Le système va redémarrer...');
        setTimeout(() => {
          localStorage.removeItem('auth_token');
          sessionStorage.removeItem('auth_token');
          window.location.href = '/login';
        }, 3000);
      },
      error: (e) => {
        this.isRestoringInProgress.set(false);
        const msg = e?.error?.message || 'Erreur lors de la restauration';
        this.toastService.error(msg);
        this.selectedSauvegarde.set(null);
        this.restoreChain.set([]);
        this.restoreInstructions.set([]);
      },
    });
  }
}
