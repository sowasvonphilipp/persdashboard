<template>
  <div class="habits-container">
    <button class="back-btn" @click="navigateTo('/dashboard')">
      <UIcon name="i-heroicons-arrow-left" /> Dashboard
    </button>

    <div class="page-header">
      <h1 class="page-title">
        <UIcon name="i-heroicons-viewfinder-circle" class="title-icon" />
        Gewohnheiten
      </h1>
      <button class="add-btn" @click="showAddHabit = true">
        <UIcon name="i-heroicons-plus" /> Neue Gewohnheit
      </button>
    </div>

    <!-- Stats Bar -->
    <div class="stats-bar">
      <div class="stat-box">
        <div class="stat-val">{{ habits.length }}</div>
        <div class="stat-lbl">Gewohnheiten</div>
      </div>
      <div class="stat-box">
        <div class="stat-val">{{ todayCompleted }}/{{ habits.length }}</div>
        <div class="stat-lbl">Heute erledigt</div>
      </div>
      <div class="stat-box">
        <div class="stat-val">{{ bestStreak }} 🔥</div>
        <div class="stat-lbl">Bester Streak</div>
      </div>
      <div class="stat-box">
        <div class="stat-val">{{ totalCompletions }}</div>
        <div class="stat-lbl">Gesamt</div>
      </div>
    </div>

    <!-- Category Filter -->
    <div class="category-filter">
      <button v-for="cat in categories" :key="cat.id" class="cat-btn" :class="{ active: activeCategory === cat.id }" @click="activeCategory = cat.id">
        <span>{{ cat.emoji }}</span> {{ cat.label }}
      </button>
    </div>

    <!-- Habits List -->
    <div v-if="filteredHabits.length === 0" class="empty-state">
      <UIcon name="i-heroicons-viewfinder-circle" />
      <p>Noch keine Gewohnheiten angelegt</p>
      <button class="add-btn small" @click="showAddHabit = true">
        <UIcon name="i-heroicons-plus" /> Gewohnheit hinzufügen
      </button>
    </div>

    <div v-else class="habits-grid">
      <div v-for="habit in filteredHabits" :key="habit.id" class="habit-card" :style="{ '--accent': habit.color }">
        <div class="habit-header">
          <div class="habit-meta">
            <span class="habit-emoji">{{ habit.icon }}</span>
            <div>
              <h3>{{ habit.name }}</h3>
              <p v-if="habit.description" class="habit-desc">{{ habit.description }}</p>
            </div>
          </div>
          <button class="delete-btn" @click="deleteHabit(habit.id)" title="Löschen">
            <UIcon name="i-heroicons-trash" />
          </button>
        </div>

        <!-- Week Calendar -->
        <div class="week-calendar">
          <div v-for="day in getWeekDays()" :key="day.key" class="day-cell" :class="{ today: day.isToday, completed: isHabitDone(habit.id, day.key) }" @click="toggleHabitDay(habit.id, day.key)">
            <span class="day-name">{{ day.short }}</span>
            <span class="day-num">{{ day.num }}</span>
            <div class="day-check" v-if="isHabitDone(habit.id, day.key)">
              <UIcon name="i-heroicons-check" />
            </div>
          </div>
        </div>

        <!-- Streak & Stats -->
        <div class="habit-stats">
          <div class="streak" :class="{ active: getStreak(habit.id) > 0 }">
            <UIcon name="i-heroicons-flame" /> {{ getStreak(habit.id) }} Tage
          </div>
          <div class="total-done">
            <UIcon name="i-heroicons-check-circle" /> {{ getTotal(habit.id) }}x
          </div>
          <div class="best-streak-info">
            <UIcon name="i-heroicons-trophy" /> {{ getBestStreak(habit.id) }} Best
          </div>
        </div>

        <!-- Heatmap (Last 30 days) -->
        <div class="heatmap">
          <div v-for="d in getLast30Days()" :key="d" class="heat-cell" :class="getHeatLevel(habit.id, d)" :title="d"></div>
        </div>
      </div>
    </div>

    <!-- Add Habit Modal -->
    <div v-if="showAddHabit" class="modal-overlay" @click="showAddHabit = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3><UIcon name="i-heroicons-plus-circle" class="modal-icon" /> Gewohnheit hinzufügen</h3>
          <button class="modal-close" @click="showAddHabit = false"><UIcon name="i-heroicons-x-mark" /></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Name</label>
            <input v-model="newHabit.name" type="text" placeholder="z.B. Sport machen" class="form-input" />
          </div>
          <div class="form-group">
            <label>Beschreibung (optional)</label>
            <input v-model="newHabit.description" type="text" placeholder="z.B. 30 Min joggen" class="form-input" />
          </div>
          <div class="form-group">
            <label>Kategorie</label>
            <div class="cat-select">
              <button v-for="cat in categories.slice(1)" :key="cat.id" class="cat-option" :class="{ selected: newHabit.category === cat.id }" @click="newHabit.category = cat.id">
                {{ cat.emoji }} {{ cat.label }}
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>Icon</label>
            <div class="icon-select">
              <button v-for="icon in habitIcons" :key="icon" class="icon-option" :class="{ selected: newHabit.icon === icon }" @click="newHabit.icon = icon">{{ icon }}</button>
            </div>
          </div>
          <div class="form-group">
            <label>Farbe</label>
            <div class="color-select">
              <button v-for="color in habitColors" :key="color" class="color-option" :class="{ selected: newHabit.color === color }" :style="{ background: color }" @click="newHabit.color = color"></button>
            </div>
          </div>

          <!-- Templates -->
          <div class="templates-section">
            <label>Vorlagen</label>
            <div class="template-grid">
              <button v-for="tmpl in habitTemplates" :key="tmpl.name" class="template-btn" @click="applyTemplate(tmpl)">
                {{ tmpl.icon }} {{ tmpl.name }}
              </button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showAddHabit = false">Abbrechen</button>
          <button class="btn-primary" @click="addHabit"><UIcon name="i-heroicons-check" /> Hinzufügen</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const habits = ref([]);
