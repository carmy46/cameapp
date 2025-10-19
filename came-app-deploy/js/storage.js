// Storage Module with Firebase Firestore
class Storage {
  constructor() {
    this.prefix = 'came_';
    this.db = null;
    this.init();
  }

  init() {
    // Aspetta che Firebase sia caricato
    if (typeof firebase === 'undefined') {
      console.warn('⏳ Firestore non ancora caricato, riprovo...');
      setTimeout(() => this.init(), 500);
      return;
    }

    this.db = firebase.firestore();
    console.log('✅ Storage module initialized with Firestore');

    // Attiva sincronizzazione automatica
    this.setupAutoSyncRequests();
    this.setupAutoSyncTimeRegistrations();
    console.log('🔄 Sincronizzazione automatica attivata');
  }

  // ===== TIMESHEET METHODS =====

  // Salva dati timesheet in Firestore
  async saveTimesheetData(userId, data) {
    try {
      await this.db.collection('timesheets').doc(userId).set({
        ...data,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      
      console.log('✅ Timesheet data saved to Firestore');
      return true;
      
    } catch (error) {
      console.error('❌ Error saving timesheet:', error);
      
      // Fallback a localStorage
      this.setItem(`timesheet_${userId}`, {
        ...data,
        lastUpdated: new Date().toISOString()
      });
      return false;
    }
  }

  // Carica dati timesheet da Firestore
  async getTimesheetData(userId) {
    try {
      const docSnap = await this.db.collection('timesheets').doc(userId).get();
      
      if (docSnap.exists) {
        console.log('✅ Timesheet data loaded from Firestore');
        return docSnap.data();
      } else {
        console.log('📝 No timesheet data found, returning default');
        return {
          weeks: {},
          totalHours: 0,
          lastUpdated: null
        };
      }
      
    } catch (error) {
      console.error('❌ Error loading timesheet:', error);
      
      // Fallback a localStorage
      return this.getItem(`timesheet_${userId}`, {
        weeks: {},
        totalHours: 0,
        lastUpdated: null
      });
    }
  }

  // ===== TIME REGISTRATIONS METHODS =====

  // Salva registrazioni ore in Firestore (con doppio salvataggio per sincronizzazione)
  async saveTimeRegistrations(userId, registrations) {
    try {
      // Assicurati che ogni registrazione abbia le informazioni utente complete
      const currentUser = window.Auth?.getCurrentUser();
      const enhancedRegistrations = registrations.map(reg => {
        // Se la registrazione non ha già le info utente, aggiungile
        if (!reg.userName && currentUser) {
          return {
            ...reg,
            userId: currentUser.id,
            userName: `${currentUser.firstName} ${currentUser.lastName}`,
            userEmail: currentUser.email
          };
        }
        return reg;
      });
      
      // 1. Salva nella collezione per utente (retrocompatibilità)
      await this.db.collection('time_registrations').doc(userId).set({
        registrations: enhancedRegistrations,
        userId: userId,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      
      // 2. Salva ANCHE ogni registrazione nella collezione centralizzata
      const batch = this.db.batch();
      
      for (const reg of enhancedRegistrations) {
        // Usa l'ID della registrazione come document ID
        const docRef = this.db.collection('all_time_registrations').doc(reg.id.toString());
        batch.set(docRef, {
          ...reg,
          userId: userId,
          lastUpdated: new Date().toISOString()
        }, { merge: true });
      }
      
      await batch.commit();
      
      console.log('✅ Time registrations saved to both collections');
      return true;
      
    } catch (error) {
      console.error('❌ Error saving time registrations:', error);
      
      // Fallback a localStorage
      this.setItem(`time_registrations_${userId}`, {
        registrations: registrations,
        lastUpdated: new Date().toISOString()
      });
      return false;
    }
  }

  // Carica registrazioni ore da Firestore
  async getTimeRegistrations(userId) {
    try {
      const docSnap = await this.db.collection('time_registrations').doc(userId).get();
      
      if (docSnap.exists) {
        console.log('✅ Time registrations loaded from Firestore');
        return docSnap.data().registrations || [];
      } else {
        console.log('📝 No time registrations found, returning empty array');
        return [];
      }
      
    } catch (error) {
      console.error('❌ Error loading time registrations:', error);
      
      // Fallback a localStorage
      const data = this.getItem(`time_registrations_${userId}`, { registrations: [] });
      return data.registrations || [];
    }
  }

  // Aggiorna una registrazione ore
  async updateTimeRegistration(userId, registrationId, updatedData) {
    try {
      console.log(`✏️ Aggiornamento registrazione ${registrationId} per utente ${userId}`);

      // 1. Aggiorna nella collezione centralizzata
      const centralDocRef = this.db.collection('all_time_registrations').doc(registrationId.toString());
      await centralDocRef.update({
        ...updatedData,
        lastUpdated: new Date().toISOString()
      });

      console.log(`✅ Registrazione ${registrationId} aggiornata con successo`);
      return true;

    } catch (error) {
      console.error('❌ Error updating time registration:', error);
      return false;
    }
  }

  // Elimina una registrazione ore
  async deleteTimeRegistration(userId, registrationId) {
    try {
      console.log(`🗑️ Eliminazione registrazione ${registrationId} per utente ${userId}`);

      // 1. Elimina dalla collezione centralizzata
      await this.db.collection('all_time_registrations').doc(registrationId.toString()).delete();

      // 2. Elimina anche dalla collezione per utente (per retrocompatibilità)
      try {
        const userDocRef = this.db.collection('time_registrations').doc(userId);
        const userDoc = await userDocRef.get();

        if (userDoc.exists) {
          const data = userDoc.data();
          const registrations = data.registrations || [];

          // Filtra la registrazione da eliminare
          const updatedRegistrations = registrations.filter(reg => reg.id != registrationId);

          await userDocRef.set({
            registrations: updatedRegistrations,
            userId: userId,
            lastUpdated: new Date().toISOString()
          }, { merge: true });

          console.log(`✅ Registrazione ${registrationId} eliminata anche dalla collezione utente`);
        }
      } catch (userError) {
        console.warn('⚠️ Errore eliminazione dalla collezione utente:', userError);
      }

      console.log(`✅ Registrazione ${registrationId} eliminata con successo`);
      return true;

    } catch (error) {
      console.error('❌ Error deleting time registration:', error);
      return false;
    }
  }

  // Ottieni tutte le registrazioni ore (per admin) - VERSIONE MIGLIORATA
  async getAllTimeRegistrations() {
    try {
      // Prima prova a caricare dalla collezione centralizzata
      const centralSnapshot = await this.db.collection('all_time_registrations')
        .orderBy('submittedAt', 'desc')
        .limit(500)
        .get();
      
      const allRegistrations = [];
      
      if (!centralSnapshot.empty) {
        console.log('✅ Loading from centralized collection');
        centralSnapshot.forEach(doc => {
          const data = doc.data();
          allRegistrations.push(data);
        });
      } else {
        console.log('⚠️ Centralized collection empty, loading from user collections');
        
        // Fallback: carica dalle collezioni per utente
        const querySnapshot = await this.db.collection('time_registrations').get();
        
        querySnapshot.forEach(doc => {
          const userId = doc.id;
          const data = doc.data();
          const userRegistrations = data.registrations || [];

          userRegistrations.forEach(registration => {
            allRegistrations.push({
              ...registration,
              userId: registration.userId || userId
            });
          });
        });
      }
      
      // Ordina per data (più recenti prima)
      allRegistrations.sort((a, b) => 
        new Date(b.submittedAt || b.date) - new Date(a.submittedAt || a.date)
      );
      
      console.log('✅ All time registrations loaded:', allRegistrations.length);
      return allRegistrations;
      
    } catch (error) {
      console.error('❌ Error loading all time registrations:', error);
      return [];
    }
  }

  // ===== REQUESTS METHODS =====

  // Salva richieste in Firestore (con doppio salvataggio per sincronizzazione)
  async saveRequestsData(userId, requests) {
    try {
      // Assicurati che ogni richiesta abbia le informazioni utente complete
      const currentUser = window.Auth?.getCurrentUser();
      const enhancedRequests = requests.map(req => {
        // Se la richiesta non ha già le info utente, aggiungile
        if (!req.userName && currentUser) {
          return {
            ...req,
            userId: currentUser.id,
            userName: `${currentUser.firstName} ${currentUser.lastName}`,
            userEmail: currentUser.email
          };
        }
        return req;
      });
      
      // 1. Salva nella collezione per utente (retrocompatibilità)
      await this.db.collection('requests').doc(userId).set({
        requests: enhancedRequests,
        userId: userId,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      
      // 2. Salva ANCHE ogni richiesta nella collezione centralizzata
      const batch = this.db.batch();
      
      for (const req of enhancedRequests) {
        // Usa l'ID della richiesta come document ID
        const docRef = this.db.collection('all_requests').doc(req.id.toString());
        batch.set(docRef, {
          ...req,
          userId: userId,
          lastUpdated: new Date().toISOString()
        }, { merge: true });
      }
      
      await batch.commit();
      
      console.log('✅ Requests saved to both collections');
      return true;
      
    } catch (error) {
      console.error('❌ Error saving requests:', error);
      
      // Fallback a localStorage
      this.setItem(`requests_${userId}`, {
        requests: requests,
        lastUpdated: new Date().toISOString()
      });
      return false;
    }
  }

  // Carica richieste da Firestore
  async getRequestsData(userId) {
    try {
      const docSnap = await this.db.collection('requests').doc(userId).get();
      
      if (docSnap.exists) {
        console.log('✅ Requests loaded from Firestore');
        return docSnap.data().requests || [];
      } else {
        console.log('📝 No requests found, returning empty array');
        return [];
      }
      
    } catch (error) {
      console.error('❌ Error loading requests:', error);
      
      // Fallback a localStorage
      const data = this.getItem(`requests_${userId}`, { requests: [] });
      return data.requests || [];
    }
  }

  // Aggiungi nuova richiesta
  async addRequest(userId, request) {
    try {
      const requests = await this.getRequestsData(userId);

      // Aggiungi sempre informazioni utente complete
      const currentUser = window.Auth?.getCurrentUser();
      if (!currentUser) {
        console.error('❌ No current user found');
        return null;
      }
      
      const userInfo = {
        userId: currentUser.id,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        userEmail: currentUser.email
      };

      const newRequest = {
        id: Date.now(),  // Numero, non stringa
        ...userInfo,
        ...request,
        status: 'pending',
        submittedAt: new Date().toISOString()
      };

      requests.push(newRequest);
      await this.saveRequestsData(userId, requests);

      console.log('✅ Request added with user info:', newRequest.id);
      return newRequest;

    } catch (error) {
      console.error('❌ Error adding request:', error);
      return null;
    }
  }

  // Aggiorna richiesta (aggiorna anche collezione centralizzata)
  async updateRequest(userId, requestId, updates) {
    try {
      // 1. Aggiorna nella collezione per utente
      const requests = await this.getRequestsData(userId);
      const index = requests.findIndex(r => r.id === requestId);

      if (index !== -1) {
        requests[index] = {
          ...requests[index],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        
        await this.saveRequestsData(userId, requests);
        
        // 2. Aggiorna anche nella collezione centralizzata
        await this.db.collection('all_requests').doc(requestId.toString()).update({
          ...updates,
          updatedAt: new Date().toISOString()
        });
        
        console.log('✅ Request updated in both collections:', requestId);
        return requests[index];
      }

      console.warn('⚠️ Request not found:', requestId);
      return null;
      
    } catch (error) {
      console.error('❌ Error updating request:', error);
      return null;
    }
  }

  // Elimina richiesta
  async deleteRequest(userId, requestId) {
    try {
      const requests = await this.getRequestsData(userId);
      const filteredRequests = requests.filter(r => r.id !== requestId);

      if (filteredRequests.length !== requests.length) {
        await this.saveRequestsData(userId, filteredRequests);
        console.log('✅ Request deleted:', requestId);
        return true;
      }

      console.warn('⚠️ Request not found:', requestId);
      return false;
      
    } catch (error) {
      console.error('❌ Error deleting request:', error);
      return false;
    }
  }

  // ===== ADMIN METHODS =====

  // Ottieni tutte le richieste (per admin) - VERSIONE MIGLIORATA
  async getAllRequests() {
    try {
      // Prima prova a caricare dalla collezione centralizzata
      const centralSnapshot = await this.db.collection('all_requests')
        .orderBy('submittedAt', 'desc')
        .limit(500)
        .get();
      
      const allRequests = [];
      
      if (!centralSnapshot.empty) {
        console.log('✅ Loading requests from centralized collection');
        centralSnapshot.forEach(doc => {
          const data = doc.data();
          // Crea l'oggetto user dalle info salvate
          const userInfo = {
            id: data.userId,
            firstName: data.userName ? data.userName.split(' ')[0] : 'Utente',
            lastName: data.userName ? data.userName.split(' ').slice(1).join(' ') : 'Sconosciuto',
            email: data.userEmail || '',
            avatar: data.userName ? data.userName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U?'
          };
          
          allRequests.push({
            ...data,
            user: userInfo
          });
        });
      } else {
        console.log('⚠️ Centralized collection empty, loading from user collections');
        
        // Fallback: carica dalle collezioni per utente
        const querySnapshot = await this.db.collection('requests').get();
        
        querySnapshot.forEach(doc => {
          const userId = doc.id;
          const data = doc.data();
          const userRequests = data.requests || [];

          userRequests.forEach(request => {
            const userInfo = {
              id: request.userId || userId,
              firstName: request.userName ? request.userName.split(' ')[0] : 'Utente',
              lastName: request.userName ? request.userName.split(' ').slice(1).join(' ') : 'Sconosciuto',
              email: request.userEmail || '',
              avatar: request.userName ? request.userName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U?'
            };

            allRequests.push({
              ...request,
              userId: request.userId || userId,
              user: userInfo
            });
          });
        });
      }
      
      // Ordina per data di invio (più recenti prima)
      allRequests.sort((a, b) => 
        new Date(b.submittedAt) - new Date(a.submittedAt)
      );
      
      console.log('✅ All requests loaded:', allRequests.length);
      return allRequests;
      
    } catch (error) {
      console.error('❌ Error loading all requests:', error);
      return [];
    }
  }

  // Ottieni tutti gli utenti (per admin)
  async getAllUsers() {
    try {
      const querySnapshot = await this.db.collection('users').get();
      const users = [];
      
      querySnapshot.forEach(doc => {
        users.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('✅ All users loaded:', users.length);
      return users;
      
    } catch (error) {
      console.error('❌ Error loading users:', error);
      return [];
    }
  }

  // ===== SETTINGS METHODS =====

  // Salva impostazioni utente
  async saveUserSettings(userId, settings) {
    try {
      await this.db.collection('settings').doc(userId).set({
        ...settings,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      
      console.log('✅ Settings saved');
      return true;
      
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      
      // Fallback a localStorage
      this.setItem(`settings_${userId}`, {
        ...settings,
        lastUpdated: new Date().toISOString()
      });
      return false;
    }
  }

  // Carica impostazioni utente
  async getUserSettings(userId) {
    try {
      const docSnap = await this.db.collection('settings').doc(userId).get();
      
      if (docSnap.exists) {
        return docSnap.data();
      } else {
        // Impostazioni di default
        return {
          theme: 'light',
          language: 'it',
          notifications: {
            email: true,
            push: true,
            desktop: false
          },
          dashboard: {
            showWelcome: true,
            compactMode: false
          }
        };
      }
      
    } catch (error) {
      console.error('❌ Error loading settings:', error);
      
      // Fallback a localStorage
      return this.getItem(`settings_${userId}`, {
        theme: 'light',
        language: 'it',
        notifications: {
          email: true,
          push: true,
          desktop: false
        },
        dashboard: {
          showWelcome: true,
          compactMode: false
        }
      });
    }
  }

  // ===== REAL-TIME LISTENERS =====

  // Ascolta cambiamenti in tempo reale per le richieste
  listenToRequests(userId, callback) {
    try {
      const unsubscribe = this.db.collection('requests').doc(userId)
        .onSnapshot((docSnap) => {
          if (docSnap.exists) {
            const requests = docSnap.data().requests || [];
            console.log('🔄 Real-time update: requests changed');
            callback(requests);
          }
        });

      return unsubscribe; // Ritorna la funzione per interrompere l'ascolto

    } catch (error) {
      console.error('❌ Error setting up listener:', error);
      return null;
    }
  }

  // Ascolta tutte le richieste (per admin) - dalla collezione centralizzata
  listenToAllRequests(callback) {
    try {
      const unsubscribe = this.db.collection('all_requests')
        .orderBy('submittedAt', 'desc')
        .limit(500)
        .onSnapshot(async (snapshot) => {
          console.log('🔄 Real-time update: all requests changed');

          const allRequests = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            // Crea l'oggetto user dalle info salvate
            const userInfo = {
              id: data.userId,
              firstName: data.userName ? data.userName.split(' ')[0] : 'Utente',
              lastName: data.userName ? data.userName.split(' ').slice(1).join(' ') : 'Sconosciuto',
              email: data.userEmail || '',
              avatar: data.userName ? data.userName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U?'
            };

            allRequests.push({
              ...data,
              user: userInfo
            });
          });

          callback(allRequests);
        });

      return unsubscribe;

    } catch (error) {
      console.error('❌ Error setting up all requests listener:', error);
      return null;
    }
  }

  // Listener per sincronizzazione automatica richieste (collegamento collezioni)
  setupAutoSyncRequests() {
    try {
      console.log('🔄 Attivazione sincronizzazione automatica richieste...');

      // Ascolta TUTTE le collezioni requests per utente
      const unsubscribe = this.db.collection('requests')
        .onSnapshot(async (snapshot) => {
          console.log('🔄 Auto-sync: rilevati cambiamenti nelle richieste');

          // Per ogni documento modificato, sincronizza nella collezione centralizzata
          snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added' || change.type === 'modified') {
              const userId = change.doc.id;
              const data = change.doc.data();
              const requests = data.requests || [];

              console.log(`🔄 Auto-sync: sincronizzazione ${requests.length} richieste per utente ${userId}`);

              // Salva ogni richiesta nella collezione centralizzata
              const batch = this.db.batch();
              let batchCount = 0;

              for (const request of requests) {
                const enhancedRequest = {
                  ...request,
                  userId: request.userId || userId,
                  userName: request.userName || `Utente ${userId.substring(0, 8)}`,
                  userEmail: request.userEmail || '',
                  lastUpdated: new Date().toISOString()
                };

                const docRef = this.db.collection('all_requests').doc(request.id.toString());
                batch.set(docRef, enhancedRequest, { merge: true });
                batchCount++;

                if (batchCount >= 500) {
                  await batch.commit();
                  batchCount = 0;
                }
              }

              if (batchCount > 0) {
                await batch.commit();
              }

              console.log(`✅ Auto-sync completato per utente ${userId}`);
            }
          });
        });

      return unsubscribe;

    } catch (error) {
      console.error('❌ Error setting up auto-sync:', error);
      return null;
    }
  }

  // Listener per sincronizzazione automatica registrazioni ore (collegamento collezioni)
  setupAutoSyncTimeRegistrations() {
    try {
      console.log('🔄 Attivazione sincronizzazione automatica registrazioni ore...');

      // Ascolta TUTTE le collezioni time_registrations per utente
      const unsubscribe = this.db.collection('time_registrations')
        .onSnapshot(async (snapshot) => {
          console.log('🔄 Auto-sync: rilevati cambiamenti nelle registrazioni ore');

          // Per ogni documento modificato, sincronizza nella collezione centralizzata
          snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added' || change.type === 'modified') {
              const userId = change.doc.id;
              const data = change.doc.data();
              const registrations = data.registrations || [];

              console.log(`🔄 Auto-sync: sincronizzazione ${registrations.length} registrazioni per utente ${userId}`);

              // Salva ogni registrazione nella collezione centralizzata
              const batch = this.db.batch();
              let batchCount = 0;

              for (const registration of registrations) {
                const enhancedReg = {
                  ...registration,
                  userId: registration.userId || userId,
                  userName: registration.userName || `Utente ${userId.substring(0, 8)}`,
                  userEmail: registration.userEmail || '',
                  lastUpdated: new Date().toISOString()
                };

                const docRef = this.db.collection('all_time_registrations').doc(registration.id.toString());
                batch.set(docRef, enhancedReg, { merge: true });
                batchCount++;

                if (batchCount >= 500) {
                  await batch.commit();
                  batchCount = 0;
                }
              }

              if (batchCount > 0) {
                await batch.commit();
              }

              console.log(`✅ Auto-sync completato per utente ${userId}`);
            }
          });
        });

      return unsubscribe;

    } catch (error) {
      console.error('❌ Error setting up auto-sync time registrations:', error);
      return null;
    }
  }

  // ===== LOCALSTORAGE FALLBACK METHODS =====

  // Set item in localStorage
  setItem(key, value) {
    try {
      const prefixedKey = this.prefix + key;
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(prefixedKey, serializedValue);
      return true;
    } catch (error) {
      console.error('Error storing data:', error);
      return false;
    }
  }

  // Get item from localStorage
  getItem(key, defaultValue = null) {
    try {
      const prefixedKey = this.prefix + key;
      const item = localStorage.getItem(prefixedKey);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error retrieving data:', error);
      return defaultValue;
    }
  }

  // Remove item from localStorage
  removeItem(key) {
    try {
      const prefixedKey = this.prefix + key;
      localStorage.removeItem(prefixedKey);
      return true;
    } catch (error) {
      console.error('Error removing data:', error);
      return false;
    }
  }

  // Clear all app data
  clearAll() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }

  // ===== UTILITY METHODS =====

  // Check if localStorage is available
  isAvailable() {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Export data
  async exportData(userId) {
    try {
      const timesheet = await this.getTimesheetData(userId);
      const requests = await this.getRequestsData(userId);
      const settings = await this.getUserSettings(userId);
      
      const exportData = {
        timesheet,
        requests,
        settings,
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        appName: 'CAME'
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `came-export-${userId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      console.log('✅ Data exported successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Error exporting data:', error);
      return false;
    }
  }

  // Import data
  async importData(userId, file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const importData = JSON.parse(e.target.result);
          
          if (!importData.appName || importData.appName !== 'CAME') {
            reject(new Error('File di backup non valido'));
            return;
          }
          
          // Importa i dati
          if (importData.timesheet) {
            await this.saveTimesheetData(userId, importData.timesheet);
          }
          
          if (importData.requests) {
            await this.saveRequestsData(userId, importData.requests);
          }
          
          if (importData.settings) {
            await this.saveUserSettings(userId, importData.settings);
          }
          
          console.log('✅ Data imported successfully');
          resolve({ success: true, message: 'Dati importati con successo' });
          
        } catch (error) {
          console.error('❌ Error importing data:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Errore nella lettura del file'));
      reader.readAsText(file);
    });
  }
}

// Initialize storage module
window.Storage = new Storage();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Storage;
}

console.log('✅ Storage module loaded successfully');
