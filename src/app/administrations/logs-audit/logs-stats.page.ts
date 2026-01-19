import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LogsAuditService, LogsStats, PerformanceStats, Anomaly } from './services/logs-audit.service';

@Component({
  selector: 'app-logs-stats',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './logs-stats.page.html',
  styleUrls: ['./logs-stats.page.css', './logs-audit.styles.css'],
})
export class LogsStatsPage implements OnInit {
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  // Stats
  protected readonly stats = signal<LogsStats | null>(null);
  protected readonly performanceStats = signal<PerformanceStats | null>(null);
  protected readonly anomalies = signal<any>(null);

  // Filtres
  protected readonly dateFrom = signal<string>('');
  protected readonly dateTo = signal<string>('');

  // Tabs
  protected readonly activeTab = signal<'overview' | 'performance' | 'anomalies'>('overview');

  constructor(private readonly service: LogsAuditService) {}

  ngOnInit(): void {
    this.initializeDates();
    this.loadStats();
  }

  private initializeDates(): void {
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    this.dateTo.set(this.formatDate(today));
    this.dateFrom.set(this.formatDate(sevenDaysAgo));
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  protected loadStats(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getStats(undefined, this.dateFrom(), this.dateTo()).subscribe({
      next: (res) => {
        this.stats.set(res.data);
        this.loadPerformanceStats();
      },
      error: (e) => {
        const msg = e?.error?.error || e?.message || 'Erreur lors du chargement des statistiques.';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  private loadPerformanceStats(): void {
    this.service.getPerformanceStats().subscribe({
      next: (res) => {
        this.performanceStats.set(res.data);
        this.loadAnomalies();
      },
      error: () => {
        this.loadAnomalies();
      },
    });
  }

  private loadAnomalies(): void {
    this.service.getAnomalies().subscribe({
      next: (res) => {
        this.anomalies.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  protected applyFilters(): void {
    this.loadStats();
  }

  protected resetFilters(): void {
    this.initializeDates();
    this.loadStats();
  }

  protected setTab(tab: 'overview' | 'performance' | 'anomalies'): void {
    this.activeTab.set(tab);
  }

  protected getPercentageColor(value: number, threshold: number = 50): string {
    if (value >= threshold) return 'text-green-600';
    if (value >= threshold * 0.75) return 'text-yellow-600';
    return 'text-red-600';
  }

  protected getAnomalySeverityColor(severity: string): string {
    switch (severity?.toUpperCase()) {
      case 'SPIKE':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'DEGRADATION':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'FAILURE':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'SECURITY':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'HIGH':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'LOW':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  }

  protected getAnomalyIcon(severity: string): string {
    switch (severity?.toUpperCase()) {
      case 'SPIKE':
        return '<i class="fas fa-arrow-up text-red-600"></i>';
      case 'DEGRADATION':
        return '<i class="fas fa-arrow-down text-yellow-600"></i>';
      case 'FAILURE':
        return '<i class="fas fa-times-circle text-orange-600"></i>';
      case 'SECURITY':
        return '<i class="fas fa-shield-alt text-purple-600"></i>';
      default:
        return '<i class="fas fa-exclamation-circle text-gray-600"></i>';
    }
  }

  protected getTotalAnomalies(): number {
    if (!this.anomalies()) return 0;
    const data = this.anomalies();
    return (data.spike?.length || 0) + (data.degradation?.length || 0) + (data.failure?.length || 0) + (data.security?.length || 0);
  }
}
