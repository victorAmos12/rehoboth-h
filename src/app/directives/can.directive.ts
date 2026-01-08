import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { AuthService, CapabilityAction } from '../services/auth.service';
import { Subscription } from 'rxjs';

/**
 * Directive structurelle pour afficher/masquer un bloc selon les capabilities.
 *
 * Usage:
 *   <button *appCan="['patients','create']">Créer</button>
 */
@Directive({
  selector: '[appCan]',
  standalone: true,
})
export class CanDirective {
  private readonly auth = inject(AuthService);

  private module?: string;
  private action?: CapabilityAction;

  private rendered = false;
  private sub?: Subscription;

  constructor(
    private readonly tpl: TemplateRef<unknown>,
    private readonly vcr: ViewContainerRef
  ) {}

  @Input('appCan')
  set appCan(value: [string, CapabilityAction] | null | undefined) {
    this.module = value?.[0];
    this.action = value?.[1];

    // S'abonner aux changements de capabilities pour refléter le UI après /api/auth/me
    if (!this.sub) {
      this.sub = this.auth.capabilities$.subscribe(() => this.render());
    }

    this.render();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private render(): void {
    if (!this.module || !this.action) {
      this.vcr.clear();
      this.rendered = false;
      return;
    }

    const allowed = this.auth.can(this.module, this.action);

    if (allowed && !this.rendered) {
      this.vcr.clear();
      this.vcr.createEmbeddedView(this.tpl);
      this.rendered = true;
      return;
    }

    if (!allowed && this.rendered) {
      this.vcr.clear();
      this.rendered = false;
    }
  }
}