const habitLog = ref({});
const showAddHabit = ref(false);
const activeCategory = ref('all');

const categories = [
  { id: 'all', label: 'Alle', emoji: '📋' },
  { id: 'health', label: 'Gesundheit', emoji: '💪' },
  { id: 'productivity', label: 'Produktivität', emoji: '⚡' },
  { id: 'mindset', label: 'Mindset', emoji: '🧠' },
  { id: 'social', label: 'Sozial', emoji: '👥' },
  { id: 'learning', label: 'Lernen', emoji: '📚' },
];

const habitIcons = ['💪', '📚', '🧘', '🏃', '💧', '🍎', '😴', '✍️', '🎯', '🧹', '💊', '🎵'];
const habitColors = ['#4facfe', '#10b981', '#a29bfe', '#ff6b6b', '#ffd93d', '#ff9ff3', '#54a0ff', '#ff6348'];

const habitTemplates = [
  { name: 'Sport', icon: '🏃', description: '30 Min Training', category: 'health', color: '#10b981' },
  { name: 'Lesen', icon: '📚', description: '20 Min lesen', category: 'learning', color: '#a29bfe' },
  { name: 'Meditation', icon: '🧘', description: '10 Min meditieren', category: 'mindset', color: '#54a0ff' },
  { name: 'Wasser trinken', icon: '💧', description: '2L Wasser', category: 'health', color: '#4facfe' },
  { name: 'Tagebuch', icon: '✍️', description: 'Tageseintrag schreiben', category: 'mindset', color: '#ffd93d' },
  { name: 'Kein Handy', icon: '📵', description: '1h ohne Handy', category: 'productivity', color: '#ff6b6b' },
];

const newHabit = ref({ name: '', description: '', category: 'health', icon: '💪', color: '#4facfe' });

const filteredHabits = computed(() => {
  if (activeCategory.value === 'all') return habits.value;
  return habits.value.filter(h => h.category === activeCategory.value);
});

const todayCompleted = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  return habits.value.filter(h => habitLog.value[h.id]?.includes(today)).length;
});

const bestStreak = computed(() => Math.max(0, ...habits.value.map(h => getBestStreak(h.id))));
const totalCompletions = computed(() => Object.values(habitLog.value).reduce((sum, arr) => sum + arr.length, 0));

const getWeekDays = () => {
  const days = [];
  const today = new Date();
  const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({ key: d.toISOString().split('T')[0], short: dayNames[d.getDay()], num: d.getDate(), isToday: i === 0 });
  }
  return days;
};

const getLast30Days = () => {
  const days = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
};

const isHabitDone = (habitId, dateKey) => habitLog.value[habitId]?.includes(dateKey) || false;
const getHeatLevel = (habitId, dateKey) => isHabitDone(habitId, dateKey) ? 'heat-done' : 'heat-empty';

const getStreak = (habitId) => {
  const log = habitLog.value[habitId] || [];
  if (log.length === 0) return 0;
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = d.toISOString().split('T')[0];
    if (log.includes(key)) { streak++; d.setDate(d.getDate() - 1); } else break;
  }
  return streak;
};

