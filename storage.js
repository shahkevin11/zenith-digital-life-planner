/**
 * ZENITH DIGITAL PLANNER - Storage Module
 * Handles all localStorage operations with data validation
 */

const Storage = {
    // Storage keys
    KEYS: {
        USER: 'zenith_user',
        TASKS: 'zenith_tasks',
        HABITS: 'zenith_habits',
        GOALS: 'zenith_goals',
        TIME_BLOCKS: 'zenith_timeblocks',
        DAILY_DATA: 'zenith_daily_data',
        WEEKLY_OBJECTIVES: 'zenith_weekly_objectives',
        SETTINGS: 'zenith_settings',
        THEME: 'zenith_theme'
    },

    /**
     * Initialize storage with default data if empty
     */
    init() {
        // Initialize each storage key with defaults if not exists
        if (!this.get(this.KEYS.TASKS)) {
            this.set(this.KEYS.TASKS, []);
        }
        if (!this.get(this.KEYS.HABITS)) {
            this.set(this.KEYS.HABITS, []);
        }
        if (!this.get(this.KEYS.GOALS)) {
            this.set(this.KEYS.GOALS, {
                yearly: [],
                monthly: [],
                lifeAreas: {
                    career: [],
                    health: [],
                    relationships: [],
                    finance: [],
                    learning: [],
                    creativity: []
                }
            });
        }
        if (!this.get(this.KEYS.TIME_BLOCKS)) {
            this.set(this.KEYS.TIME_BLOCKS, []);
        }
        if (!this.get(this.KEYS.DAILY_DATA)) {
            this.set(this.KEYS.DAILY_DATA, {});
        }
        if (!this.get(this.KEYS.WEEKLY_OBJECTIVES)) {
            this.set(this.KEYS.WEEKLY_OBJECTIVES, []);
        }
        if (!this.get(this.KEYS.SETTINGS)) {
            this.set(this.KEYS.SETTINGS, {
                workStart: '09:00',
                workEnd: '17:00',
                dailyCapacity: 5,
                pomodoroLength: 25,
                breakLength: 5
            });
        }
    },

    /**
     * Get data from localStorage
     * @param {string} key - Storage key
     * @returns {any} Parsed data or null
     */
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Error reading from storage [${key}]:`, error);
            return null;
        }
    },

    /**
     * Set data in localStorage
     * @param {string} key - Storage key
     * @param {any} data - Data to store
     */
    set(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error(`Error writing to storage [${key}]:`, error);
        }
    },

    /**
     * Remove data from localStorage
     * @param {string} key - Storage key
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`Error removing from storage [${key}]:`, error);
        }
    },

    /**
     * Clear all Zenith data from localStorage
     */
    clearAll() {
        Object.values(this.KEYS).forEach(key => {
            this.remove(key);
        });
    },

    // ============================================
    // USER METHODS
    // ============================================

    /**
     * Get user data
     * @returns {Object|null} User object
     */
    getUser() {
        return this.get(this.KEYS.USER);
    },

    /**
     * Save user data
     * @param {Object} user - User object
     */
    setUser(user) {
        this.set(this.KEYS.USER, user);
    },

    /**
     * Check if user has completed onboarding
     * @returns {boolean}
     */
    hasCompletedOnboarding() {
        const user = this.getUser();
        return user && user.onboardingComplete === true;
    },

    // ============================================
    // TASK METHODS
    // ============================================

    /**
     * Get all tasks
     * @returns {Array} Array of tasks
     */
    getTasks() {
        return this.get(this.KEYS.TASKS) || [];
    },

    /**
     * Get tasks for a specific date
     * @param {string} dateStr - Date string (YYYY-MM-DD)
     * @returns {Array} Array of tasks for that date
     */
    getTasksForDate(dateStr) {
        const tasks = this.getTasks();
        return tasks.filter(task => task.date === dateStr);
    },

    /**
     * Add a new task
     * @param {Object} task - Task object
     * @returns {Object} Created task with ID
     */
    addTask(task) {
        const tasks = this.getTasks();
        const newTask = {
            id: this.generateId(),
            createdAt: new Date().toISOString(),
            completed: false,
            completedAt: null,
            ...task
        };
        tasks.push(newTask);
        this.set(this.KEYS.TASKS, tasks);
        return newTask;
    },

    /**
     * Update a task
     * @param {string} id - Task ID
     * @param {Object} updates - Fields to update
     * @returns {Object|null} Updated task
     */
    updateTask(id, updates) {
        const tasks = this.getTasks();
        const index = tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...updates };
            if (updates.completed && !tasks[index].completedAt) {
                tasks[index].completedAt = new Date().toISOString();
            }
            this.set(this.KEYS.TASKS, tasks);
            return tasks[index];
        }
        return null;
    },

    /**
     * Delete a task
     * @param {string} id - Task ID
     */
    deleteTask(id) {
        const tasks = this.getTasks();
        const filtered = tasks.filter(t => t.id !== id);
        this.set(this.KEYS.TASKS, filtered);
    },

    /**
     * Move task to another date
     * @param {string} id - Task ID
     * @param {string} newDate - New date (YYYY-MM-DD)
     */
    moveTask(id, newDate) {
        this.updateTask(id, { date: newDate });
    },

    // ============================================
    // HABIT METHODS
    // ============================================

    /**
     * Get all habits
     * @returns {Array} Array of habits
     */
    getHabits() {
        return this.get(this.KEYS.HABITS) || [];
    },

    /**
     * Add a new habit
     * @param {Object} habit - Habit object
     * @returns {Object} Created habit with ID
     */
    addHabit(habit) {
        const habits = this.getHabits();
        const newHabit = {
            id: this.generateId(),
            createdAt: new Date().toISOString(),
            completedDates: [],
            currentStreak: 0,
            longestStreak: 0,
            ...habit
        };
        habits.push(newHabit);
        this.set(this.KEYS.HABITS, habits);
        return newHabit;
    },

    /**
     * Toggle habit completion for a date
     * @param {string} habitId - Habit ID
     * @param {string} dateStr - Date string (YYYY-MM-DD)
     * @returns {Object} Updated habit
     */
    toggleHabitCompletion(habitId, dateStr) {
        const habits = this.getHabits();
        const habit = habits.find(h => h.id === habitId);
        
        if (habit) {
            const index = habit.completedDates.indexOf(dateStr);
            if (index > -1) {
                habit.completedDates.splice(index, 1);
            } else {
                habit.completedDates.push(dateStr);
            }
            // Recalculate streak
            habit.currentStreak = this.calculateStreak(habit.completedDates);
            habit.longestStreak = Math.max(habit.longestStreak, habit.currentStreak);
            
            this.set(this.KEYS.HABITS, habits);
        }
        return habit;
    },

    /**
     * Delete a habit
     * @param {string} id - Habit ID
     */
    deleteHabit(id) {
        const habits = this.getHabits();
        const filtered = habits.filter(h => h.id !== id);
        this.set(this.KEYS.HABITS, filtered);
    },

    /**
     * Calculate current streak from completed dates
     * @param {Array} completedDates - Array of date strings
     * @returns {number} Current streak count
     */
    calculateStreak(completedDates) {
        if (!completedDates || completedDates.length === 0) return 0;
        
        const sortedDates = [...completedDates].sort().reverse();
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        
        // Check if streak is still active
        if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
            return 0;
        }
        
        let streak = 1;
        let currentDate = new Date(sortedDates[0]);
        
        for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = new Date(currentDate);
            prevDate.setDate(prevDate.getDate() - 1);
            
            if (sortedDates[i] === prevDate.toISOString().split('T')[0]) {
                streak++;
                currentDate = prevDate;
            } else {
                break;
            }
        }
        
        return streak;
    },

    // ============================================
    // TIME BLOCKS METHODS
    // ============================================

    /**
     * Get time blocks for a specific date
     * @param {string} dateStr - Date string (YYYY-MM-DD)
     * @returns {Array} Array of time blocks
     */
    getTimeBlocks(dateStr) {
        const blocks = this.get(this.KEYS.TIME_BLOCKS) || [];
        return blocks.filter(b => b.date === dateStr);
    },

    /**
     * Add a time block
     * @param {Object} block - Time block object
     * @returns {Object} Created time block
     */
    addTimeBlock(block) {
        const blocks = this.get(this.KEYS.TIME_BLOCKS) || [];
        const newBlock = {
            id: this.generateId(),
            ...block
        };
        blocks.push(newBlock);
        this.set(this.KEYS.TIME_BLOCKS, blocks);
        return newBlock;
    },

    /**
     * Delete a time block
     * @param {string} id - Time block ID
     */
    deleteTimeBlock(id) {
        const blocks = this.get(this.KEYS.TIME_BLOCKS) || [];
        const filtered = blocks.filter(b => b.id !== id);
        this.set(this.KEYS.TIME_BLOCKS, filtered);
    },

    // ============================================
    // DAILY DATA METHODS
    // ============================================

    /**
     * Get daily data for a specific date
     * @param {string} dateStr - Date string (YYYY-MM-DD)
     * @returns {Object} Daily data object
     */
    getDailyData(dateStr) {
        const allData = this.get(this.KEYS.DAILY_DATA) || {};
        return allData[dateStr] || {
            highlight: '',
            energy: null,
            mood: null,
            sleep: null,
            reflection: '',
            wins: ''
        };
    },

    /**
     * Save daily data for a specific date
     * @param {string} dateStr - Date string (YYYY-MM-DD)
     * @param {Object} data - Daily data object
     */
    setDailyData(dateStr, data) {
        const allData = this.get(this.KEYS.DAILY_DATA) || {};
        allData[dateStr] = { ...allData[dateStr], ...data };
        this.set(this.KEYS.DAILY_DATA, allData);
    },

    /**
     * Get mood data for year in pixels
     * @param {number} year - Year to get data for
     * @returns {Object} Object with date keys and mood values
     */
    getMoodDataForYear(year) {
        const allData = this.get(this.KEYS.DAILY_DATA) || {};
        const yearData = {};
        
        Object.keys(allData).forEach(dateStr => {
            if (dateStr.startsWith(year.toString()) && allData[dateStr].mood) {
                yearData[dateStr] = allData[dateStr].mood;
            }
        });
        
        return yearData;
    },

    // ============================================
    // GOALS & OBJECTIVES METHODS
    // ============================================

    /**
     * Get all goals
     * @returns {Object} Goals object
     */
    getGoals() {
        return this.get(this.KEYS.GOALS) || {
            yearly: [],
            monthly: [],
            lifeAreas: {}
        };
    },

    /**
     * Add a goal
     * @param {string} type - Goal type (yearly, monthly, lifeArea)
     * @param {Object} goal - Goal object
     * @param {string} area - Life area (for lifeArea type)
     */
    addGoal(type, goal, area = null) {
        const goals = this.getGoals();
        const newGoal = {
            id: this.generateId(),
            createdAt: new Date().toISOString(),
            progress: 0,
            ...goal
        };

        if (type === 'lifeArea' && area) {
            if (!goals.lifeAreas[area]) {
                goals.lifeAreas[area] = [];
            }
            goals.lifeAreas[area].push(newGoal);
        } else if (type === 'yearly') {
            goals.yearly.push(newGoal);
        } else if (type === 'monthly') {
            goals.monthly.push(newGoal);
        }

        this.set(this.KEYS.GOALS, goals);
        return newGoal;
    },

    /**
     * Update goal progress
     * @param {string} type - Goal type
     * @param {string} id - Goal ID
     * @param {number} progress - Progress value (0-100)
     * @param {string} area - Life area (optional)
     */
    updateGoalProgress(type, id, progress, area = null) {
        const goals = this.getGoals();
        let targetArray;

        if (type === 'lifeArea' && area) {
            targetArray = goals.lifeAreas[area];
        } else if (type === 'yearly') {
            targetArray = goals.yearly;
        } else if (type === 'monthly') {
            targetArray = goals.monthly;
        }

        if (targetArray) {
            const goal = targetArray.find(g => g.id === id);
            if (goal) {
                goal.progress = progress;
                this.set(this.KEYS.GOALS, goals);
            }
        }
    },

    /**
     * Get weekly objectives
     * @param {string} weekStart - Week start date (YYYY-MM-DD)
     * @returns {Array} Array of objectives
     */
    getWeeklyObjectives(weekStart) {
        const objectives = this.get(this.KEYS.WEEKLY_OBJECTIVES) || [];
        return objectives.filter(o => o.weekStart === weekStart);
    },

    /**
     * Add weekly objective
     * @param {Object} objective - Objective object
     * @returns {Object} Created objective
     */
    addWeeklyObjective(objective) {
        const objectives = this.get(this.KEYS.WEEKLY_OBJECTIVES) || [];
        const newObjective = {
            id: this.generateId(),
            completed: false,
            ...objective
        };
        objectives.push(newObjective);
        this.set(this.KEYS.WEEKLY_OBJECTIVES, objectives);
        return newObjective;
    },

    /**
     * Toggle weekly objective completion
     * @param {string} id - Objective ID
     */
    toggleWeeklyObjective(id) {
        const objectives = this.get(this.KEYS.WEEKLY_OBJECTIVES) || [];
        const objective = objectives.find(o => o.id === id);
        if (objective) {
            objective.completed = !objective.completed;
            this.set(this.KEYS.WEEKLY_OBJECTIVES, objectives);
        }
    },

    // ============================================
    // SETTINGS METHODS
    // ============================================

    /**
     * Get settings
     * @returns {Object} Settings object
     */
    getSettings() {
        return this.get(this.KEYS.SETTINGS) || {
            workStart: '09:00',
            workEnd: '17:00',
            dailyCapacity: 5,
            pomodoroLength: 25,
            breakLength: 5
        };
    },

    /**
     * Save settings
     * @param {Object} settings - Settings object
     */
    setSettings(settings) {
        const current = this.getSettings();
        this.set(this.KEYS.SETTINGS, { ...current, ...settings });
    },

    /**
     * Get theme preference
     * @returns {string} Theme name ('light' or 'dark')
     */
    getTheme() {
        return this.get(this.KEYS.THEME) || 'light';
    },

    /**
     * Set theme preference
     * @param {string} theme - Theme name
     */
    setTheme(theme) {
        this.set(this.KEYS.THEME, theme);
    },

    // ============================================
    // ANALYTICS METHODS
    // ============================================

    /**
     * Get productivity stats for a date range
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @returns {Object} Stats object
     */
    getProductivityStats(startDate, endDate) {
        const tasks = this.getTasks();
        const habits = this.getHabits();
        const dailyData = this.get(this.KEYS.DAILY_DATA) || {};

        const tasksInRange = tasks.filter(t => t.date >= startDate && t.date <= endDate);
        const completedTasks = tasksInRange.filter(t => t.completed);

        // Calculate habit completion rate
        let habitCompletions = 0;
        let habitPossible = 0;
        
        habits.forEach(habit => {
            habit.completedDates.forEach(date => {
                if (date >= startDate && date <= endDate) {
                    habitCompletions++;
                }
            });
            // Count days in range
            let current = new Date(startDate);
            const end = new Date(endDate);
            while (current <= end) {
                habitPossible++;
                current.setDate(current.getDate() + 1);
            }
        });

        // Calculate average mood
        let totalMood = 0;
        let moodCount = 0;
        Object.keys(dailyData).forEach(date => {
            if (date >= startDate && date <= endDate && dailyData[date].mood) {
                totalMood += dailyData[date].mood;
                moodCount++;
            }
        });

        // Calculate focus time (sum of task durations)
        let focusMinutes = 0;
        completedTasks.forEach(t => {
            focusMinutes += t.duration || 30;
        });

        return {
            totalTasks: tasksInRange.length,
            completedTasks: completedTasks.length,
            completionRate: tasksInRange.length > 0 
                ? Math.round((completedTasks.length / tasksInRange.length) * 100) 
                : 0,
            habitCompletionRate: habitPossible > 0 
                ? Math.round((habitCompletions / habitPossible) * 100) 
                : 0,
            averageMood: moodCount > 0 ? (totalMood / moodCount).toFixed(1) : null,
            focusHours: (focusMinutes / 60).toFixed(1)
        };
    },

    // ============================================
    // EXPORT / IMPORT METHODS
    // ============================================

    /**
     * Export all data as JSON
     * @returns {string} JSON string of all data
     */
    exportData() {
        const data = {};
        Object.keys(this.KEYS).forEach(key => {
            data[key] = this.get(this.KEYS[key]);
        });
        return JSON.stringify(data, null, 2);
    },

    /**
     * Import data from JSON
     * @param {string} jsonString - JSON string of data
     * @returns {boolean} Success status
     */
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            Object.keys(data).forEach(key => {
                if (Object.values(this.KEYS).includes(key)) {
                    this.set(key, data[key]);
                }
            });
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    },

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Generate a unique ID
     * @returns {string} Unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};

// Export for use in other modules
window.Storage = Storage;
