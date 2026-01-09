const express = require('express');
const path = require('path');
const app = express();

// Middleware pour ajouter les en-têtes COOP et COEP
app.use((req, res, next) => {
  // Pour FedCM (Google Identity Services), on utilise une COOP moins restrictive
  // qui permet les popups et les iframes
  res.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  
  // COEP n'est pas nécessaire pour FedCM et peut causer des problèmes
  // res.header('Cross-Origin-Embedder-Policy', 'require-corp');
  
  // En-têtes CORS
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // En-têtes de sécurité supplémentaires
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'SAMEORIGIN');
  res.header('X-XSS-Protection', '1; mode=block');
  
  // Permettre les iframes pour FedCM
  res.header('Permissions-Policy', 'identity-credentials-get=()');
  
  next();
});

// Servir les fichiers statiques depuis le répertoire dist
app.use(express.static(path.join(__dirname, 'dist/rehoboth-h/browser')));

// Route pour les SPA (Single Page Application)
// Redirige toutes les routes vers index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/rehoboth-h/browser/index.html'));
});

const PORT = process.env.PORT || 4200;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('COOP header: same-origin-allow-popups');
});