const getBestStreak = (habitId) => {
  const log = (habitLog.value[habitId] || []).slice().sort();
  if (log.length === 0) return 0;
  let best = 1, current = 1;
  for (let i = 1; i < log.length; i++) {
    const prev = new Date(log[i - 1]);
    const curr = new Date(log[i]);
    const diff = (curr - prev) / (1000 * 60 * 60 * 24);
    if (diff === 1) { current++; best = Math.max(best, current); } else { current = 1; }
  }
  return best;
};

const getTotal = (habitId) => (habitLog.value[habitId] || []).length;

const toggleHabitDay = (habitId, dateKey) => {
  if (!habitLog.value[habitId]) habitLog.value[habitId] = [];
  const idx = habitLog.value[habitId].indexOf(dateKey);
  if (idx > -1) habitLog.value[habitId].splice(idx, 1);
  else habitLog.value[habitId].push(dateKey);
  saveData();
};

const addHabit = () => {
  if (!newHabit.value.name.trim()) return;
  habits.value.push({ id: Date.now().toString(), ...newHabit.value });
  habitLog.value[habits.value[habits.value.length - 1].id] = [];
  saveData();
  showAddHabit.value = false;
  newHabit.value = { name: '', description: '', category: 'health', icon: '💪', color: '#4facfe' };
};

const deleteHabit = (id) => {
  if (!confirm('Gewohnheit löschen?')) return;
  habits.value = habits.value.filter(h => h.id !== id);
  delete habitLog.value[id];
  saveData();
};

const applyTemplate = (tmpl) => {
  newHabit.value = { name: tmpl.name, description: tmpl.description, category: tmpl.category, icon: tmpl.icon, color: tmpl.color };
};

const saveData = () => {
  localStorage.setItem('habits_list', JSON.stringify(habits.value));
  localStorage.setItem('habits_log', JSON.stringify(habitLog.value));
};

const loadData = () => {
  const h = localStorage.getItem('habits_list');
  const l = localStorage.getItem('habits_log');
  if (h) habits.value = JSON.parse(h);
  if (l) habitLog.value = JSON.parse(l);
};

onMounted(loadData);
</script>

