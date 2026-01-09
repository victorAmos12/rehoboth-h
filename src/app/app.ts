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
  }

  private initializeDarkMode(): void {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') {
      document.documentElement.classList.add('dark');
    } else if (saved === 'false') {
      document.documentElement.classList.remove('dark');
    } else {
      // Si aucune préférence sauvegardée, utiliser la préférence système
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('darkMode', 'true');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('darkMode', 'false');
      }
    }
  }
}
