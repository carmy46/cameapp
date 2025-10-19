# CAME App - Deployment Info

## 📦 Deployment Package
Questa cartella contiene la versione pulita e pronta per il deploy su Netlify dell'applicazione CAME.

## 🔥 Firebase Project
- **Project ID**: came-app-327b6
- **Auth Domain**: came-app-327b6.firebaseapp.com
- **Region**: europe-west1
- **Storage**: came-app-327b6.firebasestorage.app

## 📂 Struttura Files
```
came-app-deploy/
├── index.html (Login)
├── register.html (Registrazione)
├── employee-dashboard.html
├── admin-dashboard.html
├── admin-approvals.html
├── admin-employee-hours.html
├── admin-reports.html
├── requests.html
├── timesheet.html
├── time-registration.html
├── netlify.toml (Configurazione Netlify)
├── js/ (Tutti i file JavaScript)
├── css/ (Tutti i file CSS incluso responsive.css)
└── assets/ (Risorse statiche)
```

## 🚀 Come Deployare su Netlify

### Metodo 1: Drag & Drop (Più Semplice)
1. Vai su https://app.netlify.com
2. Accedi o registrati
3. Clicca su "Add new site" → "Deploy manually"
4. Trascina questa intera cartella (came-app-deploy) nell'area di upload
5. Attendi il completamento del deploy

### Metodo 2: Git (Consigliato per Produzione)
1. Crea un repository GitHub per questa cartella
2. Su Netlify: "Add new site" → "Import from Git"
3. Collega il repository
4. Netlify rileverà automaticamente le impostazioni da netlify.toml

## ⚙️ Post-Deploy Steps

### 1. Aggiungi il Dominio Netlify a Firebase
**IMPORTANTE**: Devi autorizzare il dominio Netlify in Firebase!

1. Vai su: https://console.firebase.google.com
2. Seleziona il progetto: **came-app-327b6**
3. Vai su **Authentication** → **Settings** → **Authorized domains**
4. Clicca su "Add domain"
5. Aggiungi il tuo dominio Netlify: `[your-site-name].netlify.app`
   - Esempio: `came-app-production.netlify.app`

**Se non fai questo passaggio, il login NON funzionerà!**

### 2. Configura CORS in Firestore (se necessario)
Se hai problemi di CORS:
1. Vai su Firebase Console → Firestore Database
2. Verifica che le regole permettano accesso autenticato
3. Le regole corrette sono già in firestore.rules

### 3. Test Checklist Post-Deploy
Dopo il deploy, testa queste funzionalità:

- [ ] Homepage (index.html) si carica correttamente
- [ ] CSS responsive funziona su mobile/tablet/desktop
- [ ] Pagina di registrazione (register.html) accessibile
- [ ] Registrazione nuovo utente funziona
- [ ] Login con credenziali esistenti funziona
- [ ] Dashboard dipendente accessibile dopo login
- [ ] Dashboard admin accessibile per admin
- [ ] Inserimento ore di lavoro funziona
- [ ] Creazione richieste funziona
- [ ] Sincronizzazione dati Firebase funziona
- [ ] Logout funziona correttamente
- [ ] Responsive design su dispositivi mobili

## 🔐 Firebase Configuration
La configurazione Firebase è in: `js/firebase-config.js`

```javascript
projectId: "came-app-327b6"
authDomain: "came-app-327b6.firebaseapp.com"
storageBucket: "came-app-327b6.firebasestorage.app"
```

**NON modificare questi valori** a meno che non cambi progetto Firebase.

## 📱 Design Responsive
L'app è completamente responsive grazie a:
- `css/responsive.css` - Media queries per tutti i dispositivi
- `css/layout.css` - Layout flessibile
- `css/components.css` - Componenti adattivi

Breakpoints supportati:
- Mobile: 320px - 768px
- Tablet: 768px - 1024px
- Desktop: 1024px+
- 4K: 1536px+

## 🔧 Troubleshooting

### Problema: "Firebase auth/unauthorized-domain"
**Soluzione**: Aggiungi il dominio Netlify agli authorized domains in Firebase (vedi Post-Deploy Step 1)

### Problema: Login non funziona
**Soluzione**:
1. Controlla che il dominio sia autorizzato in Firebase
2. Apri la console del browser (F12) per vedere gli errori
3. Verifica che firebase-config.js abbia i parametri corretti

### Problema: CSS non si carica
**Soluzione**:
1. Verifica che la cartella `css/` sia stata copiata
2. Controlla che responsive.css sia presente in tutti gli HTML
3. Svuota la cache del browser (Ctrl + F5)

### Problema: Pagine 404 su refresh
**Soluzione**: Il file netlify.toml contiene già le regole di redirect. Verifica che sia presente nella root.

## 📞 Support
Per problemi con il deploy:
1. Controlla i logs su Netlify Dashboard
2. Verifica la console Firebase per errori di autenticazione
3. Consulta GUIDA-DEPLOY-NETLIFY.md nella cartella originale came-app

## 🎯 URL Utili
- **Firebase Console**: https://console.firebase.google.com
- **Netlify Dashboard**: https://app.netlify.com
- **Documentazione Firebase Auth**: https://firebase.google.com/docs/auth/web/start

## ✅ Verifiche Pre-Deploy
Prima di deployare, verifica che:
- ✅ Tutti i 10 file HTML siano presenti
- ✅ Cartella js/ con tutti i file sia presente
- ✅ Cartella css/ con responsive.css sia presente
- ✅ netlify.toml sia nella root
- ✅ Firebase config sia corretto in js/firebase-config.js

## 🚀 Ready to Deploy!
Questa cartella è pronta per essere deployata su Netlify.
Segui i passi sopra e buon deploy!

---
**Generated**: 2025-10-13
**App Version**: CAME v1.0 - Production Ready
**Responsive**: ✅ Mobile, Tablet, Desktop
