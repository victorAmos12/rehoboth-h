import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LogsAuditService, Trace, LogAudit } from './services/logs-audit.service';

@Component({
  selector: 'app-logs-trace',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './logs-trace.page.html',
  styleUrls: ['./logs-trace.page.css'],
})
export class LogsTracePage implements OnInit {
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly trace = signal<Trace | null>(null);
  protected readonly traceId = signal<string>('');

  constructor(
    private readonly service: LogsAuditService,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['traceId']) {
        this.traceId.set(params['traceId']);
        this.loadTrace();
      }
    });
  }

  protected loadTrace(): void {
    if (!this.traceId()) return;

    this.loading.set(true);
    this.error.set(null);

    this.service.getTrace(this.traceId()).subscribe({
      next: (res) => {
        this.trace.set({
          traceId: res.traceId,
          spanCount: res.spanCount,
          totalDuration: res.totalDuration,
          spans: res.spans,
        });
        this.loading.set(false);
      },
      error: (e) => {
        const msg = e?.error?.error || e?.message || 'Erreur lors du chargement de la trace.';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
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

  protected getResponseTimeColor(time?: number): string {
    if (!time) return 'text-gray-600';
    if (time < 100) return 'text-green-600';
    if (time < 500) return 'text-yellow-600';
    return 'text-red-600';
  }

  protected calculatePercentage(spanTime: number, totalTime: number): number {
    if (totalTime === 0) return 0;
    return (spanTime / totalTime) * 100;
  }

  protected calculateFastestSpan(): number {
    const spans = this.trace()?.spans;
    if (!spans || spans.length === 0) return 0;
    return spans.reduce((acc, span) => Math.min(acc, span.tempsReponseMs || 0), Infinity);
  }

  protected calculateSlowestSpan(): number {
    const spans = this.trace()?.spans;
    if (!spans || spans.length === 0) return 0;
    return spans.reduce((acc, span) => Math.max(acc, span.tempsReponseMs || 0), 0);
  }
}
