// Data Management Module
class Data {
  constructor() {
    this.init();
  }

  init() {
    // DISABILITATO: Non generare più dati demo automaticamente
    // this.initializeDemoData();
    console.log('✅ Data module initialized (demo data generation disabled)');
  }

  // Initialize demo data if not exists
  // NOTA: Questa funzione è disabilitata per evitare la creazione automatica di dati fittizi
  async initializeDemoData() {
    const currentUser = window.Auth?.getCurrentUser();
    if (!currentUser) return;

    console.log('⚠️ initializeDemoData chiamata ma disabilitata');

    // DISABILITATO: Non generare dati demo
    // // Initialize timesheet data
    // const timesheetData = await window.Storage.getTimesheetData(currentUser.id);
    // if (!timesheetData.lastUpdated) {
    //   await this.generateDemoTimesheetData(currentUser.id);
    // }

    // // Initialize requests data
    // const existingRequests = await window.Storage.getRequestsData(currentUser.id);
    // if (existingRequests.length === 0) {
    //   await this.generateDemoRequestsData(currentUser.id);
    // }
  }

  // Generate demo timesheet data
  generateDemoTimesheetData(userId) {
    const weeks = {};
    const currentDate = new Date();

    // Generate data for last 4 weeks
    for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - (currentDate.getDay() || 7) - 1 - (weekOffset * 7));

      const weekKey = this.getWeekKey(weekStart);
      weeks[weekKey] = {};

