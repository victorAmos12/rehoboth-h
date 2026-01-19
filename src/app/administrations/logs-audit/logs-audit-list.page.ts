import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LogsAuditService, LogAudit } from './services/logs-audit.service';

@Component({
  selector: 'app-logs-audit-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './logs-audit-list.page.html',
  styleUrls: ['./logs-audit-list.page.css'],
})
export class LogsAuditListPage implements OnInit {
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly logs = signal<LogAudit[]>([]);
  protected readonly page = signal(1);
  protected readonly limit = signal(100);
  protected readonly total = signal(0);
  protected readonly pages = signal(1);

  protected readonly selectedLog = signal<LogAudit | null>(null);
  protected readonly showDetail = signal<boolean>(false);

  // Filtres
  protected readonly filterTypeLog = signal<string>('');
  protected readonly filterActionType = signal<string>('');
  protected readonly filterEntiteType = signal<string>('');
  protected readonly filterDateFrom = signal<string>('');
  protected readonly filterDateTo = signal<string>('');

  constructor(private readonly service: LogsAuditService) {}

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);

    const filters: any = {};
    if (this.filterTypeLog()) filters.typeLog = this.filterTypeLog();
    if (this.filterActionType()) filters.actionType = this.filterActionType();
    if (this.filterEntiteType()) filters.entiteType = this.filterEntiteType();
    if (this.filterDateFrom()) filters.dateFrom = this.filterDateFrom();
    if (this.filterDateTo()) filters.dateTo = this.filterDateTo();

    this.service.list(this.page(), this.limit(), filters).subscribe({
      next: (res) => {
        this.logs.set(res.data ?? []);
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
    this.filterEntiteType.set('');
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

  protected viewDetail(log: LogAudit): void {
    this.selectedLog.set(log);
    this.showDetail.set(true);
  }

  protected closeDetail(): void {
    this.showDetail.set(false);
    this.selectedLog.set(null);
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

  protected getUserName(log: LogAudit): string {
    if (log.utilisateur) {
      return `${log.utilisateur.prenom} ${log.utilisateur.nom}`.trim();
    }
    return '-';
  }
}
