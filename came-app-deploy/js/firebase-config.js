// Firebase Configuration
// IMPORTANTE: Sostituisci questi valori con la TUA configurazione Firebase!

const firebaseConfig = {
  apiKey: "AIzaSyDL6JQCgCsujw2K_qm3Sn533Vcs-JT4kiI",
  authDomain: "came-app-327b6.firebaseapp.com",
  projectId: "came-app-327b6",
  storageBucket: "came-app-327b6.firebasestorage.app",
  messagingSenderId: "1002033564443",
  appId: "1:1002033564443:web:3c5ea678b5b37d696961be"
};


// Inizializza Firebase
let app;
let auth;
let db;

try {
  // Aspetta che Firebase sia caricato
  if (typeof firebase === 'undefined') {
    throw new Error('Firebase SDK non caricato');
  }

  // Initialize Firebase App
  app = firebase.initializeApp(firebaseConfig);
  
  // Initialize Firebase Services
  auth = firebase.auth();
  db = firebase.firestore();

  console.log('✅ Firebase initialized successfully');
  console.log('📱 App:', app.name);
  console.log('🔐 Auth:', auth ? 'Connected' : 'Not connected');
  console.log('💾 Firestore:', db ? 'Connected' : 'Not connected');

  // Export per accesso globale
  window.firebaseApp = app;
  window.firebaseAuth = auth;
  window.firebaseDb = db;

} catch (error) {
  console.error('❌ Errore nell\'inizializzazione di Firebase:', error);
  alert('Errore nella configurazione Firebase. Controlla la console per i dettagli.');
}

// Funzioni helper per debug
window.checkFirebaseStatus = function() {
  console.log('=== Firebase Status ===');
  console.log('App initialized:', !!app);
  console.log('Auth initialized:', !!auth);
  console.log('Firestore initialized:', !!db);
  console.log('Current user:', auth?.currentUser?.email || 'Not logged in');
};

// Export per uso nei moduli
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { app, auth, db, firebaseConfig };
}