      // Generate hours for each day
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + dayOffset);
        const dayKey = day.toISOString().split('T')[0];

        // Skip weekends for most entries (with some exceptions)
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
        const hasWeekendWork = Math.random() > 0.8;

        if (!isWeekend || hasWeekendWork) {
          weeks[weekKey][dayKey] = {
            hours: isWeekend ? Math.floor(Math.random() * 4) + 1 : Math.floor(Math.random() * 4) + 6,
            notes: this.getRandomWorkNote(),
            startTime: isWeekend ? '10:00' : '09:00',
            endTime: null // Will be calculated
          };
        }
      }
    }

    const timesheetData = {
      weeks: weeks,
      totalHours: Object.values(weeks).reduce((total, week) => {
        return total + Object.values(week).reduce((weekTotal, day) => weekTotal + (day.hours || 0), 0);
      }, 0)
    };

    window.Storage.saveTimesheetData(userId, timesheetData);
  }

  // Generate demo requests data
  generateDemoRequestsData(userId) {
    const requestTypes = ['vacation', 'sick_leave', 'personal', 'early_exit', 'late_entry'];
    const statuses = ['approved', 'pending', 'rejected'];
    const requests = [];

    // Generate 8-12 random requests
    const numRequests = Math.floor(Math.random() * 5) + 8;

    for (let i = 0; i < numRequests; i++) {
      const type = requestTypes[Math.floor(Math.random() * requestTypes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 90) + Math.floor(Math.random() * 30));

      let endDate = null;
      if (type === 'vacation' || type === 'sick_leave') {
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + Math.floor(Math.random() * 5) + 1);
      }

      const request = {
        id: Date.now() + i,
        type: type,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate ? endDate.toISOString().split('T')[0] : null,
        reason: this.getRandomReason(type),
        status: status,
        submittedAt: new Date(startDate.getTime() - Math.random() * 86400000).toISOString(),
        notes: Math.random() > 0.5 ? this.getRandomNote() : null
      };

      if (type === 'early_exit' || type === 'late_entry') {
        request.time = type === 'early_exit' ? '15:30' : '10:00';
      }

      if (status !== 'pending') {
        request.processedAt = new Date(new Date(request.submittedAt).getTime() + Math.random() * 172800000).toISOString();
        request.processedBy = 'Anna Verdi';
      }

      requests.push(request);
    }

    // Sort by submission date (newest first)
    requests.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    window.Storage.saveRequestsData(userId, requests);
  }

  // Get week key for timesheet
  getWeekKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Get random work notes
  getRandomWorkNote() {
    const notes = [
      'Sviluppo nuove funzionalità',
      'Risoluzione bug critici',
      'Meeting con il team',
      'Code review',
      'Documentazione progetto',
      'Testing e debugging',
      'Pianificazione sprint',
      'Formazione tecnica',
      'Supporto clienti',
      'Analisi requisiti',
      'Deployment produzione',
      'Manutenzione server'
    ];
    return Math.random() > 0.3 ? notes[Math.floor(Math.random() * notes.length)] : '';
  }

  // Get random reason for requests
  getRandomReason(type) {
    const reasons = {
      vacation: [
        'Vacanze estive',
        'Lungo weekend',
        'Viaggio di famiglia',
        'Riposo programmato',
        'Vacanze natalizie'
      ],
      sick_leave: [
        'Influenza stagionale',
        'Visita medica',
        'Controllo specialistico',
        'Malessere generale',
        'Recupero post-operatorio'
      ],
      personal: [
        'Impegni familiari',
        'Questioni personali urgenti',
        'Appuntamenti importanti',
        'Esigenze private',
        'Commissioni personali'
      ],
      early_exit: [
        'Appuntamento medico',
        'Impegno familiare',
        'Questioni urgenti',
        'Visita specialistica'
      ],
      late_entry: [
        'Problemi di trasporto',
        'Appuntamento mattutino',
        'Questioni personali',
        'Controllo medico'
      ]
    };

    const typeReasons = reasons[type] || reasons.personal;
    return typeReasons[Math.floor(Math.random() * typeReasons.length)];
  }

  // Get random admin notes
  getRandomNote() {
    const notes = [
      'Richiesta approvata senza problemi',
      'Verificare disponibilità del team',
      'Giustificato dalle circostanze',
      'Richiesta in linea con il regolamento',
      'Necessario accordo con il responsabile'
    ];
    return notes[Math.floor(Math.random() * notes.length)];
  }

  // Get dashboard statistics
  async getDashboardStats(userId) {
    const user = window.Auth?.getCurrentUser();
    if (!user) return null;

    const timesheetData = await window.Storage.getTimesheetData(userId);
    const requests = await window.Storage.getRequestsData(userId);

    // Calculate current month hours
    const currentDate = new Date();
    const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    let currentMonthHours = 0;
    Object.keys(timesheetData.weeks).forEach(weekKey => {
      if (weekKey.startsWith(currentMonthKey)) {
        const week = timesheetData.weeks[weekKey];
        currentMonthHours += Object.values(week).reduce((sum, day) => sum + (day.hours || 0), 0);
      }
    });

    // Calculate vacation balance
    const availableVacationDays = user.vacationDays || 25;
    const usedVacationDays = user.usedVacationDays || 0;
    const pendingVacationRequests = requests.filter(r =>
      r.type === 'vacation' && r.status === 'pending'
    ).reduce((sum, r) => {
      if (r.endDate) {
        const start = new Date(r.startDate);
        const end = new Date(r.endDate);
        return sum + Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      }
      return sum + 1;
    }, 0);

    // Count pending requests
    const pendingRequests = requests.filter(r => r.status === 'pending').length;

    // Get recent requests
    const recentRequests = requests
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
      .slice(0, 5);

    return {
      currentMonthHours,
      vacationBalance: {
        available: availableVacationDays,
        used: usedVacationDays,
        pending: pendingVacationRequests,
        remaining: availableVacationDays - usedVacationDays - pendingVacationRequests
      },
      pendingRequests,
      recentRequests,
      totalRequests: requests.length
    };
  }

  // Get admin dashboard statistics
  async getAdminStats() {
    if (!window.Auth?.isAdmin()) return null;

    // Carica tutti gli utenti da Firestore
    let allUsers = await window.Storage.getAllUsers();
    const allRequests = await window.Storage.getAllRequests();
    const allTimeRegistrations = await window.Storage.getAllTimeRegistrations();

    // Se non ci sono utenti in Firestore, usa array vuoto
    if (!allUsers || allUsers.length === 0) {
      console.log('⚠️ No users in Firestore');
      allUsers = [];
    }

    console.log('📊 Admin Stats - Users loaded:', allUsers.length);
    console.log('📊 Admin Stats - Requests loaded:', allRequests.length);
    console.log('📊 Admin Stats - Time Registrations loaded:', allTimeRegistrations.length);

    const totalEmployees = allUsers.filter(u => u.role === 'employee').length;
    const pendingRequests = allRequests.filter(r => r.status === 'pending');

    const today = new Date().toISOString().split('T')[0];
    const approvedToday = allRequests.filter(r =>
      r.status === 'approved' &&
      r.processedAt &&
      r.processedAt.split('T')[0] === today
    ).length;

    // Calculate total hours for current month from time registrations
    let totalHoursThisMonth = 0;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    allTimeRegistrations.forEach(registration => {
      const regDate = new Date(registration.date);
      if (regDate.getMonth() === currentMonth && regDate.getFullYear() === currentYear) {
        // Parse hours from totalHours string (format: "8:30")
        const [hours, minutes] = registration.totalHours.split(':').map(Number);
        totalHoursThisMonth += hours + (minutes / 60);
      }
    });
    
    totalHoursThisMonth = Math.round(totalHoursThisMonth);

    // Team status (simulated)
    const teamStatus = allUsers.filter(u => u.role === 'employee').map(user => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      avatar: user.avatar,
      status: this.getRandomEmployeeStatus(),
      lastSeen: new Date(Date.now() - Math.random() * 3600000).toISOString()
    }));

    return {
      totalEmployees,
      pendingRequestsCount: pendingRequests.length,
      approvedToday,
      totalHoursThisMonth,
      pendingRequests: pendingRequests.slice(0, 5), // Latest 5
      teamStatus,
      recentActivity: this.getRecentActivity(allRequests)
    };
  }

  // Get random employee status
  getRandomEmployeeStatus() {
    const statuses = [
      { type: 'present', label: 'Presente', color: 'success' },
      { type: 'absent', label: 'Assente', color: 'danger' },
      { type: 'break', label: 'In pausa', color: 'warning' },
      { type: 'meeting', label: 'In riunione', color: 'info' }
    ];

    const weights = [0.6, 0.1, 0.2, 0.1]; // Present is most likely
    const random = Math.random();
    let sum = 0;

    for (let i = 0; i < weights.length; i++) {
      sum += weights[i];
      if (random <= sum) {
        return statuses[i];
      }
    }

    return statuses[0];
  }

  // Get recent activity for admin dashboard
  getRecentActivity(allRequests) {
    return allRequests
      .filter(r => r.processedAt || r.submittedAt)
      .sort((a, b) => {
        const dateA = new Date(a.processedAt || a.submittedAt);
        const dateB = new Date(b.processedAt || b.submittedAt);
        return dateB - dateA;
      })
      .slice(0, 10)
      .map(request => ({
        id: request.id,
        type: request.type,
        user: request.user,
        action: request.processedAt ? 'processed' : 'submitted',
        status: request.status,
        timestamp: request.processedAt || request.submittedAt
      }));
  }

  // Get chart data for admin dashboard
  async getChartData() {
    if (!window.Auth?.isAdmin()) return null;

    const allUsers = (await window.Storage.getAllUsers()).filter(u => u.role === 'employee');

    // Hours per employee (last 7 days)
    const hoursPerEmployee = {
      labels: allUsers.map(u => u.firstName),
      datasets: [{
        label: 'Ore lavorate',
        data: allUsers.map(user => {
          const timesheetData = window.Storage.getTimesheetData(user.id);
          let weekHours = 0;

          // Get current week hours
          const today = new Date();
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay() + 1);
          const weekKey = this.getWeekKey(weekStart);

          if (timesheetData.weeks[weekKey]) {
            weekHours = Object.values(timesheetData.weeks[weekKey])
              .reduce((sum, day) => sum + (day.hours || 0), 0);
          }

          return weekHours;
        }),
        backgroundColor: 'rgba(0, 102, 255, 0.1)',
        borderColor: 'rgba(0, 102, 255, 1)',
        borderWidth: 2
      }]
    };

    // Request trends (last 30 days)
    const allRequests = await window.Storage.getAllRequests();
    const requestTrends = this.getRequestTrendData(allRequests);

    return {
      hoursPerEmployee,
      requestTrends
    };
  }

  // Get request trend data for chart
  getRequestTrendData(allRequests) {
    const last30Days = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      last30Days.push(date.toISOString().split('T')[0]);
    }

    const requestTypes = ['vacation', 'sick_leave', 'personal', 'early_exit', 'late_entry'];
    const datasets = requestTypes.map((type, index) => {
      const colors = [
        'rgba(0, 102, 255, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(139, 92, 246, 0.8)'
      ];

      const data = last30Days.map(date => {
        return allRequests.filter(r =>
          r.type === type &&
          r.submittedAt.split('T')[0] === date
        ).length;
      });

      return {
        label: this.formatRequestType(type),
        data: data,
        borderColor: colors[index],
        backgroundColor: colors[index].replace('0.8', '0.1'),
        tension: 0.4,
        fill: false
      };
    });

    return {
      labels: last30Days.map(date => {
        const d = new Date(date);
        return `${d.getDate()}/${d.getMonth() + 1}`;
      }),
      datasets: datasets
    };
  }

  // Format request type for display
  formatRequestType(type) {
    const typeMap = {
      vacation: 'Ferie',
      sick_leave: 'Malattia',
      personal: 'Permesso',
      early_exit: 'Uscita Anticipata',
      late_entry: 'Entrata Posticipata'
    };
    return typeMap[type] || type;
  }

  // Get request status badge class
  getStatusBadgeClass(status) {
    const statusMap = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger'
    };
    return statusMap[status] || 'badge-neutral';
  }

  // Format request status for display
  formatRequestStatus(status) {
    const statusMap = {
      pending: 'In attesa',
      approved: 'Approvata',
      rejected: 'Rifiutata'
    };
    return statusMap[status] || status;
  }

  // Calculate working days between two dates
  calculateWorkingDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let count = 0;
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  // Validate request data
  validateRequest(requestData) {
    const errors = {};

    if (!requestData.type) {
      errors.type = 'Tipo di richiesta obbligatorio';
    }

    if (!requestData.startDate) {
      errors.startDate = 'Data inizio obbligatoria';
    } else {
      const startDate = new Date(requestData.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        errors.startDate = 'La data non può essere nel passato';
      }
    }

    if (requestData.endDate && requestData.startDate) {
      const startDate = new Date(requestData.startDate);
      const endDate = new Date(requestData.endDate);

      if (endDate < startDate) {
        errors.endDate = 'La data fine deve essere successiva alla data inizio';
      }
    }

    if (!requestData.reason || requestData.reason.trim().length < 5) {
      errors.reason = 'Motivazione obbligatoria (minimo 5 caratteri)';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Export timesheet data
  async exportTimesheet(userId, format = 'json') {
    const user = window.Auth?.getCurrentUser();
    const timesheetData = await window.Storage.getTimesheetData(userId);

    if (format === 'json') {
      return {
        user: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        exportDate: new Date().toISOString(),
        data: timesheetData
      };
    }

    if (format === 'csv') {
      let csv = 'Data,Ore,Note\n';

      Object.keys(timesheetData.weeks).forEach(weekKey => {
        const week = timesheetData.weeks[weekKey];
        Object.keys(week).forEach(dayKey => {
          const day = week[dayKey];
          csv += `"${dayKey}",${day.hours || 0},"${day.notes || ''}"\n`;
        });
      });

      return csv;
    }

    return null;
  }

  // Clear old data (housekeeping)
  clearOldData(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // This could be implemented to clean up old timesheet entries
    // and resolved requests to keep storage size manageable
    console.log(`Would clear data older than ${cutoffDate.toISOString()}`);
  }
}

// Initialize data module
window.Data = new Data();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Data;
}