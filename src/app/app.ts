import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmModalComponent } from './components/confirm-modal.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConfirmModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  ngOnInit(): void {
    // Initialiser le dark mode au démarrage de l'app
    this.initializeDarkMode();
    
    // Réappliquer après un délai pour s'assurer que c'est bien appliqué (après le rendu Angular)
    setTimeout(() => {
      this.applyDarkMode(localStorage.getItem('darkMode'));
    }, 100);
    
    // Écouter les changements de localStorage depuis d'autres onglets/fenêtres
    window.addEventListener('storage', (event) => {
      if (event.key === 'darkMode') {
        console.log('[App] Storage event: darkMode changed to:', event.newValue);
        this.applyDarkMode(event.newValue);
      }
    });
  }

  private initializeDarkMode(): void {
    const saved = localStorage.getItem('darkMode');
    console.log('[App] initializeDarkMode: saved value:', saved);
    this.applyDarkMode(saved);
  }

  private applyDarkMode(value: string | null): void {
    console.log('[App] applyDarkMode called with value:', value);
    
    // Toujours commencer par supprimer la classe dark
    const htmlElement = document.documentElement;
    htmlElement.classList.remove('dark');
    
    if (value === 'true') {
      console.log('[App] Adding dark class');
      htmlElement.classList.add('dark');
    } else if (value === 'false') {
      console.log('[App] Keeping light mode (no dark class)');
      // Garder la classe dark supprimée
    } else {
      // Si aucune préférence sauvegardée, utiliser la préférence système
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        console.log('[App] System prefers dark mode');
        htmlElement.classList.add('dark');
        localStorage.setItem('darkMode', 'true');
      } else {
        console.log('[App] System prefers light mode');
        localStorage.setItem('darkMode', 'false');
      }
    }
    
    console.log('[App] Final HTML classes:', htmlElement.className);
  }
}
