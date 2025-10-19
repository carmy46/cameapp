// UI Utilities Module
class UI {
  constructor() {
    this.toastContainer = null;
    this.activeModals = [];
    this.init();
  }

  init() {
    this.createToastContainer();
    this.setupEventListeners();
    this.initializeRippleEffect();
  }

  // Create toast container
  createToastContainer() {
    this.toastContainer = document.createElement('div');
    this.toastContainer.className = 'toast-container';
    document.body.appendChild(this.toastContainer);
  }

  // Show toast notification
  showToast(message, type = 'info', duration = 4000, title = null) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconMap = {
      success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
      error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
      warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="m12 17 .01 0"/></svg>',
      info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"/></svg>'
    };

    toast.innerHTML = `
      <div class="toast-icon">${iconMap[type] || iconMap.info}</div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Chiudi notifica">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <div class="toast-progress"></div>
    `;

    // Add event listeners
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.removeToast(toast));

    // Add to container
    this.toastContainer.appendChild(toast);

    // Trigger show animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto remove
    const removeTimeout = setTimeout(() => this.removeToast(toast), duration);

    // Store timeout for manual removal
    toast._removeTimeout = removeTimeout;

    return toast;
  }

  // Remove toast
  removeToast(toast) {
    if (toast._removeTimeout) {
      clearTimeout(toast._removeTimeout);
    }

    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  // Show modal
  showModal(modalId, options = {}) {
    const modal = document.getElementById(modalId);
    if (!modal) return null;

    const backdrop = modal.querySelector('.modal-backdrop') || modal;

    // Add to active modals array
    this.activeModals.push(modalId);

    // Show modal
    backdrop.classList.add('active');

    // Focus trap
    this.trapFocus(modal);

    // Close on escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        this.hideModal(modalId);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Close on backdrop click
    if (options.closeOnBackdrop !== false) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          this.hideModal(modalId);
        }
      });
    }

    return modal;
  }

  // Hide modal
  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const backdrop = modal.querySelector('.modal-backdrop') || modal;
    backdrop.classList.remove('active');

    // Remove from active modals
    this.activeModals = this.activeModals.filter(id => id !== modalId);

    // Restore focus to previous element
    this.restoreFocus();
  }

  // Create dynamic modal
  createModal(title, content, actions = [], options = {}) {
    const modalId = 'dynamic-modal-' + Date.now();

    const modalHTML = `
      <div id="${modalId}" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="${modalId}-title">
        <div class="modal">
          <div class="modal-header">
            <h3 id="${modalId}-title" class="modal-title">${title}</h3>
            <button class="modal-close" onclick="UI.hideModal('${modalId}')" aria-label="Chiudi finestra">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="modal-body">${content}</div>
          ${actions.length > 0 ? `
            <div class="modal-footer">
              ${actions.map(action => `
                <button class="btn ${action.class || 'btn-outline'}" onclick="${action.onclick || ''}">${action.text}</button>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    setTimeout(() => {
      this.showModal(modalId, options);
    }, 10);

    return modalId;
  }

  // Confirm dialog
  confirm(message, title = 'Conferma', options = {}) {
    return new Promise((resolve) => {
      // Generate modalId before using it
      const modalId = 'dynamic-modal-' + Date.now();

      this._confirmResolver = resolve;

      // Create the modal HTML with the generated modalId
      const modalHTML = `
        <div id="${modalId}" class="modal-backdrop">
          <div class="modal">
            <div class="modal-header">
              <h3 class="modal-title">${title}</h3>
              <button class="modal-close" onclick="window.UI.hideModal('${modalId}')">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <p>${message}</p>
            </div>
            <div class="modal-footer">
              <button class="btn ${options.cancelClass || 'btn-outline'}" onclick="window.UI.hideModal('${modalId}'); window.UI._resolveConfirm(false);">
                ${options.cancelText || 'Annulla'}
              </button>
              <button class="btn ${options.confirmClass || 'btn-primary'}" onclick="window.UI.hideModal('${modalId}'); window.UI._resolveConfirm(true);">
                ${options.confirmText || 'Conferma'}
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHTML);

      setTimeout(() => {
        this.showModal(modalId, options);
      }, 10);

      // Auto-reject if modal is closed without action
      setTimeout(() => {
        const modal = document.getElementById(modalId);
        if (modal) {
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const backdrop = modal.querySelector('.modal-backdrop') || modal;
                if (!backdrop.classList.contains('active') && this._confirmResolver) {
                  resolve(false);
                  this._confirmResolver = null;
                  observer.disconnect();
                  setTimeout(() => modal.remove(), 300);
                }
              }
            });
          });
          observer.observe(modal, { attributes: true });
        }
      }, 100);
    });
  }

  _resolveConfirm(result) {
    if (this._confirmResolver) {
      this._confirmResolver(result);
      this._confirmResolver = null;
    }
  }

  // Loading state management
  showLoading(element, text = 'Caricamento...') {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }

    if (!element) return;

    element.dataset.originalContent = element.innerHTML;
    element.disabled = true;
    element.classList.add('btn-loading');

    if (element.tagName === 'BUTTON') {
      element.innerHTML = `
        <span class="spinner spinner-sm"></span>
        ${text}
      `;
    }
  }

  // Show skeleton loading for tables
  showTableSkeleton(tableBody, rows = 5, columns = 6) {
    if (typeof tableBody === 'string') {
      tableBody = document.querySelector(tableBody);
    }

    if (!tableBody) return;

    const skeletonRows = Array.from({ length: rows }, () => `
      <tr>
        ${Array.from({ length: columns }, () => `
          <td><div class="skeleton skeleton-text"></div></td>
        `).join('')}
      </tr>
    `).join('');

    tableBody.innerHTML = skeletonRows;
  }

  // Show skeleton loading for cards
  showCardSkeleton(container, count = 3) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }

    if (!container) return;

    const skeletonCards = Array.from({ length: count }, () => `
      <div class="card">
        <div class="skeleton skeleton-card"></div>
      </div>
    `).join('');

    container.innerHTML = skeletonCards;
  }

  hideLoading(element) {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }

    if (!element) return;

    element.disabled = false;
    element.classList.remove('btn-loading');

    if (element.dataset.originalContent) {
      element.innerHTML = element.dataset.originalContent;
      delete element.dataset.originalContent;
    }
  }

  // Dropdown management
  toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;

    const isActive = dropdown.classList.contains('active');

    // Close all other dropdowns
    document.querySelectorAll('.dropdown.active').forEach(d => {
      if (d !== dropdown) {
        d.classList.remove('active');
      }
    });

    // Toggle current dropdown
    dropdown.classList.toggle('active', !isActive);

    if (!isActive) {
      // Close on outside click
      const closeHandler = (e) => {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove('active');
          document.removeEventListener('click', closeHandler);
        }
      };
      setTimeout(() => document.addEventListener('click', closeHandler), 10);
    }
  }

  // Sidebar management
  toggleSidebar() {
    const appLayout = document.querySelector('.app-layout');
    if (!appLayout) return;

    const isCollapsed = appLayout.classList.contains('sidebar-collapsed');

    if (window.innerWidth > 1024) {
      // Desktop: toggle collapsed state
      appLayout.classList.toggle('sidebar-collapsed', !isCollapsed);
      localStorage.setItem('came_sidebar_collapsed', !isCollapsed);
    } else {
      // Mobile: toggle open state
      appLayout.classList.toggle('sidebar-open');
    }
  }

  // Initialize sidebar state
  initializeSidebar() {
    const appLayout = document.querySelector('.app-layout');
    if (!appLayout) return;

    if (window.innerWidth > 1024) {
      const isCollapsed = localStorage.getItem('came_sidebar_collapsed') === 'true';
      appLayout.classList.toggle('sidebar-collapsed', isCollapsed);
    }
  }

  // Form validation
  validateForm(form, rules = {}) {
    const errors = {};
    let isValid = true;

    Object.keys(rules).forEach(fieldName => {
      const field = form.querySelector(`[name="${fieldName}"]`);
      const rule = rules[fieldName];

      if (!field) return;

      const value = field.value.trim();
      const inputGroup = field.closest('.input-group');

      // Remove previous error states
      inputGroup?.classList.remove('error', 'success');
      const existingError = inputGroup?.querySelector('.input-error');
      if (existingError) existingError.remove();

      // Required validation
      if (rule.required && !value) {
        errors[fieldName] = 'Questo campo è obbligatorio';
        isValid = false;
      }
      // Min length validation
      else if (rule.minLength && value.length < rule.minLength) {
        errors[fieldName] = `Minimo ${rule.minLength} caratteri richiesti`;
        isValid = false;
      }
      // Max length validation
      else if (rule.maxLength && value.length > rule.maxLength) {
        errors[fieldName] = `Massimo ${rule.maxLength} caratteri consentiti`;
        isValid = false;
      }
      // Pattern validation
      else if (rule.pattern && !rule.pattern.test(value)) {
        errors[fieldName] = rule.message || 'Formato non valido';
        isValid = false;
      }
      // Custom validation
      else if (rule.validate && !rule.validate(value)) {
        errors[fieldName] = rule.message || 'Valore non valido';
        isValid = false;
      }

      // Show error or success state
      if (errors[fieldName]) {
        inputGroup?.classList.add('error');
        if (inputGroup) {
          const errorSpan = document.createElement('span');
          errorSpan.className = 'input-error';
          errorSpan.textContent = errors[fieldName];
          inputGroup.appendChild(errorSpan);
        }
      } else if (value) {
        inputGroup?.classList.add('success');
      }
    });

    return { isValid, errors };
  }

  // Ripple effect for buttons
  initializeRippleEffect() {
    document.addEventListener('click', (e) => {
      const button = e.target.closest('.btn-ripple, .btn');
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      button.style.setProperty('--ripple-x', x + 'px');
      button.style.setProperty('--ripple-y', y + 'px');

      button.classList.remove('btn-ripple');
      void button.offsetWidth; // Trigger reflow
      button.classList.add('btn-ripple');
    });
  }

  // Focus management
  trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    this._previouslyFocusedElement = document.activeElement;

    firstElement?.focus();

    element.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    });
  }

  restoreFocus() {
    if (this._previouslyFocusedElement) {
      this._previouslyFocusedElement.focus();
      this._previouslyFocusedElement = null;
    }
  }

  // Setup global event listeners
  setupEventListeners() {
    // Handle responsive sidebar
    window.addEventListener('resize', () => {
      const appLayout = document.querySelector('.app-layout');
      if (appLayout && window.innerWidth > 1024) {
        appLayout.classList.remove('sidebar-open');
      }
    });

    // Handle modal backdrop clicks
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-backdrop')) {
        const modalId = e.target.id;
        if (modalId) {
          this.hideModal(modalId);
        }
      }
    });

    // Handle dropdown toggle clicks
    document.addEventListener('click', (e) => {
      const dropdownToggle = e.target.closest('[data-dropdown-toggle]');
      if (dropdownToggle) {
        e.preventDefault();
        const dropdownId = dropdownToggle.dataset.dropdownToggle;
        this.toggleDropdown(dropdownId);
      }
    });

    // Handle sidebar toggle
    document.addEventListener('click', (e) => {
      if (e.target.closest('.sidebar-toggle, [data-sidebar-toggle]')) {
        e.preventDefault();
        this.toggleSidebar();
      }
    });
  }

  // Utility methods
  formatDate(date, format = 'dd/mm/yyyy') {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return format
      .replace('dd', day)
      .replace('mm', month)
      .replace('yyyy', year)
      .replace('hh', hours)
      .replace('MM', minutes);
  }

  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Scroll reveal animation
  initScrollReveal() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale')
      .forEach(el => observer.observe(el));
  }

  // Initialize stagger animations
  initStaggerAnimations() {
    const staggerContainers = document.querySelectorAll('.stagger-children');

    staggerContainers.forEach(container => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate');
          }
        });
      }, { threshold: 0.1 });

      observer.observe(container);
    });
  }
}

// Initialize UI module
window.UI = new UI();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UI;
}