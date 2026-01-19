import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LogsAuditService, LogAudit, PageStats } from './services/logs-audit.service';

@Component({
  selector: 'app-logs-audit-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './logs-audit-list.page.html',
  styleUrls: ['./logs-audit-list.page.css', './logs-audit.styles.css'],
})
export class LogsAuditListPage implements OnInit {
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showFilters = signal(false);

  protected readonly logs = signal<LogAudit[]>([]);
  protected readonly page = signal(1);
  protected readonly limit = signal(50);
  protected readonly total = signal(0);
  protected readonly pages = signal(1);
  protected readonly pageStats = signal<PageStats | null>(null);

  protected readonly selectedLog = signal<LogAudit | null>(null);
  protected readonly showDetail = signal<boolean>(false);
  protected readonly showTrace = signal<boolean>(false);

  // Filtres
  protected readonly filterTypeLog = signal<string>('');
  protected readonly filterActionType = signal<string>('');
  protected readonly filterNiveau = signal<string>('');
  protected readonly filterCategorie = signal<string>('');
  protected readonly filterEntiteType = signal<string>('');
  protected readonly filterStatut = signal<string>('');
  protected readonly filterDateFrom = signal<string>('');
  protected readonly filterDateTo = signal<string>('');
  protected readonly filterSearch = signal<string>('');
  protected readonly filterHasAlert = signal<string>('');

  constructor(private readonly service: LogsAuditService) {}

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);

    const filters: any = {};
    if (this.filterTypeLog()) filters.type = this.filterTypeLog();
    if (this.filterActionType()) filters.actionType = this.filterActionType();
    if (this.filterNiveau()) filters.niveau = this.filterNiveau();
    if (this.filterCategorie()) filters.categorie = this.filterCategorie();
    if (this.filterEntiteType()) filters.entiteType = this.filterEntiteType();
    if (this.filterStatut()) filters.statut = this.filterStatut();
    if (this.filterDateFrom()) filters.dateFrom = this.filterDateFrom();
    if (this.filterDateTo()) filters.dateTo = this.filterDateTo();
    if (this.filterSearch()) filters.search = this.filterSearch();
    if (this.filterHasAlert()) filters.hasAlert = this.filterHasAlert() === 'true';

    this.service.list(this.page(), this.limit(), filters).subscribe({
      next: (res) => {
        this.logs.set(res.data ?? []);
        this.pageStats.set(res.pageStats ?? null);
        const p = res.pagination || { total: res.total, pages: Math.ceil((res.total || 0) / this.limit()) };
        this.total.set(p?.total ?? res.total ?? res.data?.length ?? 0);
        this.pages.set(p?.pages ?? Math.ceil((this.total() || 0) / this.limit()) ?? 1);
        this.loading.set(false);
      },
      error: (e) => {
        const msg = e?.error?.error || e?.error?.message || e?.message || 'Erreur lors du chargement des logs.';
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
    this.filterTypeLog.set('');
    this.filterActionType.set('');
    this.filterNiveau.set('');
    this.filterCategorie.set('');
    this.filterEntiteType.set('');
    this.filterStatut.set('');
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
    this.filterSearch.set('');
    this.filterHasAlert.set('');
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

  protected viewDetail(log: LogAudit): void {
    this.selectedLog.set(log);
    this.showDetail.set(true);
  }

  protected closeDetail(): void {
    this.showDetail.set(false);
    this.selectedLog.set(null);
  }

  protected viewTrace(log: LogAudit): void {
    if (log.traceId) {
      this.selectedLog.set(log);
      this.showTrace.set(true);
    }
  }

  protected closeTrace(): void {
    this.showTrace.set(false);
  }

  protected getActionColor(action?: string): string {
    switch (action?.toUpperCase()) {
      case 'CREATE':
        return 'bg-green-100 text-green-700';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-700';
      case 'DELETE':
        return 'bg-red-100 text-red-700';
      case 'READ':
        return 'bg-gray-100 text-gray-700';
      case 'EXPORT':
        return 'bg-purple-100 text-purple-700';
      case 'IMPORT':
        return 'bg-indigo-100 text-indigo-700';
      case 'LOGIN':
        return 'bg-cyan-100 text-cyan-700';
      case 'LOGOUT':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  protected getStatutColor(statut?: string): string {
    switch (statut?.toUpperCase()) {
      case 'SUCCESS':
        return 'bg-green-100 text-green-700';
      case 'FAILURE':
        return 'bg-red-100 text-red-700';
      case 'PARTIAL':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  protected getNiveauColor(niveau?: string): string {
    switch (niveau?.toUpperCase()) {
      case 'DEBUG':
        return 'bg-gray-100 text-gray-700';
      case 'INFO':
        return 'bg-blue-100 text-blue-700';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-700';
      case 'ERROR':
        return 'bg-red-100 text-red-700';
      case 'CRITICAL':
        return 'bg-red-200 text-red-900';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  protected getNiveauIcon(niveau?: string): string {
    switch (niveau?.toUpperCase()) {
      case 'DEBUG':
        return '<i class="fas fa-bug text-gray-600"></i>';
      case 'INFO':
        return '<i class="fas fa-info-circle text-blue-600"></i>';
      case 'WARNING':
        return '<i class="fas fa-exclamation-triangle text-yellow-600"></i>';
      case 'ERROR':
        return '<i class="fas fa-times-circle text-red-600"></i>';
      case 'CRITICAL':
        return '<i class="fas fa-exclamation-circle text-red-700"></i>';
      default:
        return '<i class="fas fa-file-alt text-gray-600"></i>';
    }
  }

  protected getUserName(log: LogAudit): string {
    if (log.utilisateur) {
      return `${log.utilisateur.prenom} ${log.utilisateur.nom}`.trim();
    }
    return '-';
  }

  protected getResponseTimeColor(time?: number): string {
    if (!time) return 'text-gray-600';
    if (time < 100) return 'text-green-600';
    if (time < 500) return 'text-yellow-600';
    return 'text-red-600';
  }
}