<style scoped>
.habits-container { min-height: 100vh; background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 50%, #16213e 100%); padding: 2rem; color: white; }
.back-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.2rem; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; color: rgba(255,255,255,0.8); cursor: pointer; transition: all 0.2s; font-size: 0.9rem; margin-bottom: 2rem; }
.back-btn:hover { background: rgba(255,255,255,0.12); color: white; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
.page-title { display: flex; align-items: center; gap: 0.75rem; font-size: 2.2rem; font-weight: 700; margin: 0; background: linear-gradient(135deg, #fff 0%, #10b981 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.title-icon { width: 2.5rem; height: 2.5rem; }
.add-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border: none; border-radius: 12px; color: white; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.add-btn:hover { box-shadow: 0 8px 25px rgba(79, 172, 254, 0.4); transform: translateY(-2px); }
.add-btn.small { font-size: 0.9rem; padding: 0.6rem 1.2rem; }

.stats-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
.stat-box { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.25rem; text-align: center; }
.stat-val { font-size: 1.5rem; font-weight: 700; color: #4facfe; }
.stat-lbl { color: rgba(255,255,255,0.5); font-size: 0.8rem; margin-top: 0.25rem; }

.category-filter { display: flex; gap: 0.5rem; margin-bottom: 2rem; overflow-x: auto; padding-bottom: 0.5rem; }
.cat-btn { display: flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1rem; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; color: rgba(255,255,255,0.6); cursor: pointer; transition: all 0.2s; white-space: nowrap; font-size: 0.85rem; }
.cat-btn.active { background: rgba(79, 172, 254, 0.15); border-color: #4facfe; color: #4facfe; }

.habits-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 1.5rem; }
.habit-card { background: rgba(26,26,46,0.7); backdrop-filter: blur(20px); border-radius: 18px; padding: 1.5rem; border: 1px solid rgba(255,255,255,0.08); border-left: 4px solid var(--accent); transition: all 0.3s; }
.habit-card:hover { border-color: var(--accent); transform: translateY(-2px); }
.habit-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
.habit-meta { display: flex; gap: 0.75rem; align-items: center; }
.habit-emoji { font-size: 2rem; }
.habit-meta h3 { margin: 0; font-size: 1.1rem; font-weight: 600; }
.habit-desc { margin: 0.15rem 0 0; color: rgba(255,255,255,0.4); font-size: 0.8rem; }
.delete-btn { background: none; border: none; color: rgba(255,255,255,0.2); cursor: pointer; padding: 0.25rem; transition: all 0.2s; }
.delete-btn:hover { color: #ff6b6b; }

.week-calendar { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.4rem; margin-bottom: 1rem; }
.day-cell { display: flex; flex-direction: column; align-items: center; gap: 0.15rem; padding: 0.5rem 0.25rem; background: rgba(255,255,255,0.03); border-radius: 10px; cursor: pointer; transition: all 0.2s; position: relative; }
.day-cell:hover { background: rgba(255,255,255,0.08); }
.day-cell.today { border: 1px solid var(--accent, #4facfe); }
.day-cell.completed { background: var(--accent); }
.day-cell.completed .day-name, .day-cell.completed .day-num { color: white; }
.day-name { font-size: 0.65rem; color: rgba(255,255,255,0.4); text-transform: uppercase; }
.day-num { font-size: 0.85rem; font-weight: 600; color: rgba(255,255,255,0.8); }
.day-check { position: absolute; bottom: 2px; }
.day-check svg { width: 0.7rem; height: 0.7rem; color: white; }

.habit-stats { display: flex; gap: 1rem; margin-bottom: 0.75rem; }
.streak, .total-done, .best-streak-info { display: flex; align-items: center; gap: 0.3rem; font-size: 0.8rem; color: rgba(255,255,255,0.5); }
.streak svg { width: 0.9rem; height: 0.9rem; }
.streak.active { color: #ff6b35; }
.streak.active svg { color: #ff6b35; }

.heatmap { display: flex; gap: 3px; flex-wrap: wrap; }
.heat-cell { width: 12px; height: 12px; border-radius: 3px; background: rgba(255,255,255,0.06); }
.heat-done { background: var(--accent, #4facfe); opacity: 0.8; }

.empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem 2rem; color: rgba(255,255,255,0.4); }
.empty-state svg { width: 4rem; height: 4rem; }

/* Modal */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
.modal-content { background: #1a1a2e; border-radius: 16px; max-width: 550px; width: 100%; max-height: 90vh; overflow-y: auto; border: 1px solid rgba(79,172,254,0.2); }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
.modal-header h3 { display: flex; align-items: center; gap: 0.5rem; margin: 0; font-size: 1.15rem; }
.modal-icon { width: 1.25rem; height: 1.25rem; color: #4facfe; }
.modal-close { width: 2rem; height: 2rem; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white; cursor: pointer; }
.modal-body { padding: 1.5rem; }
.modal-footer { display: flex; gap: 1rem; padding: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1); justify-content: flex-end; }
.form-group { margin-bottom: 1.25rem; }
.form-group label { display: block; color: rgba(255,255,255,0.7); font-size: 0.85rem; margin-bottom: 0.5rem; font-weight: 500; }
.form-input { width: 100%; padding: 0.75rem 1rem; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; color: white; font-size: 0.95rem; outline: none; }
.form-input:focus { border-color: #4facfe; }
.form-input::placeholder { color: rgba(255,255,255,0.3); }

.cat-select, .icon-select, .color-select { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.cat-option { padding: 0.4rem 0.8rem; border-radius: 20px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); cursor: pointer; font-size: 0.8rem; transition: all 0.2s; }
.cat-option.selected { background: rgba(79,172,254,0.15); border-color: #4facfe; color: #4facfe; }
.icon-option { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); cursor: pointer; font-size: 1.2rem; transition: all 0.2s; }
.icon-option.selected { border-color: #4facfe; background: rgba(79,172,254,0.15); }
.color-option { width: 32px; height: 32px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: all 0.2s; }
.color-option.selected { border-color: white; transform: scale(1.2); }

.templates-section { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.08); }
.templates-section label { display: block; color: rgba(255,255,255,0.7); font-size: 0.85rem; margin-bottom: 0.75rem; font-weight: 500; }
.template-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
.template-btn { padding: 0.5rem; border-radius: 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); cursor: pointer; font-size: 0.8rem; transition: all 0.2s; text-align: center; }
.template-btn:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); }

.btn-primary { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 10px; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s; }
.btn-primary:hover { box-shadow: 0 8px 20px rgba(79,172,254,0.4); }
.btn-secondary { padding: 0.75rem 1.5rem; border-radius: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; cursor: pointer; transition: all 0.2s; }

@media (max-width: 768px) {
  .stats-bar { grid-template-columns: repeat(2, 1fr); }
  .habits-grid { grid-template-columns: 1fr; }
  .page-title { font-size: 1.6rem; }
  .template-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
