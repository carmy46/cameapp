// Authentication Module with Firebase
class Auth {
  constructor() {
    this.sessionKey = 'came_session';
    this.init();
  }

  init() {
    // Aspetta che Firebase sia caricato
    if (typeof firebase === 'undefined') {
      console.warn('⏳ Firebase non ancora caricato, riprovo...');
      setTimeout(() => this.init(), 500);
      return;
    }

    this.auth = firebase.auth();
    this.db = firebase.firestore();

    // Listener per cambiamenti di autenticazione
    this.auth.onAuthStateChanged((user) => {
      console.log('Auth state changed:', user ? user.email : 'Not logged in');
      
      if (user) {
        // Carica dati utente da Firestore
        this.loadUserData(user.uid);
      }
    });

    console.log('✅ Auth module initialized with Firebase');
  }

  // Carica dati utente da Firestore
  async loadUserData(userId) {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log('✅ User data loaded:', userData);
        
        // Salva in sessione locale per accesso rapido
        const sessionData = {
          user: userData,
          token: await this.auth.currentUser.getIdToken(),
          loginTime: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
        };
        
        localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
        return userData;
      } else {
        console.warn('⚠️ User document not found in Firestore');
        return null;
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      return null;
    }
  }

  // Login con Firebase Authentication
  async login(email, password) {
    try {
      // Effettua login con Firebase
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      console.log('✅ Firebase login successful:', user.email);
      
      // Carica dati utente da Firestore
      const userData = await this.loadUserData(user.uid);
      
      if (!userData) {
        throw new Error('Dati utente non trovati');
      }
      
      return {
        success: true,
        user: userData,
        message: 'Accesso effettuato con successo'
      };
      
    } catch (error) {
      console.error('❌ Login error:', error);
      
      let message = 'Errore durante l\'accesso';
      
      // Messaggi di errore personalizzati
      if (error.code === 'auth/user-not-found') {
        message = 'Utente non trovato';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Password non corretta';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Email non valida';
      } else if (error.code === 'auth/user-disabled') {
        message = 'Account disabilitato';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Troppi tentativi. Riprova più tardi';
      } else if (error.code === 'auth/invalid-credential') {
        message = 'Email o password non validi';
      }
      
      return {
        success: false,
        message: message
      };
    }
  }

  // Registrazione nuovo utente
  async register(email, password, firstName, lastName, role = 'employee') {
    try {
      // Crea utente in Firebase Auth
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Crea documento utente in Firestore
      const userData = {
        id: user.uid,
        email: email,
        firstName: firstName,
        lastName: lastName,
        role: role,
        avatar: (firstName.charAt(0) + lastName.charAt(0)).toUpperCase(),
        department: role === 'admin' ? 'Amministrazione' : 'Generale',
        hireDate: new Date().toISOString().split('T')[0],
        vacationDays: 25,
        usedVacationDays: 0,
        createdAt: new Date().toISOString()
      };
      
      await this.db.collection('users').doc(user.uid).set(userData);
      
      console.log('✅ User registered successfully:', email);
      
      return {
        success: true,
        user: userData,
        message: 'Registrazione completata con successo'
      };
      
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      let message = 'Errore durante la registrazione';
      
      if (error.code === 'auth/email-already-in-use') {
        message = 'Email già registrata';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password troppo debole (minimo 6 caratteri)';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Email non valida';
      }
      
      return {
        success: false,
        message: message
      };
    }
  }

  // Logout
  async logout(skipConfirmation = false) {
    if (!skipConfirmation) {
      const confirmed = confirm('Sei sicuro di voler uscire dall\'applicazione?');
      if (!confirmed) return false;
    }

    try {
      // Logout da Firebase
      await this.auth.signOut();
      
      // Pulisci storage locale
      localStorage.removeItem(this.sessionKey);
      localStorage.removeItem('came_remember_me');
      
      console.log('✅ Logout successful');
      
      // Mostra messaggio
      if (window.UI && typeof window.UI.showToast === 'function') {
        window.UI.showToast('Logout effettuato con successo', 'success');
        setTimeout(() => this.redirectToLogin(), 800);
      } else {
        this.redirectToLogin();
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      this.redirectToLogin(); // Forza redirect anche in caso di errore
      return false;
    }
  }

  // Redirect al login
  redirectToLogin() {
    try {
      window.location.href = 'index.html';
    } catch (error) {
      console.error('Errore nel reindirizzamento:', error);
      window.location.reload();
    }
  }

  // Verifica se l'utente è autenticato
  isAuthenticated() {
    // Controlla Firebase Auth
    if (this.auth && this.auth.currentUser) {
      return true;
    }
    
    // Fallback: controlla sessione locale
    const session = this.getSession();
    if (!session) return false;
    
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    
    if (now > expiresAt) {
      this.logout(true);
      return false;
    }
    
    return true;
  }

  // Ottieni sessione locale
  getSession() {
    try {
      const session = localStorage.getItem(this.sessionKey);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error('Error parsing session data:', error);
      localStorage.removeItem(this.sessionKey);
      return null;
    }
  }

  // Ottieni utente corrente
  getCurrentUser() {
    // Prima prova da Firebase
    if (this.auth && this.auth.currentUser) {
      const session = this.getSession();
      return session ? session.user : null;
    }
    
    // Fallback da sessione locale
    const session = this.getSession();
    return session ? session.user : null;
  }

  // Verifica se l'utente è admin
  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === 'admin';
  }

  // Verifica se l'utente è dipendente
  isEmployee() {
    const user = this.getCurrentUser();
    return user && user.role === 'employee';
  }

  // Reset password (Firebase)
  async resetPassword(email) {
    try {
      await this.auth.sendPasswordResetEmail(email);
      
      return {
        success: true,
        message: 'Email di reset password inviata. Controlla la tua casella email.'
      };
    } catch (error) {
      console.error('❌ Password reset error:', error);
      
      let message = 'Errore durante il reset della password';
      
      if (error.code === 'auth/user-not-found') {
        message = 'Email non trovata';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Email non valida';
      }
      
      return {
        success: false,
        message: message
      };
    }
  }

  // Aggiorna dati utente in Firestore
  async updateUserData(userId, updates) {
    try {
      await this.db.collection('users').doc(userId).update({
        ...updates,
        updatedAt: new Date().toISOString()
      });
      
      // Aggiorna anche la sessione locale
      const session = this.getSession();
      if (session) {
        session.user = { ...session.user, ...updates };
        localStorage.setItem(this.sessionKey, JSON.stringify(session));
      }
      
      console.log('✅ User data updated');
      return true;
      
    } catch (error) {
      console.error('❌ Error updating user data:', error);
      return false;
    }
  }

  // Valida email
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Valida password
  validatePassword(password) {
    return {
      isValid: password.length >= 6,
      message: password.length < 6 ? 'La password deve essere di almeno 6 caratteri' : ''
    };
  }

  // Ottieni iniziali utente
  getUserInitials(user = null) {
    const currentUser = user || this.getCurrentUser();
    if (!currentUser) return '??';
    return (currentUser.firstName.charAt(0) + currentUser.lastName.charAt(0)).toUpperCase();
  }

  // Ottieni nome completo
  getUserFullName(user = null) {
    const currentUser = user || this.getCurrentUser();
    if (!currentUser) return 'Unknown User';
    return `${currentUser.firstName} ${currentUser.lastName}`;
  }

  // Formatta ruolo
  formatRole(role) {
    const roleMap = {
      admin: 'Amministratore',
      employee: 'Dipendente',
      manager: 'Manager'
    };
    return roleMap[role] || role;
  }
}

// Inizializza auth module
try {
  window.Auth = new Auth();
  console.log('✅ Auth module initialized successfully');
} catch (error) {
  console.error('❌ Error initializing Auth module:', error);
}

// Funzione logout globale
window.logout = function() {
  return window.Auth.logout();
};

// Export per moduli
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Auth;
}
