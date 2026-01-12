/**
 * ZENITH DIGITAL PLANNER - Main Application
 * Core application logic, event handling, and view management
 */

const App = {
    // Current state
    currentView: 'daily',
    currentDate: new Date(),
    currentWeek: null,
    currentMonth: null,
    focusTimer: null,
    focusTimeRemaining: 0,
    focusTaskId: null,

    // ============================================
    // INITIALIZATION
    // ============================================

    /**
     * Initialize the application
     */
    init() {
        // Initialize storage
        Storage.init();

        // Load theme
        this.loadTheme();

        // Check onboarding
        if (!Storage.hasCompletedOnboarding()) {
            this.showOnboarding();
        } else {
            this.loadUserData();
        }

        // Set current dates
        this.currentWeek = Utils.getWeekStart(new Date());
        this.currentMonth = new Date();

        // Initialize all views
        this.initDailyView();
        this.initWeeklyView();
        this.initMonthlyView();
        this.initYearlyView();
        this.initHabitsView();
        this.initGoalsView();
        this.initAnalyticsView();

        // Setup event listeners
        this.setupEventListeners();

        // Register keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Show daily view by default
        this.switchView('daily');
    },

    // ============================================
    // THEME MANAGEMENT
    // ============================================

    loadTheme() {
        const theme = Storage.getTheme();
        document.documentElement.setAttribute('data-theme', theme);
    },

    toggleTheme() {
        const current = Storage.getTheme();
        const newTheme = current === 'light' ? 'dark' : 'light';
        Storage.setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        Utils.showToast(`Switched to ${newTheme} mode`, 'info');
    },

    // ============================================
    // USER & ONBOARDING
    // ============================================

    showOnboarding() {
        Utils.showModal('onboarding-modal');
    },

    loadUserData() {
        const user = Storage.getUser();
        if (user) {
            document.getElementById('user-display-name').textContent = user.name;
            document.getElementById('user-avatar').textContent = user.name.charAt(0).toUpperCase();
        }
    },

    handleOnboarding() {
        const modal = document.getElementById('onboarding-modal');
        const steps = modal.querySelectorAll('.onboarding-step');
        const dots = modal.querySelectorAll('.step-dot');
        const backBtn = document.getElementById('onboarding-back');
        const nextBtn = document.getElementById('onboarding-next');
        
        let currentStep = 1;
        let userData = {
            name: '',
            workStart: '09:00',
            workEnd: '17:00',
            dailyCapacity: 5
        };

        const updateStep = () => {
            steps.forEach((step, i) => {
                step.classList.toggle('active', i === currentStep - 1);
            });
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentStep - 1);
            });
            backBtn.style.visibility = currentStep === 1 ? 'hidden' : 'visible';
            nextBtn.textContent = currentStep === 3 ? 'Get Started' : 'Continue';
        };

        nextBtn.addEventListener('click', () => {
            // Save step data
            if (currentStep === 1) {
                const name = document.getElementById('user-name-input').value.trim();
                if (!name) {
                    Utils.showToast('Please enter your name', 'warning');
                    return;
                }
                userData.name = name;
            } else if (currentStep === 2) {
                userData.workStart = document.getElementById('work-start').value;
                userData.workEnd = document.getElementById('work-end').value;
            }

            if (currentStep < 3) {
                currentStep++;
                updateStep();
            } else {
                // Save user data
                Storage.setUser({
                    ...userData,
                    onboardingComplete: true,
                    createdAt: new Date().toISOString()
                });
                Storage.setSettings({
                    workStart: userData.workStart,
                    workEnd: userData.workEnd,
                    dailyCapacity: userData.dailyCapacity
                });
                
                Utils.hideModal('onboarding-modal');
                this.loadUserData();
                Utils.showToast(`Welcome, ${userData.name}! Let's plan your day.`, 'success');
            }
        });

        backBtn.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                updateStep();
            }
        });

        // Capacity selector
        document.querySelectorAll('.capacity-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.capacity-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                userData.dailyCapacity = parseInt(btn.dataset.hours);
            });
        });
    },

    // ============================================
    // VIEW MANAGEMENT
    // ============================================

    switchView(viewName) {
        // Update nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewName);
        });

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.toggle('active', view.id === `${viewName}-view`);
        });

        this.currentView = viewName;

        // Refresh view data
        this.refreshCurrentView();
    },

    refreshCurrentView() {
        switch (this.currentView) {
            case 'daily':
                this.renderDailyView();
                break;
            case 'weekly':
                this.renderWeeklyView();
                break;
            case 'monthly':
                this.renderMonthlyView();
                break;
            case 'yearly':
                this.renderYearlyView();
                break;
            case 'habits':
                this.renderHabitsView();
                break;
            case 'goals':
                this.renderGoalsView();
                break;
            case 'analytics':
                this.renderAnalyticsView();
                break;
        }
    },

    // ============================================
    // DAILY VIEW
    // ============================================

    initDailyView() {
        // Add task button
        document.getElementById('add-task-btn').addEventListener('click', () => {
            document.getElementById('add-task-form').style.display = 'flex';
            document.getElementById('add-task-btn').style.display = 'none';
            document.getElementById('new-task-title').focus();
        });

        // Cancel task
        document.getElementById('cancel-task-btn').addEventListener('click', () => {
            document.getElementById('add-task-form').style.display = 'none';
            document.getElementById('add-task-btn').style.display = 'inline-flex';
            document.getElementById('new-task-title').value = '';
        });

        // Save task
        document.getElementById('save-task-btn').addEventListener('click', () => {
            this.addNewTask();
        });

        // Enter key to save task
        document.getElementById('new-task-title').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addNewTask();
            }
        });

        // Daily highlight
        const highlightInput = document.getElementById('daily-highlight');
        highlightInput.addEventListener('blur', () => {
            const value = highlightInput.value.trim();
            if (value) {
                Storage.setDailyData(Utils.getTodayStr(), { highlight: value });
                this.showHighlightDisplay(value);
            }
        });

        highlightInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                highlightInput.blur();
            }
        });

        // Trackers
        document.querySelectorAll('.tracker-scale').forEach(scale => {
            const tracker = scale.dataset.tracker;
            scale.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', () => {
                    scale.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    Storage.setDailyData(Utils.getTodayStr(), { [tracker]: parseInt(btn.dataset.value) });
                });
            });
        });

        // Shutdown button
        document.getElementById('shutdown-btn').addEventListener('click', () => {
            this.startShutdownRitual();
        });

        // Add time block button
        document.getElementById('add-block-btn').addEventListener('click', () => {
            this.showAddBlockModal();
        });
    },

    renderDailyView() {
        const today = Utils.getTodayStr();
        const settings = Storage.getSettings();

        // Update greeting and date
        document.getElementById('greeting').textContent = Utils.getGreeting();
        document.getElementById('current-date').textContent = Utils.formatDateDisplay(new Date());

        // Load daily data
        const dailyData = Storage.getDailyData(today);

        // Highlight
        if (dailyData.highlight) {
            this.showHighlightDisplay(dailyData.highlight);
        } else {
            document.getElementById('daily-highlight').style.display = 'block';
            document.getElementById('highlight-display').style.display = 'none';
        }

        // Trackers
        ['energy', 'mood', 'sleep'].forEach(tracker => {
            const scale = document.querySelector(`[data-tracker="${tracker}"]`);
            if (scale && dailyData[tracker]) {
                scale.querySelectorAll('button').forEach(btn => {
                    btn.classList.toggle('selected', parseInt(btn.dataset.value) === dailyData[tracker]);
                });
            }
        });

        // Tasks
        this.renderTasks(today);

        // Time blocks
        this.renderTimeBlocks(today);

        // Update capacity
        this.updateCapacity(today, settings.dailyCapacity);
    },

    showHighlightDisplay(text) {
        document.getElementById('daily-highlight').style.display = 'none';
        const display = document.getElementById('highlight-display');
        display.style.display = 'flex';
        display.querySelector('.highlight-text').textContent = text;

        // Edit button
        display.querySelector('.edit-btn').onclick = () => {
            display.style.display = 'none';
            const input = document.getElementById('daily-highlight');
            input.style.display = 'block';
            input.value = text;
            input.focus();
        };
    },

    renderTasks(dateStr) {
        const container = document.getElementById('tasks-container');
        const tasks = Storage.getTasksForDate(dateStr);

        if (tasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 11l3 3L22 4"></path>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                    </svg>
                    <p>No tasks for today</p>
                    <p class="hint-text">Add your first task to get started</p>
                </div>
            `;
            return;
        }

        // Sort: incomplete first, then by priority
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        tasks.sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        container.innerHTML = tasks.map(task => this.createTaskHTML(task)).join('');

        // Add event listeners
        container.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', () => {
                const taskId = checkbox.closest('.task-item').dataset.id;
                this.toggleTask(taskId);
            });
        });

        container.querySelectorAll('.focus-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const taskId = btn.closest('.task-item').dataset.id;
                this.startFocusMode(taskId);
            });
        });

        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const taskId = btn.closest('.task-item').dataset.id;
                this.deleteTask(taskId);
            });
        });
    },

    createTaskHTML(task) {
        const categoryIcon = Utils.getCategoryIcon(task.category);
        return `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}"></div>
                <div class="task-content">
                    <div class="task-title">${Utils.sanitize(task.title)}</div>
                    <div class="task-meta">
                        <span class="task-priority ${task.priority}"></span>
                        <span class="task-category">${categoryIcon} ${task.category}</span>
                        <span class="task-duration">⏱ ${Utils.formatDuration(task.duration || 30)}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-action-btn focus-btn" title="Focus on this task">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polygon points="10 8 16 12 10 16 10 8"></polygon>
                        </svg>
                    </button>
                    <button class="task-action-btn delete-btn" title="Delete task">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    },

    addNewTask() {
        const title = document.getElementById('new-task-title').value.trim();
        if (!title) {
            Utils.showToast('Please enter a task title', 'warning');
            return;
        }

        const task = {
            title,
            priority: document.getElementById('new-task-priority').value,
            category: document.getElementById('new-task-category').value,
            duration: parseInt(document.getElementById('new-task-duration').value) || 30,
            date: Utils.getTodayStr()
        };

        Storage.addTask(task);

        // Reset form
        document.getElementById('new-task-title').value = '';
        document.getElementById('add-task-form').style.display = 'none';
        document.getElementById('add-task-btn').style.display = 'inline-flex';

        // Refresh
        this.renderDailyView();
        Utils.showToast('Task added!', 'success');
    },

    toggleTask(taskId) {
        const tasks = Storage.getTasks();
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            Storage.updateTask(taskId, { completed: !task.completed });
            this.renderDailyView();
            
            if (!task.completed) {
                Utils.showToast('Task completed! 🎉', 'success');
            }
        }
    },

    deleteTask(taskId) {
        Storage.deleteTask(taskId);
        this.renderDailyView();
        Utils.showToast('Task deleted', 'info');
    },

    updateCapacity(dateStr, maxCapacity) {
        const tasks = Storage.getTasksForDate(dateStr);
        const plannedMinutes = tasks.reduce((sum, t) => sum + (t.duration || 30), 0);
        const plannedHours = plannedMinutes / 60;
        const percent = Utils.calculateCapacityPercent(plannedMinutes, maxCapacity);

        // Update ring
        const ring = document.getElementById('capacity-ring');
        const fill = ring.querySelector('.capacity-fill');
        const text = ring.querySelector('.capacity-text');

        fill.style.strokeDasharray = `${Math.min(percent, 100)}, 100`;
        text.textContent = `${plannedHours.toFixed(1)}h`;

        // Update status
        ring.classList.remove('warning', 'danger');
        const status = Utils.getCapacityStatus(percent);
        if (status) ring.classList.add(status);

        // Update label
        document.getElementById('capacity-max').textContent = `of ${maxCapacity}h capacity`;
    },

    renderTimeBlocks(dateStr) {
        const container = document.getElementById('schedule-timeline');
        const blocks = Storage.getTimeBlocks(dateStr);
        const settings = Storage.getSettings();

        if (blocks.length === 0) {
            // Show empty schedule with time slots
            const startHour = parseInt(settings.workStart.split(':')[0]);
            const endHour = parseInt(settings.workEnd.split(':')[0]);
            
            let html = '';
            for (let hour = startHour; hour <= endHour; hour++) {
                const time = `${hour.toString().padStart(2, '0')}:00`;
                html += `
                    <div class="time-block">
                        <div class="time-label">${Utils.formatTime(time)}</div>
                        <div class="block-content empty" data-hour="${hour}">
                            <span class="hint-text">Click to add block</span>
                        </div>
                    </div>
                `;
            }
            container.innerHTML = html;
            
            // Add click listeners for empty blocks
            container.querySelectorAll('.block-content.empty').forEach(block => {
                block.addEventListener('click', () => {
                    this.showAddBlockModal(block.dataset.hour);
                });
            });
            return;
        }

        // Render existing blocks
        container.innerHTML = blocks.map(block => `
            <div class="time-block" data-id="${block.id}">
                <div class="time-label">${Utils.formatTime(block.startTime)}</div>
                <div class="block-content ${block.category}">
                    <div class="block-title">${Utils.sanitize(block.title)}</div>
                    <div class="block-time">${Utils.formatTime(block.startTime)} - ${Utils.formatTime(block.endTime)}</div>
                </div>
            </div>
        `).join('');
    },

    showAddBlockModal(hour = null) {
        const modal = document.getElementById('generic-modal');
        document.getElementById('modal-title').textContent = 'Add Time Block';
        
        const startTime = hour ? `${hour.toString().padStart(2, '0')}:00` : '09:00';
        
        document.getElementById('modal-body').innerHTML = `
            <div class="form-group">
                <label>Block Title</label>
                <input type="text" id="block-title" class="form-input" placeholder="e.g., Deep work, Meeting, Lunch">
            </div>
            <div class="form-group">
                <label>Start Time</label>
                <input type="time" id="block-start" class="form-input" value="${startTime}">
            </div>
            <div class="form-group">
                <label>End Time</label>
                <input type="time" id="block-end" class="form-input" value="${parseInt(startTime) + 1}:00">
            </div>
            <div class="form-group">
                <label>Category</label>
                <select id="block-category" class="form-input">
                    <option value="work">💼 Work</option>
                    <option value="personal">🏠 Personal</option>
                    <option value="health">💪 Health</option>
                    <option value="learning">📚 Learning</option>
                </select>
            </div>
        `;

        Utils.showModal('generic-modal');

        document.getElementById('modal-save').onclick = () => {
            const title = document.getElementById('block-title').value.trim();
            if (!title) {
                Utils.showToast('Please enter a title', 'warning');
                return;
            }

            Storage.addTimeBlock({
                title,
                startTime: document.getElementById('block-start').value,
                endTime: document.getElementById('block-end').value,
                category: document.getElementById('block-category').value,
                date: Utils.getTodayStr()
            });

            Utils.hideModal('generic-modal');
            this.renderTimeBlocks(Utils.getTodayStr());
            Utils.showToast('Time block added!', 'success');
        };
    },

    // ============================================
    // FOCUS MODE
    // ============================================

    startFocusMode(taskId) {
        const tasks = Storage.getTasks();
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const settings = Storage.getSettings();
        this.focusTaskId = taskId;
        this.focusTimeRemaining = settings.pomodoroLength * 60;

        document.getElementById('focus-task-name').textContent = task.title;
        document.getElementById('focus-timer').textContent = Utils.formatTimer(this.focusTimeRemaining);
        document.getElementById('focus-mode').style.display = 'flex';

        this.startFocusTimer();
    },

    startFocusTimer() {
        const timerDisplay = document.getElementById('focus-timer');
        const pauseBtn = document.getElementById('focus-pause');
        let isPaused = false;

        this.focusTimer = setInterval(() => {
            if (!isPaused && this.focusTimeRemaining > 0) {
                this.focusTimeRemaining--;
                timerDisplay.textContent = Utils.formatTimer(this.focusTimeRemaining);

                if (this.focusTimeRemaining === 0) {
                    this.completeFocusSession();
                }
            }
        }, 1000);

        pauseBtn.onclick = () => {
            isPaused = !isPaused;
            pauseBtn.innerHTML = isPaused 
                ? '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>'
                : '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
        };

        document.getElementById('focus-stop').onclick = () => this.stopFocusMode();
        document.getElementById('focus-exit').onclick = () => this.stopFocusMode();
    },

    completeFocusSession() {
        this.stopFocusMode();
        Utils.showToast('Focus session complete! Take a break. 🎉', 'success');
        
        // Mark task as completed
        if (this.focusTaskId) {
            Storage.updateTask(this.focusTaskId, { completed: true });
            this.renderDailyView();
        }
    },

    stopFocusMode() {
        if (this.focusTimer) {
            clearInterval(this.focusTimer);
            this.focusTimer = null;
        }
        document.getElementById('focus-mode').style.display = 'none';
        this.focusTaskId = null;
    },

    // ============================================
    // SHUTDOWN RITUAL
    // ============================================

    startShutdownRitual() {
        const modal = document.getElementById('shutdown-modal');
        const steps = modal.querySelectorAll('.shutdown-step');
        const backBtn = document.getElementById('shutdown-back');
        const nextBtn = document.getElementById('shutdown-next');
        
        let currentStep = 1;
        const today = Utils.getTodayStr();

        // Populate completed tasks
        const tasks = Storage.getTasksForDate(today);
        const completed = tasks.filter(t => t.completed);
        const incomplete = tasks.filter(t => !t.completed);

        document.getElementById('completed-tasks-review').innerHTML = completed.length > 0
            ? completed.map(t => `<div class="task-item completed"><span>✓</span> ${Utils.sanitize(t.title)}</div>`).join('')
            : '<p class="hint-text">No tasks completed yet</p>';

        document.getElementById('incomplete-tasks-review').innerHTML = incomplete.length > 0
            ? incomplete.map(t => `
                <div class="task-item" data-id="${t.id}">
                    <span>${Utils.sanitize(t.title)}</span>
                    <button class="btn btn-small move-tomorrow" data-id="${t.id}">Move to Tomorrow</button>
                </div>
            `).join('')
            : '<p class="hint-text">All tasks completed! 🎉</p>';

        const updateStep = () => {
            steps.forEach((step, i) => {
                step.classList.toggle('active', i === currentStep - 1);
            });
            backBtn.style.visibility = currentStep === 1 ? 'hidden' : 'visible';
            nextBtn.textContent = currentStep === 4 ? 'Close Day' : 'Continue';
        };

        Utils.showModal('shutdown-modal');
        updateStep();

        // Move to tomorrow buttons
        modal.querySelectorAll('.move-tomorrow').forEach(btn => {
            btn.addEventListener('click', () => {
                const taskId = btn.dataset.id;
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                Storage.moveTask(taskId, Utils.formatDateStr(tomorrow));
                btn.closest('.task-item').remove();
                Utils.showToast('Task moved to tomorrow', 'info');
            });
        });

        nextBtn.onclick = () => {
            if (currentStep === 1) {
                // Save wins
                const wins = document.getElementById('shutdown-wins').value;
                Storage.setDailyData(today, { wins });
            } else if (currentStep === 3) {
                // Save tomorrow's highlight
                const highlight = document.getElementById('tomorrow-highlight').value;
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                if (highlight) {
                    Storage.setDailyData(Utils.formatDateStr(tomorrow), { highlight });
                }
                
                // Update summary
                document.getElementById('shutdown-completed').textContent = completed.length;
                const focusTime = completed.reduce((sum, t) => sum + (t.duration || 30), 0);
                document.getElementById('shutdown-focus').textContent = Utils.formatDuration(focusTime);
            }

            if (currentStep < 4) {
                currentStep++;
                updateStep();
            } else {
                Utils.hideModal('shutdown-modal');
                Utils.showToast('Day closed. Rest well! 🌙', 'success');
            }
        };

        backBtn.onclick = () => {
            if (currentStep > 1) {
                currentStep--;
                updateStep();
            }
        };
    },

    // ============================================
    // WEEKLY VIEW
    // ============================================

    initWeeklyView() {
        document.getElementById('prev-week').addEventListener('click', () => {
            this.currentWeek.setDate(this.currentWeek.getDate() - 7);
            this.renderWeeklyView();
        });

        document.getElementById('next-week').addEventListener('click', () => {
            this.currentWeek.setDate(this.currentWeek.getDate() + 7);
            this.renderWeeklyView();
        });

        document.getElementById('add-objective-btn').addEventListener('click', () => {
            this.showAddObjectiveModal();
        });
    },

    renderWeeklyView() {
        // Update week display
        document.getElementById('week-display').textContent = Utils.formatWeekRange(this.currentWeek);

        // Render week grid
        const weekDates = Utils.getWeekDates(this.currentWeek);
        const weekGrid = document.getElementById('week-grid');

        weekGrid.innerHTML = weekDates.map(date => {
            const dateStr = Utils.formatDateStr(date);
            const tasks = Storage.getTasksForDate(dateStr);
            const isToday = Utils.isToday(date);

            return `
                <div class="day-column ${isToday ? 'today' : ''}">
                    <div class="day-header">
                        <div class="day-name">${Utils.getDayName(date)}</div>
                        <div class="day-date">${date.getDate()}</div>
                    </div>
                    <div class="day-tasks">
                        ${tasks.map(t => `
                            <div class="day-task ${t.completed ? 'completed' : ''}">${Utils.sanitize(t.title)}</div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');

        // Render objectives
        this.renderWeeklyObjectives();

        // Update stats
        this.updateWeeklyStats();
    },

    renderWeeklyObjectives() {
        const weekStart = Utils.formatDateStr(this.currentWeek);
        const objectives = Storage.getWeeklyObjectives(weekStart);
        const container = document.getElementById('weekly-objectives-list');

        if (objectives.length === 0) {
            container.innerHTML = '<p class="hint-text">No objectives set for this week</p>';
            return;
        }

        container.innerHTML = objectives.map(obj => `
            <div class="objective-item" data-id="${obj.id}">
                <div class="objective-checkbox ${obj.completed ? 'checked' : ''}"></div>
                <span class="objective-text">${Utils.sanitize(obj.title)}</span>
            </div>
        `).join('');

        container.querySelectorAll('.objective-checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', () => {
                const objId = checkbox.closest('.objective-item').dataset.id;
                Storage.toggleWeeklyObjective(objId);
                this.renderWeeklyObjectives();
            });
        });
    },

    showAddObjectiveModal() {
        const modal = document.getElementById('generic-modal');
        document.getElementById('modal-title').textContent = 'Add Weekly Objective';
        
        document.getElementById('modal-body').innerHTML = `
            <div class="form-group">
                <label>What do you want to accomplish this week?</label>
                <input type="text" id="objective-title" class="form-input" placeholder="e.g., Complete project proposal">
            </div>
        `;

        Utils.showModal('generic-modal');

        document.getElementById('modal-save').onclick = () => {
            const title = document.getElementById('objective-title').value.trim();
            if (!title) {
                Utils.showToast('Please enter an objective', 'warning');
                return;
            }

            Storage.addWeeklyObjective({
                title,
                weekStart: Utils.formatDateStr(this.currentWeek)
            });

            Utils.hideModal('generic-modal');
            this.renderWeeklyObjectives();
            Utils.showToast('Objective added!', 'success');
        };
    },

    updateWeeklyStats() {
        const weekDates = Utils.getWeekDates(this.currentWeek);
        const startDate = Utils.formatDateStr(weekDates[0]);
        const endDate = Utils.formatDateStr(weekDates[6]);

        const stats = Storage.getProductivityStats(startDate, endDate);

        document.getElementById('weekly-tasks-completed').textContent = stats.completedTasks;
        document.getElementById('weekly-focus-hours').textContent = `${stats.focusHours}h`;
        document.getElementById('weekly-habit-rate').textContent = `${stats.habitCompletionRate}%`;
    },

    // ============================================
    // MONTHLY VIEW
    // ============================================

    initMonthlyView() {
        document.getElementById('prev-month').addEventListener('click', () => {
            this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
            this.renderMonthlyView();
        });

        document.getElementById('next-month').addEventListener('click', () => {
            this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
            this.renderMonthlyView();
        });

        document.getElementById('add-monthly-goal-btn').addEventListener('click', () => {
            this.showAddGoalModal('monthly');
        });
    },

    renderMonthlyView() {
        // Update month display
        document.getElementById('month-display').textContent = Utils.formatMonthYear(this.currentMonth);

        // Render calendar
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        const days = Utils.getCalendarDays(year, month);

        const calendarGrid = document.getElementById('calendar-grid');
        calendarGrid.innerHTML = `
            <div class="calendar-header">
                <div class="calendar-weekday">Mon</div>
                <div class="calendar-weekday">Tue</div>
                <div class="calendar-weekday">Wed</div>
                <div class="calendar-weekday">Thu</div>
                <div class="calendar-weekday">Fri</div>
                <div class="calendar-weekday">Sat</div>
                <div class="calendar-weekday">Sun</div>
            </div>
            <div class="calendar-days">
                ${days.map(day => {
                    const tasks = Storage.getTasksForDate(day.dateStr);
                    const hasData = tasks.length > 0;
                    return `
                        <div class="calendar-day ${day.isOtherMonth ? 'other-month' : ''} ${day.isToday ? 'today' : ''}" data-date="${day.dateStr}">
                            <span class="day-number">${day.dayNum}</span>
                            ${hasData ? '<div class="day-indicators"><span class="day-indicator"></span></div>' : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // Click to navigate to day
        calendarGrid.querySelectorAll('.calendar-day').forEach(dayEl => {
            dayEl.addEventListener('click', () => {
                const dateStr = dayEl.dataset.date;
                this.currentDate = new Date(dateStr);
                this.switchView('daily');
            });
        });

        // Render monthly goals
        this.renderMonthlyGoals();

        // Update summary
        this.updateMonthlySummary(year, month);
    },

    renderMonthlyGoals() {
        const goals = Storage.getGoals();
        const container = document.getElementById('monthly-goals-list');

        if (goals.monthly.length === 0) {
            container.innerHTML = '<p class="hint-text">No monthly goals set</p>';
            return;
        }

        container.innerHTML = goals.monthly.map(goal => `
            <div class="goal-item">
                <span>${Utils.sanitize(goal.title)}</span>
                <div class="progress-bar"><div class="progress-fill" style="width: ${goal.progress}%"></div></div>
            </div>
        `).join('');
    },

    updateMonthlySummary(year, month) {
        const startDate = `${year}-${(month + 1).toString().padStart(2, '0')}-01`;
        const endDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;

        const stats = Storage.getProductivityStats(startDate, endDate);

        document.getElementById('month-tasks').textContent = stats.completedTasks;
        document.getElementById('month-events').textContent = Storage.getTimeBlocks(startDate).length;
        document.getElementById('month-avg-mood').textContent = stats.averageMood || '-';
    },

    // ============================================
    // YEARLY VIEW
    // ============================================

    initYearlyView() {
        document.getElementById('add-yearly-goal-btn').addEventListener('click', () => {
            this.showAddGoalModal('yearly');
        });
    },

    renderYearlyView() {
        // Render year in pixels
        const year = new Date().getFullYear();
        const moodData = Storage.getMoodDataForYear(year);
        const yearDays = Utils.getYearDays(year);

        const pixelsGrid = document.getElementById('year-pixels-grid');
        
        // Group by week
        const weeks = {};
        yearDays.forEach(day => {
            if (!weeks[day.week]) weeks[day.week] = [];
            weeks[day.week].push(day);
        });

        let html = '';
        Object.keys(weeks).forEach(week => {
            weeks[week].forEach(day => {
                const mood = moodData[day.dateStr];
                html += `<div class="year-pixel" data-date="${day.dateStr}" ${mood ? `data-mood="${mood}"` : ''} title="${day.dateStr}"></div>`;
            });
        });

        pixelsGrid.innerHTML = html;

        // Render yearly goals
        this.renderYearlyGoals();
    },

    renderYearlyGoals() {
        const goals = Storage.getGoals();
        const container = document.getElementById('yearly-goals-list');

        if (goals.yearly.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No yearly goals set yet</p>
                    <p class="hint-text">Set meaningful goals to track your progress</p>
                </div>
            `;
            return;
        }

        container.innerHTML = goals.yearly.map(goal => `
            <div class="yearly-goal-item">
                <div class="yearly-goal-title">${Utils.sanitize(goal.title)}</div>
                <p class="hint-text">${Utils.sanitize(goal.description || '')}</p>
                <div class="yearly-goal-progress">
                    <div class="progress-bar"><div class="progress-fill" style="width: ${goal.progress}%"></div></div>
                    <span class="hint-text">${goal.progress}% complete</span>
                </div>
            </div>
        `).join('');
    },

    // ============================================
    // HABITS VIEW
    // ============================================

    initHabitsView() {
        document.getElementById('add-habit-btn').addEventListener('click', () => {
            this.showAddHabitModal();
        });
    },

    renderHabitsView() {
        const habits = Storage.getHabits();
        const container = document.getElementById('habits-list');
        const today = new Date();
        const weekDates = [];
        
        // Get last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            weekDates.push({
                date,
                dateStr: Utils.formatDateStr(date),
                dayName: Utils.getDayName(date).charAt(0),
                isToday: i === 0
            });
        }

        if (habits.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <p>No habits tracked yet</p>
                    <p class="hint-text">Start building positive routines</p>
                </div>
            `;
            return;
        }

        container.innerHTML = habits.map(habit => `
            <div class="habit-card" data-id="${habit.id}">
                <div class="habit-info">
                    <div class="habit-name">${Utils.sanitize(habit.name)}</div>
                    <div class="habit-streak">
                        🔥 <span class="streak-count">${habit.currentStreak}</span> day streak
                    </div>
                </div>
                <div class="habit-week">
                    ${weekDates.map(day => `
                        <div class="habit-day ${habit.completedDates.includes(day.dateStr) ? 'completed' : ''} ${day.isToday ? 'today' : ''}" 
                             data-date="${day.dateStr}" title="${day.dateStr}">
                            ${day.dayName}
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        // Add click listeners
        container.querySelectorAll('.habit-day').forEach(dayEl => {
            dayEl.addEventListener('click', () => {
                const habitId = dayEl.closest('.habit-card').dataset.id;
                const dateStr = dayEl.dataset.date;
                Storage.toggleHabitCompletion(habitId, dateStr);
                this.renderHabitsView();
            });
        });
    },

    showAddHabitModal() {
        const modal = document.getElementById('generic-modal');
        document.getElementById('modal-title').textContent = 'New Habit';
        
        document.getElementById('modal-body').innerHTML = `
            <div class="form-group">
                <label>Habit Name</label>
                <input type="text" id="habit-name" class="form-input" placeholder="e.g., Meditate, Exercise, Read">
            </div>
            <div class="form-group">
                <label>Frequency</label>
                <select id="habit-frequency" class="form-input">
                    <option value="daily">Daily</option>
                    <option value="weekdays">Weekdays</option>
                    <option value="weekly">Weekly</option>
                </select>
            </div>
        `;

        Utils.showModal('generic-modal');

        document.getElementById('modal-save').onclick = () => {
            const name = document.getElementById('habit-name').value.trim();
            if (!name) {
                Utils.showToast('Please enter a habit name', 'warning');
                return;
            }

            Storage.addHabit({
                name,
                frequency: document.getElementById('habit-frequency').value
            });

            Utils.hideModal('generic-modal');
            this.renderHabitsView();
            Utils.showToast('Habit created! Start building your streak.', 'success');
        };
    },

    // ============================================
    // GOALS VIEW
    // ============================================

    initGoalsView() {
        // Life area cards click
        document.querySelectorAll('.life-area-card').forEach(card => {
            card.addEventListener('click', () => {
                this.showLifeAreaGoals(card.dataset.area);
            });
        });
    },

    renderGoalsView() {
        const goals = Storage.getGoals();

        // Update each life area
        Object.keys(goals.lifeAreas).forEach(area => {
            const areaGoals = goals.lifeAreas[area] || [];
            const container = document.getElementById(`${area}-goals`);
            const card = document.querySelector(`.life-area-card[data-area="${area}"]`);

            if (container) {
                container.innerHTML = areaGoals.slice(0, 3).map(g => 
                    `<div class="area-goal">${Utils.sanitize(g.title)}</div>`
                ).join('');
            }

            // Update progress
            if (card && areaGoals.length > 0) {
                const avgProgress = areaGoals.reduce((sum, g) => sum + g.progress, 0) / areaGoals.length;
                card.querySelector('.progress-fill').style.width = `${avgProgress}%`;
                card.querySelector('.progress-text').textContent = `${Math.round(avgProgress)}% complete`;
            }
        });
    },

    showLifeAreaGoals(area) {
        const goals = Storage.getGoals();
        const areaGoals = goals.lifeAreas[area] || [];
        const areaNames = {
            career: 'Career',
            health: 'Health & Fitness',
            relationships: 'Relationships',
            finance: 'Finance',
            learning: 'Learning',
            creativity: 'Creativity'
        };

        const modal = document.getElementById('generic-modal');
        document.getElementById('modal-title').textContent = `${areaNames[area]} Goals`;
        
        document.getElementById('modal-body').innerHTML = `
            <div class="goals-list-modal">
                ${areaGoals.length > 0 ? areaGoals.map(g => `
                    <div class="goal-modal-item">
                        <span>${Utils.sanitize(g.title)}</span>
                        <div class="progress-bar"><div class="progress-fill" style="width: ${g.progress}%"></div></div>
                    </div>
                `).join('') : '<p class="hint-text">No goals in this area yet</p>'}
            </div>
            <div class="add-goal-form" style="margin-top: 16px;">
                <input type="text" id="new-area-goal" class="form-input" placeholder="Add a new goal...">
            </div>
        `;

        document.getElementById('modal-save').textContent = 'Add Goal';
        Utils.showModal('generic-modal');

        document.getElementById('modal-save').onclick = () => {
            const title = document.getElementById('new-area-goal').value.trim();
            if (title) {
                Storage.addGoal('lifeArea', { title }, area);
                Utils.hideModal('generic-modal');
                this.renderGoalsView();
                Utils.showToast('Goal added!', 'success');
            } else {
                Utils.hideModal('generic-modal');
            }
        };
    },

    showAddGoalModal(type) {
        const modal = document.getElementById('generic-modal');
        document.getElementById('modal-title').textContent = type === 'yearly' ? 'Add Yearly Goal' : 'Add Monthly Goal';
        
        document.getElementById('modal-body').innerHTML = `
            <div class="form-group">
                <label>Goal Title</label>
                <input type="text" id="goal-title" class="form-input" placeholder="What do you want to achieve?">
            </div>
            <div class="form-group">
                <label>Description (optional)</label>
                <textarea id="goal-description" class="form-input" placeholder="Add more details..."></textarea>
            </div>
        `;

        Utils.showModal('generic-modal');

        document.getElementById('modal-save').onclick = () => {
            const title = document.getElementById('goal-title').value.trim();
            if (!title) {
                Utils.showToast('Please enter a goal title', 'warning');
                return;
            }

            Storage.addGoal(type, {
                title,
                description: document.getElementById('goal-description').value.trim()
            });

            Utils.hideModal('generic-modal');
            
            if (type === 'yearly') {
                this.renderYearlyGoals();
            } else {
                this.renderMonthlyGoals();
            }
            
            Utils.showToast('Goal added!', 'success');
        };
    },

    // ============================================
    // ANALYTICS VIEW
    // ============================================

    initAnalyticsView() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderAnalyticsView(btn.dataset.range);
            });
        });
    },

    renderAnalyticsView(range = 'week') {
        const today = new Date();
        let startDate, endDate;

        if (range === 'week') {
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 7);
            endDate = today;
        } else if (range === 'month') {
            startDate = new Date(today);
            startDate.setMonth(startDate.getMonth() - 1);
            endDate = today;
        } else {
            startDate = new Date(today);
            startDate.setMonth(startDate.getMonth() - 3);
            endDate = today;
        }

        const stats = Storage.getProductivityStats(
            Utils.formatDateStr(startDate),
            Utils.formatDateStr(endDate)
        );

        // Update productivity score
        const score = Math.round((stats.completionRate * 0.6) + (stats.habitCompletionRate * 0.4));
        document.getElementById('productivity-score').textContent = score || 0;

        // Render task completion chart
        this.renderTaskCompletionChart(startDate, endDate);

        // Render patterns chart
        this.renderPatternsChart(startDate, endDate);

        // Render streaks
        this.renderStreaks();
    },

    renderTaskCompletionChart(startDate, endDate) {
        const container = document.getElementById('task-completion-chart');
        const days = [];
        let current = new Date(startDate);

        while (current <= endDate) {
            const dateStr = Utils.formatDateStr(current);
            const tasks = Storage.getTasksForDate(dateStr);
            const completed = tasks.filter(t => t.completed).length;
            days.push(completed);
            current.setDate(current.getDate() + 1);
        }

        const maxHeight = 150;
        const heights = Utils.generateBarHeights(days, maxHeight);

        container.innerHTML = heights.map((h, i) => 
            `<div class="chart-bar" style="height: ${h}px" title="${days[i]} tasks"></div>`
        ).join('');
    },

    renderPatternsChart(startDate, endDate) {
        const container = document.getElementById('patterns-chart');
        const dailyData = Storage.get(Storage.KEYS.DAILY_DATA) || {};
        
        const energyData = [];
        const moodData = [];
        
        let current = new Date(startDate);
        while (current <= endDate) {
            const dateStr = Utils.formatDateStr(current);
            const data = dailyData[dateStr] || {};
            energyData.push(data.energy || 3);
            moodData.push(data.mood || 3);
            current.setDate(current.getDate() + 1);
        }

        container.innerHTML = `
            <div class="pattern-row">
                <span class="pattern-label">Energy</span>
                <div class="pattern-bars">
                    ${energyData.map(e => `<div class="pattern-bar" style="background: var(--mood-${e})"></div>`).join('')}
                </div>
            </div>
            <div class="pattern-row">
                <span class="pattern-label">Mood</span>
                <div class="pattern-bars">
                    ${moodData.map(m => `<div class="pattern-bar" style="background: var(--mood-${m})"></div>`).join('')}
                </div>
            </div>
        `;
    },

    renderStreaks() {
        const habits = Storage.getHabits();
        const container = document.getElementById('streaks-list');

        if (habits.length === 0) {
            container.innerHTML = '<p class="hint-text">No habits to track</p>';
            return;
        }

        const sorted = [...habits].sort((a, b) => b.currentStreak - a.currentStreak);

        container.innerHTML = sorted.slice(0, 5).map(h => `
            <div class="streak-item">
                <div class="streak-icon">🔥</div>
                <div class="streak-info">
                    <div class="streak-name">${Utils.sanitize(h.name)}</div>
                    <div class="streak-days">${h.currentStreak} day streak</div>
                </div>
            </div>
        `).join('');
    },

    // ============================================
    // SETTINGS
    // ============================================

    showSettings() {
        const settings = Storage.getSettings();
        const user = Storage.getUser() || {};

        document.getElementById('settings-name').value = user.name || '';
        document.getElementById('settings-work-start').value = settings.workStart;
        document.getElementById('settings-work-end').value = settings.workEnd;
        document.getElementById('settings-capacity').value = settings.dailyCapacity;
        document.getElementById('settings-pomodoro').value = settings.pomodoroLength;
        document.getElementById('settings-break').value = settings.breakLength;

        Utils.showModal('settings-modal');
    },

    saveSettings() {
        const user = Storage.getUser() || {};
        user.name = document.getElementById('settings-name').value.trim();
        Storage.setUser(user);

        Storage.setSettings({
            workStart: document.getElementById('settings-work-start').value,
            workEnd: document.getElementById('settings-work-end').value,
            dailyCapacity: parseInt(document.getElementById('settings-capacity').value),
            pomodoroLength: parseInt(document.getElementById('settings-pomodoro').value),
            breakLength: parseInt(document.getElementById('settings-break').value)
        });

        this.loadUserData();
        Utils.hideModal('settings-modal');
        Utils.showToast('Settings saved!', 'success');
    },

    exportData() {
        const data = Storage.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zenith-backup-${Utils.getTodayStr()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        Utils.showToast('Data exported!', 'success');
    },

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (Storage.importData(event.target.result)) {
                        Utils.showToast('Data imported successfully!', 'success');
                        this.refreshCurrentView();
                        this.loadUserData();
                    } else {
                        Utils.showToast('Failed to import data', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    },

    resetData() {
        if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
            Storage.clearAll();
            Storage.init();
            Utils.hideModal('settings-modal');
            Utils.showToast('Data reset complete', 'info');
            this.showOnboarding();
        }
    },

    // ============================================
    // EVENT LISTENERS
    // ============================================

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                this.switchView(item.dataset.view);
            });
        });

        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Settings
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettings();
        });

        document.getElementById('close-settings').addEventListener('click', () => {
            Utils.hideModal('settings-modal');
        });

        document.getElementById('save-settings').addEventListener('click', () => {
            this.saveSettings();
        });

        document.getElementById('export-data').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('import-data').addEventListener('click', () => {
            this.importData();
        });

        document.getElementById('reset-data').addEventListener('click', () => {
            this.resetData();
        });

        // Generic modal
        document.getElementById('close-modal').addEventListener('click', () => {
            Utils.hideModal('generic-modal');
        });

        document.getElementById('modal-cancel').addEventListener('click', () => {
            Utils.hideModal('generic-modal');
        });

        // Close modals on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.style.display = 'none';
                    document.body.style.overflow = '';
                }
            });
        });

        // Onboarding
        this.handleOnboarding();
    },

    setupKeyboardShortcuts() {
        // T - Add task
        Utils.registerShortcut('t', () => {
            if (this.currentView === 'daily') {
                document.getElementById('add-task-btn').click();
            }
        });

        // D - Switch to daily
        Utils.registerShortcut('d', () => this.switchView('daily'));

        // W - Switch to weekly
        Utils.registerShortcut('w', () => this.switchView('weekly'));

        // M - Switch to monthly
        Utils.registerShortcut('m', () => this.switchView('monthly'));

        // H - Switch to habits
        Utils.registerShortcut('h', () => this.switchView('habits'));

        // Escape - Close modals
        Utils.registerShortcut('escape', () => {
            document.querySelectorAll('.modal-overlay').forEach(modal => {
                modal.style.display = 'none';
            });
            document.body.style.overflow = '';
            this.stopFocusMode();
        });

        // Ctrl+S - Save/Settings
        Utils.registerShortcut('s', () => this.showSettings(), { ctrl: true });
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Export for debugging
window.App = App;
