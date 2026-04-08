// --- Data helpers ---
const HABITS_KEY = 'habits';
const COMPLETIONS_KEY = 'completions';
const TASKS_KEY = 'tasks';
const TRAINING_PLAN_KEY = 'trainingPlan';
const TRAINING_LOG_KEY = 'trainingLog';

function loadHabits() {
    return JSON.parse(localStorage.getItem(HABITS_KEY) || '[]');
}
function saveHabits(habits) {
    localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
}
function loadCompletions() {
    return JSON.parse(localStorage.getItem(COMPLETIONS_KEY) || '{}');
}
function saveCompletions(completions) {
    localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(completions));
}
function loadTrainingPlan() {
    return JSON.parse(localStorage.getItem(TRAINING_PLAN_KEY) || '[]');
}
function saveTrainingPlan(plan) {
    localStorage.setItem(TRAINING_PLAN_KEY, JSON.stringify(plan));
}
function loadTrainingLog() {
    return JSON.parse(localStorage.getItem(TRAINING_LOG_KEY) || '{}');
}
function saveTrainingLog(log) {
    localStorage.setItem(TRAINING_LOG_KEY, JSON.stringify(log));
}
function loadTasks() {
    return JSON.parse(localStorage.getItem(TASKS_KEY) || '[]');
}
function saveTasks(tasks) {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}
function todayStr() {
    return new Date().toISOString().slice(0, 10);
}
function dateStr(d) {
    return d.toISOString().slice(0, 10);
}
function uuid() {
    return crypto.randomUUID();
}

