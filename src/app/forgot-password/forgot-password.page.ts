import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { environment } from '../../environments/environment';

type ResetResponse = {
  message?: string;
  success?: boolean;
};

@Component({
  selector: 'app-forgot-password-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.page.html',
})
export class ForgotPasswordPage {
  private readonly apiUrl = `${environment.apiUrl}/api/auth/forgot-password`;

  protected readonly isSubmitting = signal(false);
  protected readonly apiError = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly fieldErrors = signal<Record<string, string[]>>({});

  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  constructor(private readonly http: HttpClient) {}

  protected onSubmit(): void {
    this.apiError.set(null);
    this.successMessage.set(null);
    this.fieldErrors.set({});

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.apiError.set('Veuillez entrer une adresse e-mail valide.');
      return;
    }

    this.isSubmitting.set(true);

    const payload = {
      email: this.form.controls.email.value,
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    this.http.post<ResetResponse>(this.apiUrl, payload, { headers }).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.successMessage.set(
          res?.message ?? 'Un e-mail de réinitialisation a été envoyé à votre adresse.'
        );
        this.form.reset();
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);

        if (err.status === 0) {
          this.apiError.set(
            "Impossible de contacter l'API. Vérifiez que le serveur est disponible."
          );
          return;
        }

        const body: any = err.error;

        if (body?.message) {
          this.apiError.set(body.message);
          return;
        }

        this.apiError.set(`Erreur (HTTP ${err.status}). Veuillez réessayer.`);
      },
    });
  }

  protected fieldError(name: 'email'): string | null {
    const ctrl = this.form.controls[name];
    if (!ctrl.touched && !ctrl.dirty) return null;

    const server = this.fieldErrors()[name];
    if (server?.length) return server[0];

    if (ctrl.hasError('required')) return 'Champ requis.';
    if (ctrl.hasError('email')) return 'Adresse e-mail invalide.';

    return null;
  }
}
