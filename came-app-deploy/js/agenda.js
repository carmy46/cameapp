/**
 * CAME - Agenda Aziendale Intelligente
 * Business Agenda with AI-powered features
 */

(function() {
    'use strict';

    // ==========================================
    // STATE MANAGEMENT
    // ==========================================

    const AgendaState = {
        currentDate: new Date(),
        currentView: 'month',
        events: [],
        selectedDate: new Date(),
        categories: ['meeting', 'deadline', 'task', 'personal'],
        currentFilter: 'all'
    };

    // ==========================================
    // EVENT STORAGE
    // ==========================================

    const EventStorage = {
        STORAGE_KEY: 'came_agenda_events',

        loadEvents() {
            try {
                const stored = localStorage.getItem(this.STORAGE_KEY);
                if (stored) {
                    const events = JSON.parse(stored);
                    // Convert date strings back to Date objects
                    return events.map(event => ({
                        ...event,
                        date: new Date(event.date),
                        startTime: event.startTime,
                        endTime: event.endTime
                    }));
                }
            } catch (error) {
                console.error('Error loading events:', error);
            }
            return this.getDefaultEvents();
        },

        saveEvents(events) {
            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(events));
                return true;
            } catch (error) {
                console.error('Error saving events:', error);
                return false;
            }
        },

        addEvent(event) {
            const events = this.loadEvents();
            event.id = this.generateId();
            event.createdAt = new Date().toISOString();
            events.push(event);
            this.saveEvents(events);
            return event;
        },

        updateEvent(eventId, updates) {
            const events = this.loadEvents();
            const index = events.findIndex(e => e.id === eventId);
            if (index !== -1) {
                events[index] = { ...events[index], ...updates };
                this.saveEvents(events);
                return events[index];
            }
            return null;
        },

        deleteEvent(eventId) {
            const events = this.loadEvents();
            const filtered = events.filter(e => e.id !== eventId);
            this.saveEvents(filtered);
            return filtered;
        },

        generateId() {
            return 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        },

        getDefaultEvents() {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);

            return [
                {
                    id: 'evt_1',
                    title: 'Riunione Team Marketing',
                    date: today,
                    startTime: '09:00',
                    endTime: '10:30',
                    category: 'meeting',
                    priority: 'high',
                    location: 'Sala Conferenze A',
                    description: 'Discussione strategia Q4 e lancio nuovi prodotti',
                    reminder: 30,
                    allDay: false
                },
                {
                    id: 'evt_2',
                    title: 'Revisione Budget Annuale',
                    date: tomorrow,
                    startTime: '14:00',
                    endTime: '16:00',
                    category: 'meeting',
                    priority: 'high',
                    location: 'Ufficio Direttore',
                    description: 'Analisi budget e allocazione risorse per l\'anno prossimo',
                    reminder: 60,
                    allDay: false
                },
                {
                    id: 'evt_3',
                    title: 'Scadenza Report Mensile',
                    date: nextWeek,
                    startTime: '17:00',
                    endTime: '17:00',
                    category: 'deadline',
                    priority: 'high',
                    location: '',
                    description: 'Completare e inviare il report mensile delle attività',
                    reminder: 1440,
                    allDay: false
                },
                {
                    id: 'evt_4',
                    title: 'Training Nuovo Software',
                    date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3),
                    startTime: '10:00',
                    endTime: '12:00',
                    category: 'task',
                    priority: 'medium',
                    location: 'Sala Formazione',
                    description: 'Sessione di formazione sul nuovo sistema CRM',
                    reminder: 30,
                    allDay: false
                }
            ];
        }
    };

    // ==========================================
    // AI INSIGHTS ENGINE
    // ==========================================

    const AIInsights = {
        generateInsights(events) {
            const insights = [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Check workload
            const todayEvents = events.filter(e => this.isSameDay(e.date, today));
            if (todayEvents.length >= 5) {
                insights.push({
                    type: 'warning',
                    icon: 'alert-circle',
                    title: 'Carico di lavoro elevato',
                    text: `Hai ${todayEvents.length} eventi oggi. Considera di riprogrammare alcuni impegni.`,
                    color: 'var(--status-warning)'
                });
            }

            // Check upcoming high-priority events
            const upcomingHighPriority = events.filter(e => {
                const eventDate = new Date(e.date);
                const diff = eventDate - today;
                return diff > 0 && diff <= 48 * 60 * 60 * 1000 && e.priority === 'high';
            });

            if (upcomingHighPriority.length > 0) {
                const nextEvent = upcomingHighPriority[0];
                insights.push({
                    type: 'info',
                    icon: 'clock',
                    title: 'Evento importante in arrivo',
                    text: `"${nextEvent.title}" - Assicurati di essere preparato.`,
                    color: 'var(--primary-600)'
                });
            }

            // Productivity insight
            const morningEvents = events.filter(e => {
                if (!e.startTime) return false;
                const hour = parseInt(e.startTime.split(':')[0]);
                return hour >= 9 && hour <= 11;
            });

            if (morningEvents.length < events.length * 0.3) {
                insights.push({
                    type: 'success',
                    icon: 'trending-up',
                    title: 'Suggerimento produttività',
                    text: 'Le ore 9-11 sono ideali per attività importanti. Programma i tuoi compiti principali in questo orario.',
                    color: 'var(--status-success)'
                });
            }

            // Check for conflicts
            const conflicts = this.detectConflicts(events);
            if (conflicts.length > 0) {
                insights.push({
                    type: 'error',
                    icon: 'alert-triangle',
                    title: 'Conflitto di orari',
                    text: `Trovati ${conflicts.length} sovrapposizioni negli orari. Controlla il calendario.`,
                    color: 'var(--status-error)'
                });
            }

            // Balance check
            const workEvents = events.filter(e => e.category !== 'personal').length;
            const personalEvents = events.filter(e => e.category === 'personal').length;
            const ratio = personalEvents / (workEvents + personalEvents);

            if (ratio < 0.1 && events.length > 5) {
                insights.push({
                    type: 'info',
                    icon: 'heart',
                    title: 'Work-Life Balance',
                    text: 'Considera di aggiungere tempo per te stesso. Un buon equilibrio migliora la produttività.',
                    color: 'var(--accent-purple)'
                });
            }

            return insights.slice(0, 4); // Return max 4 insights
        },

        detectConflicts(events) {
            const conflicts = [];
            for (let i = 0; i < events.length; i++) {
                for (let j = i + 1; j < events.length; j++) {
                    if (this.eventsOverlap(events[i], events[j])) {
                        conflicts.push([events[i], events[j]]);
                    }
                }
            }
            return conflicts;
        },

        eventsOverlap(event1, event2) {
            if (!this.isSameDay(event1.date, event2.date)) return false;
            if (!event1.startTime || !event2.startTime) return false;

            const start1 = this.timeToMinutes(event1.startTime);
            const end1 = this.timeToMinutes(event1.endTime || event1.startTime);
            const start2 = this.timeToMinutes(event2.startTime);
            const end2 = this.timeToMinutes(event2.endTime || event2.startTime);

            return (start1 < end2 && end1 > start2);
        },

        timeToMinutes(timeStr) {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        },

        isSameDay(date1, date2) {
            const d1 = new Date(date1);
            const d2 = new Date(date2);
            return d1.getFullYear() === d2.getFullYear() &&
                   d1.getMonth() === d2.getMonth() &&
                   d1.getDate() === d2.getDate();
        }
    };

    // ==========================================
    // CALENDAR RENDERER
    // ==========================================

    const CalendarRenderer = {
        render() {
            const calendarDays = document.getElementById('calendarDays');
            if (!calendarDays) return;

            const year = AgendaState.currentDate.getFullYear();
            const month = AgendaState.currentDate.getMonth();

            // Get first day of month and number of days
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const numDays = lastDay.getDate();

            // Get day of week for first day (0 = Sunday, adjust to Monday = 0)
            let startDay = firstDay.getDay() - 1;
            if (startDay === -1) startDay = 6;

            // Get previous month's last day
            const prevMonthLastDay = new Date(year, month, 0).getDate();

            let html = '';

            // Previous month days
            for (let i = startDay - 1; i >= 0; i--) {
                const day = prevMonthLastDay - i;
                html += `<div class="calendar-day other-month">${day}</div>`;
            }

            // Current month days
            const today = new Date();
            for (let day = 1; day <= numDays; day++) {
                const date = new Date(year, month, day);
                const isToday = this.isSameDay(date, today);
                const isSelected = this.isSameDay(date, AgendaState.selectedDate);
                const hasEvents = this.hasEventsOnDate(date);

                let classes = 'calendar-day';
                if (isToday) classes += ' today';
                if (isSelected) classes += ' selected';
                if (hasEvents) classes += ' has-events';

                html += `<div class="${classes}" data-date="${date.toISOString()}">${day}</div>`;
            }

            // Next month days
            const remainingCells = 42 - (startDay + numDays);
            for (let day = 1; day <= remainingCells; day++) {
                html += `<div class="calendar-day other-month">${day}</div>`;
            }

            calendarDays.innerHTML = html;

            // Add click handlers
            calendarDays.querySelectorAll('.calendar-day:not(.other-month)').forEach(dayEl => {
                dayEl.addEventListener('click', () => {
                    const dateStr = dayEl.dataset.date;
                    if (dateStr) {
                        AgendaState.selectedDate = new Date(dateStr);
                        this.render();
                        EventsRenderer.render();
                    }
                });
            });
        },

        isSameDay(date1, date2) {
            return date1.getFullYear() === date2.getFullYear() &&
                   date1.getMonth() === date2.getMonth() &&
                   date1.getDate() === date2.getDate();
        },

        hasEventsOnDate(date) {
            return AgendaState.events.some(event =>
                this.isSameDay(new Date(event.date), date)
            );
        }
    };

    // ==========================================
    // EVENTS RENDERER
    // ==========================================

    const EventsRenderer = {
        render() {
            const eventsList = document.getElementById('eventsList');
            if (!eventsList) return;

            // Filter events based on current filter
            let filteredEvents = AgendaState.events;
            if (AgendaState.currentFilter !== 'all') {
                filteredEvents = filteredEvents.filter(e => e.category === AgendaState.currentFilter);
            }

            // Sort events by date and time
            filteredEvents.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                if (dateA.getTime() !== dateB.getTime()) {
                    return dateA - dateB;
                }
                if (a.startTime && b.startTime) {
                    return a.startTime.localeCompare(b.startTime);
                }
                return 0;
            });

            if (filteredEvents.length === 0) {
                eventsList.innerHTML = `
                    <div class="empty-state">
                        <i data-lucide="calendar-x"></i>
                        <h3>Nessun evento trovato</h3>
                        <p>Crea il tuo primo evento per iniziare</p>
                        <button class="btn btn-primary" onclick="document.getElementById('newEventBtn').click()">
                            <i data-lucide="plus"></i>
                            Nuovo Evento
                        </button>
                    </div>
                `;
                lucide.createIcons();
                return;
            }

            const html = filteredEvents.map(event => this.renderEventCard(event)).join('');
            eventsList.innerHTML = html;
            lucide.createIcons();

            // Add event listeners
            filteredEvents.forEach(event => {
                const card = eventsList.querySelector(`[data-event-id="${event.id}"]`);
                if (card) {
                    card.addEventListener('click', (e) => {
                        if (!e.target.closest('.event-action-btn')) {
                            this.showEventDetails(event);
                        }
                    });

                    const editBtn = card.querySelector('.edit-event-btn');
                    const deleteBtn = card.querySelector('.delete-event-btn');

                    if (editBtn) {
                        editBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            EventModal.open(event);
                        });
                    }

                    if (deleteBtn) {
                        deleteBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.deleteEvent(event.id);
                        });
                    }
                }
            });
        },

        renderEventCard(event) {
            const date = new Date(event.date);
            const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
            const categoryLabels = {
                meeting: 'Riunione',
                deadline: 'Scadenza',
                task: 'Attività',
                personal: 'Personale'
            };

            return `
                <div class="event-card ${event.category}" data-event-id="${event.id}">
                    <div class="event-time">
                        <div class="event-month">${monthNames[date.getMonth()]}</div>
                        <div class="event-day">${date.getDate()}</div>
                    </div>
                    <div class="event-details">
                        <div class="event-header">
                            <div>
                                <div class="event-title">
                                    <span class="priority-indicator ${event.priority}"></span>
                                    ${this.escapeHtml(event.title)}
                                </div>
                                <span class="event-category">${categoryLabels[event.category]}</span>
                            </div>
                            <div class="event-actions">
                                <button class="event-action-btn edit-event-btn" title="Modifica">
                                    <i data-lucide="edit"></i>
                                </button>
                                <button class="event-action-btn delete-event-btn" title="Elimina">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            </div>
                        </div>
                        <div class="event-meta">
                            ${event.startTime ? `
                                <div class="event-meta-item">
                                    <i data-lucide="clock"></i>
                                    <span>${event.startTime}${event.endTime ? ' - ' + event.endTime : ''}</span>
                                </div>
                            ` : ''}
                            ${event.location ? `
                                <div class="event-meta-item">
                                    <i data-lucide="map-pin"></i>
                                    <span>${this.escapeHtml(event.location)}</span>
                                </div>
                            ` : ''}
                        </div>
                        ${event.description ? `
                            <div class="event-description">${this.escapeHtml(event.description)}</div>
                        ` : ''}
                    </div>
                </div>
            `;
        },

        showEventDetails(event) {
            // Could open a detailed view modal here
            console.log('Show event details:', event);
        },

        deleteEvent(eventId) {
            if (confirm('Sei sicuro di voler eliminare questo evento?')) {
                EventStorage.deleteEvent(eventId);
                AgendaState.events = EventStorage.loadEvents();
                this.render();
                CalendarRenderer.render();
                StatsRenderer.render();
                InsightsRenderer.render();
                if (window.UI && window.UI.showToast) {
                    window.UI.showToast('Evento eliminato con successo', 'success');
                }
            }
        },

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    // ==========================================
    // STATS RENDERER
    // ==========================================

    const StatsRenderer = {
        render() {
            const todayEventsCount = document.getElementById('todayEventsCount');
            const plannedHours = document.getElementById('plannedHours');

            if (todayEventsCount) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const count = AgendaState.events.filter(e => {
                    const eventDate = new Date(e.date);
                    eventDate.setHours(0, 0, 0, 0);
                    return eventDate.getTime() === today.getTime();
                }).length;
                todayEventsCount.textContent = count;
            }

            if (plannedHours) {
                const totalMinutes = AgendaState.events.reduce((sum, event) => {
                    if (event.startTime && event.endTime) {
                        const start = this.timeToMinutes(event.startTime);
                        const end = this.timeToMinutes(event.endTime);
                        return sum + (end - start);
                    }
                    return sum;
                }, 0);
                const hours = Math.round(totalMinutes / 60);
                plannedHours.textContent = `${hours}h`;
            }
        },

        timeToMinutes(timeStr) {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        }
    };

    // ==========================================
    // INSIGHTS RENDERER
    // ==========================================

    const InsightsRenderer = {
        render() {
            const insightsList = document.getElementById('aiInsightsList');
            if (!insightsList) return;

            const insights = AIInsights.generateInsights(AgendaState.events);

            if (insights.length === 0) {
                insightsList.innerHTML = `
                    <div class="insight-item">
                        <i data-lucide="check-circle" style="color: var(--status-success);"></i>
                        <div>
                            <p class="insight-title">Tutto a posto!</p>
                            <p class="insight-text">Non ci sono suggerimenti al momento. Continua così!</p>
                        </div>
                    </div>
                `;
            } else {
                const html = insights.map(insight => `
                    <div class="insight-item">
                        <i data-lucide="${insight.icon}" style="color: ${insight.color};"></i>
                        <div>
                            <p class="insight-title">${insight.title}</p>
                            <p class="insight-text">${insight.text}</p>
                        </div>
                    </div>
                `).join('');
                insightsList.innerHTML = html;
            }

            lucide.createIcons();
        }
    };

    // ==========================================
    // EVENT MODAL
    // ==========================================

    const EventModal = {
        currentEvent: null,

        init() {
            const modal = document.getElementById('eventModal');
            const closeBtn = document.getElementById('closeModal');
            const cancelBtn = document.getElementById('cancelEventBtn');
            const form = document.getElementById('eventForm');

            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.close());
            }

            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => this.close());
            }

            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.close();
                    }
                });
            }

            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.save();
                });
            }

            // Handle all-day checkbox
            const allDayCheckbox = document.getElementById('eventAllDay');
            const startTimeInput = document.getElementById('eventStartTime');
            const endTimeInput = document.getElementById('eventEndTime');

            if (allDayCheckbox) {
                allDayCheckbox.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        startTimeInput.disabled = true;
                        endTimeInput.disabled = true;
                        startTimeInput.value = '';
                        endTimeInput.value = '';
                    } else {
                        startTimeInput.disabled = false;
                        endTimeInput.disabled = false;
                    }
                });
            }
        },

        open(event = null) {
            this.currentEvent = event;
            const modal = document.getElementById('eventModal');
            const modalTitle = document.getElementById('modalTitle');
            const form = document.getElementById('eventForm');

            if (event) {
                modalTitle.textContent = 'Modifica Evento';
                this.fillForm(event);
            } else {
                modalTitle.textContent = 'Nuovo Evento';
                form.reset();
                // Set default date to selected date
                const dateInput = document.getElementById('eventDate');
                if (dateInput) {
                    const date = AgendaState.selectedDate;
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    dateInput.value = `${year}-${month}-${day}`;
                }
            }

            modal.classList.add('active');
        },

        close() {
            const modal = document.getElementById('eventModal');
            modal.classList.remove('active');
            this.currentEvent = null;
        },

        fillForm(event) {
            document.getElementById('eventTitle').value = event.title || '';

            const date = new Date(event.date);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            document.getElementById('eventDate').value = `${year}-${month}-${day}`;

            document.getElementById('eventCategory').value = event.category || '';
            document.getElementById('eventStartTime').value = event.startTime || '';
            document.getElementById('eventEndTime').value = event.endTime || '';
            document.getElementById('eventPriority').value = event.priority || 'medium';
            document.getElementById('eventReminder').value = event.reminder || '30';
            document.getElementById('eventLocation').value = event.location || '';
            document.getElementById('eventDescription').value = event.description || '';
            document.getElementById('eventAllDay').checked = event.allDay || false;

            if (event.allDay) {
                document.getElementById('eventStartTime').disabled = true;
                document.getElementById('eventEndTime').disabled = true;
            }
        },

        save() {
            const formData = new FormData(document.getElementById('eventForm'));

            const eventData = {
                title: formData.get('title'),
                date: new Date(formData.get('date')),
                category: formData.get('category'),
                startTime: formData.get('startTime') || null,
                endTime: formData.get('endTime') || null,
                priority: formData.get('priority') || 'medium',
                reminder: parseInt(formData.get('reminder')) || 0,
                location: formData.get('location') || '',
                description: formData.get('description') || '',
                allDay: formData.get('allDay') === 'on'
            };

            // Validation
            if (!eventData.title || !eventData.category) {
                if (window.UI && window.UI.showToast) {
                    window.UI.showToast('Compila tutti i campi obbligatori', 'error');
                } else {
                    alert('Compila tutti i campi obbligatori');
                }
                return;
            }

            if (this.currentEvent) {
                // Update existing event
                EventStorage.updateEvent(this.currentEvent.id, eventData);
                if (window.UI && window.UI.showToast) {
                    window.UI.showToast('Evento aggiornato con successo', 'success');
                }
            } else {
                // Add new event
                EventStorage.addEvent(eventData);
                if (window.UI && window.UI.showToast) {
                    window.UI.showToast('Evento creato con successo', 'success');
                }
            }

            // Reload events and re-render
            AgendaState.events = EventStorage.loadEvents();
            EventsRenderer.render();
            CalendarRenderer.render();
            StatsRenderer.render();
            InsightsRenderer.render();

            this.close();
        }
    };

    // ==========================================
    // NAVIGATION HANDLERS
    // ==========================================

    const NavigationHandlers = {
        init() {
            // Period navigation
            const prevBtn = document.getElementById('prevPeriod');
            const nextBtn = document.getElementById('nextPeriod');
            const todayBtn = document.getElementById('todayBtn');

            if (prevBtn) {
                prevBtn.addEventListener('click', () => this.navigatePeriod(-1));
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', () => this.navigatePeriod(1));
            }

            if (todayBtn) {
                todayBtn.addEventListener('click', () => {
                    AgendaState.currentDate = new Date();
                    AgendaState.selectedDate = new Date();
                    this.updatePeriodDisplay();
                    CalendarRenderer.render();
                    EventsRenderer.render();
                });
            }

            // View selector
            const viewBtns = document.querySelectorAll('.view-btn');
            viewBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const view = btn.dataset.view;
                    this.changeView(view);
                });
            });

            // Category filter
            const categoryFilter = document.getElementById('categoryFilter');
            if (categoryFilter) {
                categoryFilter.addEventListener('change', (e) => {
                    AgendaState.currentFilter = e.target.value;
                    EventsRenderer.render();
                });
            }

            // Search
            const searchInput = document.getElementById('searchEvents');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.searchEvents(e.target.value);
                });
            }

            // New event button
            const newEventBtn = document.getElementById('newEventBtn');
            if (newEventBtn) {
                newEventBtn.addEventListener('click', () => {
                    EventModal.open();
                });
            }

            // AI Suggest button
            const aiSuggestBtn = document.getElementById('aiSuggestBtn');
            if (aiSuggestBtn) {
                aiSuggestBtn.addEventListener('click', () => {
                    this.showAISuggestions();
                });
            }
        },

        navigatePeriod(direction) {
            const currentDate = AgendaState.currentDate;

            if (AgendaState.currentView === 'month') {
                currentDate.setMonth(currentDate.getMonth() + direction);
            } else if (AgendaState.currentView === 'week') {
                currentDate.setDate(currentDate.getDate() + (7 * direction));
            } else if (AgendaState.currentView === 'day') {
                currentDate.setDate(currentDate.getDate() + direction);
            }

            this.updatePeriodDisplay();
            CalendarRenderer.render();
        },

        updatePeriodDisplay() {
            const periodDisplay = document.getElementById('currentPeriod');
            if (!periodDisplay) return;

            const date = AgendaState.currentDate;
            const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
                              'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

            if (AgendaState.currentView === 'month') {
                periodDisplay.textContent = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
            } else if (AgendaState.currentView === 'week') {
                periodDisplay.textContent = `Settimana ${this.getWeekNumber(date)}`;
            } else if (AgendaState.currentView === 'day') {
                periodDisplay.textContent = `${date.getDate()} ${monthNames[date.getMonth()]}`;
            }
        },

        changeView(view) {
            AgendaState.currentView = view;

            // Update active button
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.view === view) {
                    btn.classList.add('active');
                }
            });

            this.updatePeriodDisplay();
            // Could implement different view layouts here
        },

        searchEvents(query) {
            const eventsList = document.getElementById('eventsList');
            if (!eventsList) return;

            const lowerQuery = query.toLowerCase();
            const filtered = AgendaState.events.filter(event => {
                return event.title.toLowerCase().includes(lowerQuery) ||
                       (event.description && event.description.toLowerCase().includes(lowerQuery)) ||
                       (event.location && event.location.toLowerCase().includes(lowerQuery));
            });

            // Temporarily replace events for rendering
            const originalEvents = AgendaState.events;
            AgendaState.events = filtered;
            EventsRenderer.render();
            AgendaState.events = originalEvents;
        },

        showAISuggestions() {
            const insights = AIInsights.generateInsights(AgendaState.events);
            let message = 'Suggerimenti AI:\n\n';

            if (insights.length === 0) {
                message += 'Al momento non ci sono suggerimenti. Il tuo calendario sembra ben organizzato!';
            } else {
                insights.forEach((insight, index) => {
                    message += `${index + 1}. ${insight.title}\n${insight.text}\n\n`;
                });
            }

            alert(message);
        },

        getWeekNumber(date) {
            const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        }
    };

    // ==========================================
    // INITIALIZATION
    // ==========================================

    function init() {
        // Load events
        AgendaState.events = EventStorage.loadEvents();

        // Initialize all components
        EventModal.init();
        NavigationHandlers.init();

        // Initial render
        NavigationHandlers.updatePeriodDisplay();
        CalendarRenderer.render();
        EventsRenderer.render();
        StatsRenderer.render();
        InsightsRenderer.render();

        console.log('📅 Agenda Aziendale Intelligente initialized');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export for debugging
    window.AgendaApp = {
        state: AgendaState,
        storage: EventStorage,
        insights: AIInsights,
        modal: EventModal
    };

})();