// --- Streak calculation ---
function calcStreak(habitId, completions) {
    let streak = 0;
    const d = new Date();
    // Check if completed today; if not, start from yesterday
    const todayKey = todayStr();
    const todayDone = (completions[todayKey] || []).includes(habitId);
    if (!todayDone) {
        d.setDate(d.getDate() - 1);
    }
    while (true) {
        const key = dateStr(d);
        if ((completions[key] || []).includes(habitId)) {
            streak++;
            d.setDate(d.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
}

function calcLongestStreak(habitId, completions) {
    const dates = Object.keys(completions).filter(k => (completions[k] || []).includes(habitId)).sort();
    if (dates.length === 0) return 0;
    let longest = 1, current = 1;
    for (let i = 1; i < dates.length; i++) {
        const prev = new Date(dates[i - 1]);
        const curr = new Date(dates[i]);
        const diff = (curr - prev) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
            current++;
            longest = Math.max(longest, current);
        } else {
            current = 1;
        }
    }
    return longest;
}

// --- Main app (single page with tabs) ---
function habitApp() {
    return {
        tab: 'today',
        habits: loadHabits(),
        completions: loadCompletions(),
        showAddModal: false,
        showEditModal: false,
        editingId: null,
        form: { name: '', notes: '', color: '#6366f1' },
        colors: ['#6366f1', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'],

        // --- Today ---
        get todayFormatted() {
            return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        },
        get completedToday() {
            const today = todayStr();
            return (this.completions[today] || []).filter(id => this.habits.some(h => h.id === id)).length;
        },
        isCompletedToday(id) {
            return (this.completions[todayStr()] || []).includes(id);
        },
        toggleHabit(id) {
            const today = todayStr();
            if (!this.completions[today]) this.completions[today] = [];
            const idx = this.completions[today].indexOf(id);
            if (idx === -1) {
                this.completions[today].push(id);
            } else {
                this.completions[today].splice(idx, 1);
            }
            saveCompletions(this.completions);
        },
        getStreak(id) {
            return calcStreak(id, this.completions);
        },
        getLongestStreak(id) {
            return calcLongestStreak(id, this.completions);
        },
        addHabit() {
            if (!this.form.name.trim()) return;
            this.habits.push({ id: uuid(), name: this.form.name.trim(), notes: this.form.notes.trim(), color: this.form.color });
            saveHabits(this.habits);
            this.closeModal();
        },
        editHabit(habit) {
            this.editingId = habit.id;
            this.form = { name: habit.name, notes: habit.notes || '', color: habit.color };
            this.showEditModal = true;
        },
        updateHabit() {
            const h = this.habits.find(h => h.id === this.editingId);
            if (h) {
                h.name = this.form.name.trim();
                h.notes = this.form.notes.trim();
                h.color = this.form.color;
                saveHabits(this.habits);
            }
            this.closeModal();
        },
        deleteHabit(id) {
            this.habits = this.habits.filter(h => h.id !== id);
            saveHabits(this.habits);
        },
        closeModal() {
            this.showAddModal = false;
            this.showEditModal = false;
            this.editingId = null;
            this.form = { name: '', notes: '', color: '#6366f1' };
        },

        // --- Tasks ---
        tasks: loadTasks(),
        taskInput: '',
        showCompletedTasks: false,
        get pendingTasks() {
            return this.tasks.filter(t => !t.done);
        },
        get completedTasks() {
            return this.tasks.filter(t => t.done);
        },
        addTask() {
            if (!this.taskInput.trim()) return;
            this.tasks.push({ id: uuid(), name: this.taskInput.trim(), done: false });
            saveTasks(this.tasks);
            this.taskInput = '';
        },
        completeTask(id) {
            const t = this.tasks.find(t => t.id === id);
            if (t) { t.done = true; saveTasks(this.tasks); }
        },
        deleteTask(id) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            saveTasks(this.tasks);
        },
        clearCompletedTasks() {
            this.tasks = this.tasks.filter(t => !t.done);
            saveTasks(this.tasks);
        },

        // --- Training ---
        trainingPlan: loadTrainingPlan(),
        trainingLog: loadTrainingLog(),
        selectedDay: '',
        showImportModal: false,
        importData: '',
        showAddExerciseModal: false,
        exerciseForm: { day: '', exercise: '', sets: '', reps: '', weight: '', rest: '', notes: '' },
        init() {
            // Auto-select first training day on load
            if (this.trainingDays.length > 0 && !this.selectedDay) {
                this.selectedDay = this.trainingDays[0];
            }
        },
        get currentDayName() {
            return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        },
        get trainingDays() {
            const days = [...new Set(this.trainingPlan.map(e => e.day))];
            return days; // keep original order from import
        },
        get dayExercises() {
            return this.trainingPlan.filter(e => e.day === this.selectedDay);
        },
        get dayDoneCount() {
            return this.dayExercises.filter(e => this.isExerciseDone(e.id)).length;
        },
        importPlan() {
            const lines = this.importData.trim().split('\n').filter(l => l.trim());
            const plan = [];
            let currentDay = '';
            // Rows to skip (warmup, cooldown, headers, meta — multilingual)
            const skipWords = ['разминка', 'заминка', 'мфр', 'обратная связь', 'упражнение',
                               'эллипс', 'интервальное', 'кардио', 'warmup', 'warm-up',
                               'cooldown', 'cool-down', 'cardio', 'feedback', 'exercise'];

            for (const line of lines) {
                const parts = line.split('\t').map(p => p.trim());
                const first = (parts[0] || '').toLowerCase();

                // Skip empty or meta rows
                if (!first || skipWords.some(w => first.includes(w))) continue;

                // Detect day header: "N день..." (Russian) or "Day N..." (English)
                // or any row where second column is not a number (not an exercise row)
                const secondCol = parts[1] || '';
                const isExerciseRow = parts.length >= 3 && !isNaN(parseInt(secondCol));

                if (!isExerciseRow) {
                    // Treat as day header if it has text content
                    if (first.length > 1) {
                        currentDay = parts[0].trim();
                    }
                    continue;
                }

                if (!currentDay) continue;

                // Parse: Exercise | Sets | Reps | Rest | Tempo | Weight | Notes
                const sets = parseInt(secondCol);
                const reps = parts[2] || '';

                plan.push({
                    id: uuid(),
                    day: currentDay,
                    exercise: parts[0].trim(),
                    sets: String(sets),
                    reps: reps,
                    rest: parts[3] || '',
                    tempo: parts[4] || '',
                    weight: parts[5] || '',
                    notes: parts[6] || ''
                });
            }
            if (plan.length > 0) {
                this.trainingPlan = plan;
                saveTrainingPlan(plan);
                this.showImportModal = false;
                this.importData = '';
                this.selectedDay = this.trainingDays[0];
            }
        },
        addExercise() {
            const f = this.exerciseForm;
            if (!f.exercise.trim() || !f.sets || !f.reps) return;
            const day = f.day.trim() || this.selectedDay || 'Day 1';
            this.trainingPlan.push({
                id: uuid(),
                day: day,
                exercise: f.exercise.trim(),
                sets: String(f.sets),
                reps: f.reps.trim(),
                rest: f.rest.trim(),
                tempo: '',
                weight: f.weight.trim(),
                notes: f.notes.trim()
            });
            saveTrainingPlan(this.trainingPlan);
            this.selectedDay = day;
            this.showAddExerciseModal = false;
            this.exerciseForm = { day: '', exercise: '', sets: '', reps: '', weight: '', rest: '', notes: '' };
        },
        deleteExercise(exId) {
            this.trainingPlan = this.trainingPlan.filter(e => e.id !== exId);
            saveTrainingPlan(this.trainingPlan);
        },
        setKey(exId, setNum) {
            return todayStr() + ':' + exId + ':s' + setNum;
        },
        getSetWeight(exId, setNum) {
            const entry = this.trainingLog[this.setKey(exId, setNum)];
            return entry ? entry.weight : '';
        },
        getSetReps(exId, setNum) {
            const entry = this.trainingLog[this.setKey(exId, setNum)];
            return entry ? entry.reps : '';
        },
        isSetDone(exId, setNum) {
            const entry = this.trainingLog[this.setKey(exId, setNum)];
            return entry && entry.done;
        },
        logSet(exId, setNum, field, value) {
            const key = this.setKey(exId, setNum);
            if (!this.trainingLog[key]) this.trainingLog[key] = {};
            this.trainingLog[key][field] = value;
            saveTrainingLog(this.trainingLog);
        },
        clearSet(exId, setNum) {
            const ex = this.trainingPlan.find(e => e.id === exId);
            if (!ex) return;
            const totalSets = parseInt(ex.sets) || 0;
            if (totalSets <= 1) return; // don't delete the last set

            // Remove log for the deleted set
            const delKey = this.setKey(exId, setNum);
            delete this.trainingLog[delKey];

            // Shift down logs for sets above the deleted one
            for (let s = setNum + 1; s <= totalSets; s++) {
                const oldKey = this.setKey(exId, s);
                const newKey = this.setKey(exId, s - 1);
                if (this.trainingLog[oldKey]) {
                    this.trainingLog[newKey] = this.trainingLog[oldKey];
                    delete this.trainingLog[oldKey];
                } else {
                    delete this.trainingLog[newKey];
                }
            }
            // Remove the last set key (now shifted)
            delete this.trainingLog[this.setKey(exId, totalSets)];

            // Reduce set count
            ex.sets = String(totalSets - 1);
            saveTrainingPlan(this.trainingPlan);
            saveTrainingLog(this.trainingLog);
        },
        toggleSetDone(exId, setNum) {
            const key = this.setKey(exId, setNum);
            if (!this.trainingLog[key]) this.trainingLog[key] = {};
            this.trainingLog[key].done = !this.trainingLog[key].done;
            saveTrainingLog(this.trainingLog);
        },
        isExerciseDone(exId) {
            const totalSets = parseInt(this.trainingPlan.find(e => e.id === exId)?.sets) || 0;
            if (totalSets === 0) return false;
            for (let s = 1; s <= totalSets; s++) {
                if (!this.isSetDone(exId, s)) return false;
            }
            return true;
        },
        toggleExerciseDone(exId) {
            const totalSets = parseInt(this.trainingPlan.find(e => e.id === exId)?.sets) || 0;
            const allDone = this.isExerciseDone(exId);
            for (let s = 1; s <= totalSets; s++) {
                const key = this.setKey(exId, s);
                if (!this.trainingLog[key]) this.trainingLog[key] = {};
                this.trainingLog[key].done = !allDone;
            }
            saveTrainingLog(this.trainingLog);
        },

        // --- Stats ---
        get bestStreak() {
            if (this.habits.length === 0) return 0;
            return Math.max(...this.habits.map(h => calcLongestStreak(h.id, this.completions)));
        },
        get completionRate() {
            if (this.habits.length === 0) return 0;
            const now = new Date();
            let total = 0, done = 0;
            for (let i = 0; i < 7; i++) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const key = dateStr(d);
                total += this.habits.length;
                done += (this.completions[key] || []).filter(id => this.habits.some(h => h.id === id)).length;
            }
            return total ? Math.round(done / total * 100) : 0;
        },
        get heatmapDays() {
            const days = [];
            const now = new Date();
            for (let i = 111; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const key = dateStr(d);
                const completed = (this.completions[key] || []).filter(id => this.habits.some(h => h.id === id)).length;
                const total = this.habits.length || 1;
                days.push({ date: key, completed, total, ratio: completed / total });
            }
            return days;
        },
        heatmapColor(ratio) {
            if (ratio === 0) return 'bg-gray-200 dark:bg-gray-700';
            if (ratio < 0.34) return 'bg-green-200 dark:bg-green-900';
            if (ratio < 0.67) return 'bg-green-400 dark:bg-green-700';
            return 'bg-green-600 dark:bg-green-500';
        },

        // --- Training stats ---
        _workoutDates() {
            // Find all dates where at least one set was marked done
            const dates = new Set();
            for (const key of Object.keys(this.trainingLog)) {
                if (this.trainingLog[key].done) {
                    const date = key.split(':')[0];
                    dates.add(date);
                }
            }
            return [...dates].sort().reverse();
        },
        get workoutsThisWeek() {
            const now = new Date();
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return this._workoutDates().filter(d => d >= dateStr(weekAgo)).length;
        },
        get workoutsThisMonth() {
            const now = new Date();
            const monthAgo = new Date(now);
            monthAgo.setDate(monthAgo.getDate() - 30);
            return this._workoutDates().filter(d => d >= dateStr(monthAgo)).length;
        },
        get totalVolume() {
            // Total weight x reps for the last 7 days
            const now = new Date();
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            const weekAgoStr = dateStr(weekAgo);
            let vol = 0;
            for (const [key, entry] of Object.entries(this.trainingLog)) {
                const date = key.split(':')[0];
                if (date >= weekAgoStr && entry.done && entry.weight && entry.reps) {
                    const w = parseFloat(entry.weight) || 0;
                    const r = parseInt(entry.reps) || 0;
                    vol += w * r;
                }
            }
            return vol >= 1000 ? Math.round(vol / 1000) + 'k' : Math.round(vol);
        },
        get personalRecords() {
            // Highest weight per exercise across all time
            const prs = {};
            for (const [key, entry] of Object.entries(this.trainingLog)) {
                if (!entry.done || !entry.weight) continue;
                const parts = key.split(':');
                const exId = parts[1];
                const w = parseFloat(entry.weight) || 0;
                const r = entry.reps || '?';
                const ex = this.trainingPlan.find(e => e.id === exId);
                if (!ex) continue;
                const name = ex.exercise;
                if (!prs[name] || w > prs[name].weight) {
                    prs[name] = { exercise: name, weight: w, reps: r };
                }
            }
            return Object.values(prs).sort((a, b) => b.weight - a.weight);
        },
        get recentWorkouts() {
            const dates = this._workoutDates().slice(0, 7);
            return dates.map(date => {
                const exerciseIds = new Set();
                let setCount = 0;
                for (const [key, entry] of Object.entries(this.trainingLog)) {
                    if (key.startsWith(date + ':') && entry.done) {
                        const exId = key.split(':')[1];
                        exerciseIds.add(exId);
                        setCount++;
                    }
                }
                return { date, exercises: exerciseIds.size, sets: setCount };
            });
        }
    };
}
