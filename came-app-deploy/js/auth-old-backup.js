// BACKUP del vecchio auth.js (prima di Firebase)
// Questo file è un backup e NON viene utilizzato dall'app

// Authentication Module
class Auth {
  constructor() {
    this.sessionKey = 'came_session';
    this.init();
  }

  init() {
    const user = this.getCurrentUser();
    const isAuth = this.isAuthenticated();
    console.log('Auth module initialized - User:', user?.firstName, 'Authenticated:', isAuth);
  }

  // Demo users (OLD VERSION)
  getDemoUsers() {
    return [
      {
        id: 1,
        email: 'mario.rossi@came.it',
        password: 'employee123',
        firstName: 'Mario',
        lastName: 'Rossi',
        role: 'employee',
        avatar: 'MR',
        department: 'Sviluppo',
        hireDate: '2022-01-15',
        vacationDays: 25,
        usedVacationDays: 8
      },
      {
        id: 2,
        email: 'admin@came.it',
        password: 'admin123',
        firstName: 'Anna',
        lastName: 'Verdi',
        role: 'admin',
        avatar: 'AV',
        department: 'Amministrazione',
        hireDate: '2020-03-10',
        vacationDays: 30,
        usedVacationDays: 5
      }
    ];
  }
}
