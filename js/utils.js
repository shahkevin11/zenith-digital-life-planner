/**
 * ZENITH DIGITAL PLANNER - Utility Functions
 * Helper functions for dates, formatting, and common operations
 */

const Utils = {
    // ============================================
    // DATE UTILITIES
    // ============================================

    /**
     * Get today's date as YYYY-MM-DD string
     * @returns {string} Date string
     */
    getTodayStr() {
        return new Date().toISOString().split('T')[0];
    },

    /**
     * Format date as YYYY-MM-DD
     * @param {Date} date - Date object
     * @returns {string} Formatted date string
     */
    formatDateStr(date) {
        return date.toISOString().split('T')[0];
    },

    /**
     * Format date for display (e.g., "Monday, January 12, 2026")
     * @param {Date|string} date - Date object or string
     * @returns {string} Formatted date
     */
    formatDateDisplay(date) {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    /**
     * Format date for short display (e.g., "Jan 12")
     * @param {Date|string} date - Date object or string
     * @returns {string} Formatted date
     */
    formatDateShort(date) {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    },

    /**
     * Format month and year (e.g., "January 2026")
     * @param {Date} date - Date object
     * @returns {string} Formatted month/year
     */
    formatMonthYear(date) {
        return date.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });
    },

    /**
     * Get week range display (e.g., "Jan 6 - Jan 12, 2026")
     * @param {Date} startDate - Week start date
     * @returns {string} Formatted week range
     */
    formatWeekRange(startDate) {
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        
        const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
        const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
        const year = endDate.getFullYear();
        
        if (startMonth === endMonth) {
            return `${startMonth} ${startDate.getDate()} - ${endDate.getDate()}, ${year}`;
        }
        return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}, ${year}`;
    },

    /**
     * Get day name (e.g., "Mon")
     * @param {Date|string} date - Date object or string
     * @returns {string} Day name
     */
    getDayName(date) {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('en-US', { weekday: 'short' });
    },

    /**
     * Check if date is today
     * @param {Date|string} date - Date to check
     * @returns {boolean}
     */
    isToday(date) {
        const d = typeof date === 'string' ? new Date(date) : date;
        const today = new Date();
        return d.toDateString() === today.toDateString();
    },

    /**
     * Get start of week (Monday)
     * @param {Date} date - Date to get week for
     * @returns {Date} Monday of that week
     */
    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    },

    /**
     * Get array of dates for a week
     * @param {Date} weekStart - Start of week
     * @returns {Array<Date>} Array of 7 dates
     */
    getWeekDates(weekStart) {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);
            dates.push(date);
        }
        return dates;
    },

    /**
     * Get calendar days for a month view
     * @param {number} year - Year
     * @param {number} month - Month (0-11)
     * @returns {Array} Array of day objects
     */
    getCalendarDays(year, month) {
        const days = [];
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // Get starting day (adjust for Monday start)
        let startDay = firstDay.getDay() - 1;
        if (startDay === -1) startDay = 6;
        
        // Add days from previous month
        for (let i = startDay - 1; i >= 0; i--) {
            const date = new Date(year, month, -i);
            days.push({
                date,
                dateStr: this.formatDateStr(date),
                dayNum: date.getDate(),
                isOtherMonth: true,
                isToday: false
            });
        }
        
        // Add days of current month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const date = new Date(year, month, i);
            days.push({
                date,
                dateStr: this.formatDateStr(date),
                dayNum: i,
                isOtherMonth: false,
                isToday: this.isToday(date)
            });
        }
        
        // Add days from next month to complete grid
        const remaining = 42 - days.length; // 6 rows × 7 days
        for (let i = 1; i <= remaining; i++) {
            const date = new Date(year, month + 1, i);
            days.push({
                date,
                dateStr: this.formatDateStr(date),
                dayNum: i,
                isOtherMonth: true,
                isToday: false
            });
        }
        
        return days;
    },

    /**
     * Get all days in a year
     * @param {number} year - Year
     * @returns {Array} Array of date objects
     */
    getYearDays(year) {
        const days = [];
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            days.push({
                date: new Date(currentDate),
                dateStr: this.formatDateStr(currentDate),
                week: this.getWeekNumber(currentDate),
                dayOfWeek: currentDate.getDay()
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return days;
    },

    /**
     * Get ISO week number
     * @param {Date} date - Date
     * @returns {number} Week number
     */
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    },

    // ============================================
    // TIME UTILITIES
    // ============================================

    /**
     * Get greeting based on time of day
     * @returns {string} Greeting message
     */
    getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    },

    /**
     * Format time (e.g., "9:00 AM")
     * @param {string} time24 - Time in 24h format (HH:MM)
     * @returns {string} Formatted time
     */
    formatTime(time24) {
        const [hours, minutes] = time24.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    },

    /**
     * Format duration in minutes to human readable
     * @param {number} minutes - Duration in minutes
     * @returns {string} Formatted duration
     */
    formatDuration(minutes) {
        if (minutes < 60) {
            return `${minutes}m`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    },

    /**
     * Format timer display (MM:SS)
     * @param {number} seconds - Total seconds
     * @returns {string} Formatted time
     */
    formatTimer(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    // ============================================
    // DOM UTILITIES
    // ============================================

    /**
     * Create element with attributes and children
     * @param {string} tag - Element tag
     * @param {Object} attrs - Attributes
     * @param {Array|string} children - Child elements or text
     * @returns {HTMLElement}
     */
    createElement(tag, attrs = {}, children = []) {
        const el = document.createElement(tag);
        
        Object.entries(attrs).forEach(([key, value]) => {
            if (key === 'className') {
                el.className = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    el.dataset[dataKey] = dataValue;
                });
            } else if (key.startsWith('on')) {
                el.addEventListener(key.slice(2).toLowerCase(), value);
            } else {
                el.setAttribute(key, value);
            }
        });
        
        if (typeof children === 'string') {
            el.textContent = children;
        } else if (Array.isArray(children)) {
            children.forEach(child => {
                if (typeof child === 'string') {
                    el.appendChild(document.createTextNode(child));
                } else if (child instanceof HTMLElement) {
                    el.appendChild(child);
                }
            });
        }
        
        return el;
    },

    /**
     * Shorthand for querySelector
     * @param {string} selector - CSS selector
     * @param {HTMLElement} context - Context element
     * @returns {HTMLElement|null}
     */
    $(selector, context = document) {
        return context.querySelector(selector);
    },

    /**
     * Shorthand for querySelectorAll
     * @param {string} selector - CSS selector
     * @param {HTMLElement} context - Context element
     * @returns {NodeList}
     */
    $$(selector, context = document) {
        return context.querySelectorAll(selector);
    },

    // ============================================
    // TOAST NOTIFICATIONS
    // ============================================

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Toast type (success, error, warning, info)
     * @param {number} duration - Duration in ms
     */
    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        
        const toast = this.createElement('div', { className: `toast ${type}` }, [
            this.createElement('span', { className: 'toast-message' }, message),
            this.createElement('button', { 
                className: 'toast-close',
                onClick: () => toast.remove()
            }, '×')
        ]);
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    // ============================================
    // MODAL UTILITIES
    // ============================================

    /**
     * Show a modal
     * @param {string} modalId - Modal element ID
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    },

    /**
     * Hide a modal
     * @param {string} modalId - Modal element ID
     */
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    },

    // ============================================
    // VALIDATION UTILITIES
    // ============================================

    /**
     * Check if string is empty or whitespace
     * @param {string} str - String to check
     * @returns {boolean}
     */
    isEmpty(str) {
        return !str || str.trim().length === 0;
    },

    /**
     * Sanitize HTML to prevent XSS
     * @param {string} str - String to sanitize
     * @returns {string} Sanitized string
     */
    sanitize(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    // ============================================
    // CALCULATION UTILITIES
    // ============================================

    /**
     * Calculate capacity percentage
     * @param {number} planned - Planned minutes
     * @param {number} capacity - Total capacity in hours
     * @returns {number} Percentage (0-100+)
     */
    calculateCapacityPercent(planned, capacity) {
        const capacityMinutes = capacity * 60;
        return Math.round((planned / capacityMinutes) * 100);
    },

    /**
     * Get capacity status class
     * @param {number} percent - Capacity percentage
     * @returns {string} Status class
     */
    getCapacityStatus(percent) {
        if (percent <= 80) return '';
        if (percent <= 100) return 'warning';
        return 'danger';
    },

    // ============================================
    // CHART UTILITIES
    // ============================================

    /**
     * Generate simple bar chart data
     * @param {Array} data - Array of values
     * @param {number} maxHeight - Maximum bar height in pixels
     * @returns {Array} Array of heights
     */
    generateBarHeights(data, maxHeight = 150) {
        const max = Math.max(...data, 1);
        return data.map(value => Math.round((value / max) * maxHeight));
    },

    // ============================================
    // CATEGORY ICONS
    // ============================================

    /**
     * Get category emoji
     * @param {string} category - Category name
     * @returns {string} Emoji
     */
    getCategoryIcon(category) {
        const icons = {
            work: '💼',
            personal: '🏠',
            health: '💪',
            learning: '📚',
            default: '📌'
        };
        return icons[category] || icons.default;
    },

    // ============================================
    // DEBOUNCE / THROTTLE
    // ============================================

    /**
     * Debounce function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} Debounced function
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in ms
     * @returns {Function} Throttled function
     */
    throttle(func, limit = 300) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // ============================================
    // KEYBOARD SHORTCUTS
    // ============================================

    /**
     * Register keyboard shortcut
     * @param {string} key - Key to listen for
     * @param {Function} callback - Callback function
     * @param {Object} options - Options (ctrl, shift, alt)
     */
    registerShortcut(key, callback, options = {}) {
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === key.toLowerCase()) {
                if (options.ctrl && !e.ctrlKey && !e.metaKey) return;
                if (options.shift && !e.shiftKey) return;
                if (options.alt && !e.altKey) return;
                
                // Don't trigger if typing in input
                if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
                
                e.preventDefault();
                callback(e);
            }
        });
    }
};

// Export for use in other modules
window.Utils = Utils;
