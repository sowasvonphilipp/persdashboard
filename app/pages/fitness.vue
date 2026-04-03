<template>
  <div class="fitness-container">
    <div class="top-bar">
      <button class="back-btn" @click="navigateTo('/dashboard')"><UIcon name="i-heroicons-arrow-left" /> Dashboard</button>
      <div class="top-actions">
        <button class="action-btn" @click="showImport = true"><UIcon name="i-heroicons-arrow-up-tray" /> Import</button>
        <button class="add-btn" @click="showAddEx = true"><UIcon name="i-heroicons-plus" /> Neue Übung</button>
      </div>
    </div>
    
    <h1 class="page-title"><UIcon name="i-heroicons-fire" class="title-icon" />Fitness Tracker</h1>
    <p class="page-subtitle">Tracke deine Übungen & dein Körpergewicht</p>

    <!-- Tabs -->
    <div class="tabs">
      <button :class="{ active: tab === 'exercises' }" @click="tab = 'exercises'"><UIcon name="i-heroicons-list-bullet" /> Übungen</button>
      <button :class="{ active: tab === 'weight' }" @click="tab = 'weight'"><UIcon name="i-heroicons-scale" /> Körpergewicht</button>
    </div>

    <!-- EXERCISES TAB -->
    <div v-if="tab === 'exercises'" class="tab-content">
      <div v-if="exercises.length === 0" class="empty">
        <UIcon name="i-heroicons-fire" />
        <p>Noch keine Übungen angelegt</p>
        <button class="add-btn sm" @click="showAddEx = true"><UIcon name="i-heroicons-plus" /> Erste Übung anlegen</button>
      </div>

      <div v-else class="ex-grid">
        <div v-for="ex in exercises" :key="ex.id" class="ex-card">
          <div class="ex-header">
            <h3>{{ ex.name }}</h3>
            <button class="ex-del-btn" @click="deleteExercise(ex.id)"><UIcon name="i-heroicons-trash" /></button>
          </div>

          <!-- Expected vs Actual -->
          <div class="ex-compare">
            <div class="ex-compare-col">
              <div class="ex-compare-label">Erwartet</div>
              <div class="ex-compare-val">{{ ex.goal }} <span class="ex-unit">{{ ex.unit || 'kg' }}</span></div>
            </div>
            <div class="ex-compare-divider"></div>
            <div class="ex-compare-col actual">
              <div class="ex-compare-label">Aktuell</div>
              <div class="ex-compare-val" :class="ex.logs.length > 0 ? (getLatestActual(ex) >= ex.goal ? 'text-green' : 'text-yellow') : 'text-muted'">
                {{ ex.logs.length > 0 ? getLatestActual(ex) : '–' }} <span class="ex-unit" v-if="ex.logs.length > 0">{{ ex.unit || 'kg' }}</span>
              </div>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="ex-progress-wrap" v-if="ex.goal">
            <div class="ex-progress-bar">
              <div class="ex-progress-fill" :style="{ width: Math.min(100, (getLatestActual(ex) / ex.goal) * 100) + '%' }"></div>
            </div>
            <span class="ex-progress-pct">{{ ex.logs.length > 0 ? Math.round(Math.min(100, (getLatestActual(ex) / ex.goal) * 100)) : 0 }}%</span>
          </div>

          <!-- Streak & Stats -->
          <div class="ex-stats-row">
            <div class="ex-stat" v-if="getExStreak(ex) > 0">
              🔥 <strong>{{ getExStreak(ex) }}d</strong> <span>Streak</span>
            </div>
            <div class="ex-stat">
              📊 <strong>{{ ex.logs.length }}</strong> <span>Einheiten</span>
            </div>
            <div class="ex-stat" v-if="getBestActual(ex) > 0">
              🏆 <strong>{{ getBestActual(ex) }}</strong> <span>Best</span>
            </div>
          </div>

          <!-- Last 7 Workouts Mini -->
          <div class="ex-mini-history" v-if="ex.logs.length > 0">
            <div v-for="l in ex.logs.slice().reverse().slice(0, 5)" :key="l.id" class="ex-mini-row">
              <span class="ex-mini-date">{{ formatDateShort(l.date) }}</span>
              <div class="ex-mini-bar-wrap">
                <div class="ex-mini-bar" :style="{ width: Math.min(100, (l.actual / (ex.goal || 1)) * 100) + '%' }"></div>
              </div>
              <span class="ex-mini-val">{{ l.actual }}</span>
            </div>
          </div>

          <div class="ex-actions">
            <button class="log-btn" @click="openLogModal(ex.id)"><UIcon name="i-heroicons-plus-circle" /> Eintrag</button>
            <button class="hist-btn" @click="openHistoryModal(ex)"><UIcon name="i-heroicons-chart-bar" /> Verlauf</button>
          </div>
        </div>
      </div>
    </div>

    <!-- WEIGHT TAB -->
    <div v-if="tab === 'weight'" class="tab-content">
      <div class="weight-log-form">
        <input v-model.number="newWeight" type="number" step="0.1" placeholder="Gewicht (kg)" class="finput" />
        <input v-model="newWeightDate" type="date" class="finput" />
        <button class="add-btn sm" @click="addWeight"><UIcon name="i-heroicons-plus" /> Eintragen</button>
      </div>
      
      <div class="weight-target">
        <label>Zielgewicht:</label>
        <input v-model.number="targetWeight" type="number" step="0.1" class="finput sm" @change="saveWeight" />
      </div>

      <div v-if="weightLog.length > 1" class="weight-chart">
        <h3 class="section-title">Gewichtsverlauf</h3>
        <div class="weight-graph">
          <div v-for="(w, i) in weightLog.slice(-30)" :key="i" class="wg-col" :title="`${w.date}: ${w.weight}kg`">
            <div class="wg-bar" :style="{ height: getWeightBarHeight(w.weight) + '%' }"></div>
            <span class="wg-val" v-if="i % 5 === 0 || i === weightLog.slice(-30).length - 1">{{ w.weight }}</span>
          </div>
        </div>
      </div>

      <div class="weight-stats" v-if="weightLog.length">
        <div class="ws-item"><span>Aktuell</span><strong>{{ weightLog[weightLog.length - 1].weight }} kg</strong></div>
        <div class="ws-item" v-if="weightLog.length > 1"><span>Veränderung</span><strong :class="weightDiff > 0 ? 'text-red' : 'text-green'">{{ weightDiff > 0 ? '+' : '' }}{{ weightDiff }} kg</strong></div>
        <div class="ws-item" v-if="targetWeight"><span>Ziel</span><strong>{{ targetWeight }} kg</strong></div>
      </div>
      
      <div v-if="weightLog.length" class="weight-history">
        <h3 class="section-title">Letzte Einträge</h3>
        <div v-for="w in weightLog.slice().reverse().slice(0, 10)" :key="w.date" class="wh-item">
          <span>{{ w.date }}</span>
          <div style="display:flex;gap:1rem;align-items:center;">
             <span>{{ w.weight }} kg</span>
             <button class="ex-del-btn" @click="deleteWeight(w.date)"><UIcon name="i-heroicons-trash" /></button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: ADD EXERCISE -->
    <div v-if="showAddEx" class="modal-overlay" @click="showAddEx = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header"><h3><UIcon name="i-heroicons-plus-circle" class="mi" /> Neue Übung anlegen</h3><button class="modal-close" @click="showAddEx = false"><UIcon name="i-heroicons-x-mark" /></button></div>
        <div class="modal-body">
          <div class="fg"><label>Name der Übung</label><input v-model="newEx.name" type="text" placeholder="z.B. Kniebeugen, Bankdrücken..." class="finput" /></div>
          <div class="fg2">
            <div class="fg"><label>Zielwert (Goal)</label><input v-model.number="newEx.goal" type="number" step="0.5" class="finput" /></div>
            <div class="fg"><label>Einheit</label><input v-model="newEx.unit" type="text" placeholder="kg, reps, sec..." class="finput" /></div>
          </div>
        </div>
        <div class="modal-footer"><button class="btn-secondary" @click="showAddEx = false">Abbrechen</button><button class="btn-primary" @click="addExercise" :disabled="!newEx.name.trim()"><UIcon name="i-heroicons-check" /> Anlegen</button></div>
      </div>
    </div>

    <!-- MODAL: LOG ENTRY -->
    <div v-if="loggingExId" class="modal-overlay" @click="loggingExId = null">
      <div class="modal-content" @click.stop>
        <div class="modal-header"><h3><UIcon name="i-heroicons-pencil" class="mi" /> Eintrag hinzufügen</h3><button class="modal-close" @click="loggingExId = null"><UIcon name="i-heroicons-x-mark" /></button></div>
        <div class="modal-body">
          <div class="fg"><label>Datum</label><input v-model="newLog.date" type="date" class="finput" /></div>
          <div class="fg"><label>Ist-Wert (Actual)</label><input v-model.number="newLog.actual" type="number" step="0.5" class="finput" /></div>
        </div>
        <div class="modal-footer"><button class="btn-secondary" @click="loggingExId = null">Abbrechen</button><button class="btn-primary" @click="saveLogEntry"><UIcon name="i-heroicons-check" /> Speichern</button></div>
      </div>
    </div>

    <!-- MODAL: HISTORY -->
    <div v-if="viewHistoryEx" class="modal-overlay" @click="viewHistoryEx = null">
      <div class="modal-content" @click.stop>
        <div class="modal-header"><h3><UIcon name="i-heroicons-chart-bar" class="mi" /> Verlauf: {{ viewHistoryEx.name }}</h3><button class="modal-close" @click="viewHistoryEx = null"><UIcon name="i-heroicons-x-mark" /></button></div>
        <div class="modal-body">
          <div class="goal-stats-row">
            <div class="gs-box"><span>Ziel</span><strong>{{ viewHistoryEx.goal }} {{ viewHistoryEx.unit }}</strong></div>
            <div class="gs-box"><span>Bestleistung</span><strong class="text-green">{{ getBestActual(viewHistoryEx) }} {{ viewHistoryEx.unit }}</strong></div>
          </div>
          
          <div v-if="viewHistoryEx.logs.length === 0" class="text-muted" style="text-align:center;padding:2rem 0;">Noch keine Einträge</div>
          <div v-else class="hist-list">
            <div v-for="l in viewHistoryEx.logs.slice().reverse()" :key="l.id" class="hist-list-item">
              <span class="hl-date">{{ formatDate(l.date) }}</span>
              <span class="hl-val">{{ l.actual }} {{ viewHistoryEx.unit }}</span>
              <button class="ex-del-btn" @click="deleteExLog(viewHistoryEx.id, l.id)"><UIcon name="i-heroicons-trash" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- IMPORT MODAL -->
    <div v-if="showImport" class="modal-overlay" @click="showImport = false">
      <div class="modal-content modal-lg" @click.stop>
        <div class="modal-header"><h3><UIcon name="i-heroicons-arrow-up-tray" class="mi" /> JSON Trainingsplan Import</h3><button class="modal-close" @click="showImport = false"><UIcon name="i-heroicons-x-mark" /></button></div>
        <div class="modal-body">
          <div class="import-info">
            <p>Mache einen Screenshot von deinem Trainings-Log oder Trainingsplan und frage Gemini nach diesem JSON-Format.</p>
            <button class="copy-template-btn" @click="copyTemplate"><UIcon name="i-heroicons-clipboard-document" /> Gemini-Vorlage kopieren</button>
          </div>
          <div class="fg">
            <label>JSON einfügen</label>
            <textarea v-model="importJson" class="finput json-input" rows="8" placeholder='[{"name":"Kniebeuge","actual":85,"date":"2026-03-28"}]'></textarea>
          </div>
          <p v-if="importError" class="err-msg">{{ importError }}</p>
          <p v-if="importSuccess" class="success-msg">{{ importSuccess }}</p>
        </div>
        <div class="modal-footer"><button class="btn-secondary" @click="showImport = false">Schließen</button><button class="btn-primary" @click="importExercises"><UIcon name="i-heroicons-arrow-up-tray" /> Importieren</button></div>
      </div>
    </div>

  </div>
</template>

<script setup>
const router = useRouter();

const tab = ref('exercises');

// Data State
const exercises = ref([]);
const weightLog = ref([]);
const targetWeight = ref(null);

// UI State
const showAddEx = ref(false);
const loggingExId = ref(null);
const viewHistoryEx = ref(null);
const showImport = ref(false);

const importJson = ref('');
const importError = ref('');
const importSuccess = ref('');

// Forms
const todayStr = computed(() => new Date().toISOString().split('T')[0]);
const newEx = ref({ name: '', goal: 100, unit: 'kg' });
const newLog = ref({ date: todayStr.value, actual: 0 });

const newWeight = ref(null);
const newWeightDate = ref(todayStr.value);

// Derived Weight Data
const weightDiff = computed(() => {
  if (weightLog.value.length < 2) return 0;
  return (weightLog.value[weightLog.value.length - 1].weight - weightLog.value[0].weight).toFixed(1);
});
const getWeightBarHeight = (w) => {
  const vals = weightLog.value.map(x => x.weight);
  const min = Math.min(...vals) - 2; 
  const max = Math.max(...vals) + 2;
  return ((w - min) / (max - min)) * 100;
};

// Utilities
const formatDate = (ds) => new Date(ds).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year:'numeric' });
const formatDateShort = (ds) => new Date(ds).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

const getLatestActual = (ex) => {
  if (!ex.logs || ex.logs.length === 0) return 0;
  return ex.logs[ex.logs.length - 1].actual;
};

const getBestActual = (ex) => {
  if (!ex.logs || ex.logs.length === 0) return 0;
  return Math.max(...ex.logs.map(l => l.actual));
};

const getExStreak = (ex) => {
  if (!ex.logs || ex.logs.length === 0) return 0;
  const dates = new Set(ex.logs.map(l => l.date));
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = d.toISOString().split('T')[0];
    if (dates.has(key)) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
};

// Actions
const addExercise = () => {
  if (!newEx.value.name.trim()) return;
  exercises.value.push({
    id: Date.now().toString(),
    name: newEx.value.name.trim(),
    goal: newEx.value.goal,
    unit: newEx.value.unit || 'kg',
    logs: []
  });
  saveEx();
  showAddEx.value = false;
  newEx.value = { name: '', goal: 100, unit: 'kg' };
};

const deleteExercise = (id) => {
  if(confirm('Übung inkl. aller Einträge löschen?')) {
    exercises.value = exercises.value.filter(e => e.id !== id);
    saveEx();
  }
};

const openLogModal = (id) => {
  loggingExId.value = id;
  newLog.value = { date: todayStr.value, actual: 0 };
};

const saveLogEntry = () => {
  if (!newLog.value.actual) return;
  const ex = exercises.value.find(e => e.id === loggingExId.value);
  if (ex) {
    if (!ex.logs) ex.logs = [];
    ex.logs.push({
      id: Date.now().toString(),
      date: newLog.value.date,
      actual: newLog.value.actual
    });
    // Sort logs by date mapping to append correctly
    ex.logs.sort((a,b) => a.date.localeCompare(b.date));
    saveEx();
  }
  loggingExId.value = null;
};

const openHistoryModal = (ex) => {
  viewHistoryEx.value = ex;
};

const deleteExLog = (exId, logId) => {
  const ex = exercises.value.find(e => e.id === exId);
  if (ex) {
    ex.logs = ex.logs.filter(l => l.id !== logId);
    saveEx();
  }
};

const addWeight = () => {
  if (!newWeight.value) return;
  const existing = weightLog.value.findIndex(w => w.date === newWeightDate.value);
  if (existing > -1) weightLog.value[existing].weight = newWeight.value;
  else weightLog.value.push({ date: newWeightDate.value, weight: newWeight.value });
  weightLog.value.sort((a, b) => a.date.localeCompare(b.date));
  newWeight.value = null; 
  saveWeight();
};

const deleteWeight = (date) => {
  weightLog.value = weightLog.value.filter(w => w.date !== date);
  saveWeight();
};

const copyTemplate = () => {
  const template = `Bitte konvertiere meinen Trainingsplan/Workout-Log aus dem Screenshot in folgendes JSON-Format. Jede Übung braucht:
- "name": Name der Übung (z.B. Kniebeuge)
- "actual": Erreichtes Gewicht oder Anzahl als Zahl (z.B. 85.5)
- "date": Datum der Trainingseinheit in YYYY-MM-DD (Wenn im Screenshot kein Datum steht, nutze das heutige Datum)

Beispiel:
[
  {"name":"Bankdrücken", "actual":60, "date":"2026-03-28"},
  {"name":"Kniebeuge", "actual":80, "date":"2026-03-28"}
]

Hier ist mein Screenshot:`;
  navigator.clipboard.writeText(template);
  alert('Vorlage kopiert! Füge sie in Gemini zusammen mit deinem Screenshot ein.');
};

const importExercises = () => {
  importError.value = ''; importSuccess.value = '';
  try {
    const data = JSON.parse(importJson.value);
    if (!Array.isArray(data)) throw new Error('Muss ein JSON-Array sein');
    let count = 0;
    
    data.forEach(item => {
      if (item.name && item.actual && item.date) {
        // Find existing exercise or create it implicitly
        let ex = exercises.value.find(e => e.name.toLowerCase() === item.name.toLowerCase());
        if (!ex) {
           ex = { id: Date.now().toString() + Math.random(), name: item.name, goal: item.actual * 1.5, unit: 'kg', logs: [] };
           exercises.value.push(ex);
        }
        
        // Prevent pure duplicate dates
        const existingLog = ex.logs.find(l => l.date === item.date);
        if (existingLog) {
            existingLog.actual = Math.max(existingLog.actual, item.actual); // Keep max
        } else {
            ex.logs.push({ id: Date.now().toString() + Math.random(), date: item.date, actual: item.actual });
            ex.logs.sort((a,b) => a.date.localeCompare(b.date));
        }
        count++;
      }
    });
    saveEx(); 
    importSuccess.value = `${count} Trainingseinträge erfolgreich importiert!`; 
    importJson.value = '';
  } catch (e) { 
    importError.value = 'Ungültiges JSON-Format. Prüfe die Datei.'; 
    console.error(e);
  }
};

const saveEx = () => localStorage.setItem('fitness_exercises_v2', JSON.stringify(exercises.value));
const saveWeight = () => {
  localStorage.setItem('fitness_weight_v2', JSON.stringify(weightLog.value));
  localStorage.setItem('fitness_targetWeight', targetWeight.value || '');
};

const load = () => {
  const ev2 = localStorage.getItem('fitness_exercises_v2'); 
  if (ev2) exercises.value = JSON.parse(ev2);
  
  const wv2 = localStorage.getItem('fitness_weight_v2') || localStorage.getItem('fitness_weight'); 
  if (wv2) weightLog.value = JSON.parse(wv2);
  
  const tw = localStorage.getItem('fitness_targetWeight');
  if (tw) targetWeight.value = parseFloat(tw);
};

onMounted(load);
</script>

<style scoped>
.fitness-container { min-height:100vh; background:linear-gradient(135deg,#0f0f1e 0%,#1a1a2e 50%,#16213e 100%); padding:2rem; color:white; }
.top-bar { display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; }
.top-actions { display:flex; gap:0.5rem; }
.back-btn, .action-btn { display:inline-flex; align-items:center; gap:0.5rem; padding:0.6rem 1.2rem; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:12px; color:rgba(255,255,255,0.8); cursor:pointer; font-size:0.9rem; }
.back-btn:hover, .action-btn:hover { background:rgba(255,255,255,0.12); color:white; }
.add-btn { display:inline-flex; align-items:center; gap:0.5rem; padding:0.6rem 1.2rem; background:linear-gradient(135deg,#10b981,#34d399); border:none; border-radius:12px; color:white; font-weight:600; cursor:pointer; font-size:0.9rem; }
.add-btn:hover { box-shadow:0 8px 25px rgba(16,185,129,0.4); }
.add-btn.sm { font-size:0.85rem; padding:0.5rem 1rem; }
.page-title { display:flex; align-items:center; gap:0.75rem; font-size:2.2rem; font-weight:700; margin:0 0 0.5rem; background:linear-gradient(135deg,#fff,#10b981); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
.title-icon { width:2.5rem; height:2.5rem; }
.page-subtitle { color:rgba(255,255,255,0.5); margin:0 0 2rem; }

.tabs { display:flex; gap:0.4rem; margin-bottom:1.5rem; background:rgba(255,255,255,0.04); border-radius:12px; padding:4px; }
.tabs button { flex:1; display:flex; align-items:center; justify-content:center; gap:0.4rem; padding:0.65rem; border-radius:10px; background:none; border:none; color:rgba(255,255,255,0.5); cursor:pointer; font-size:0.85rem; transition:all 0.2s; }
.tabs button.active { background:rgba(16,185,129,0.2); color:#10b981; }
.tab-content { animation:fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
.section-title { font-size:1rem; font-weight:600; margin:0 0 1rem; color:rgba(255,255,255,0.8); }

/* EXERCISES */
.ex-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:1.25rem; }
.ex-card { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:1.25rem; }
.ex-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:0.75rem; }
.ex-header h3 { margin:0; font-size:1.1rem; color:#10b981; }
.ex-del-btn { background:none; border:none; color:rgba(255,255,255,0.15); cursor:pointer; padding:4px; transition:color 0.2s; }
.ex-del-btn:hover { color:#ff6b6b; }

.ex-compare { display:flex; align-items:center; gap:0; margin:0.75rem 0; background:rgba(255,255,255,0.04); border-radius:10px; overflow:hidden; }
.ex-compare-col { flex:1; padding:0.65rem 1rem; text-align:center; }
.ex-compare-col.actual { background:rgba(16,185,129,0.05); }
.ex-compare-divider { width:1px; background:rgba(255,255,255,0.08); align-self:stretch; }
.ex-compare-label { font-size:0.68rem; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.2rem; }
.ex-compare-val { font-size:1.1rem; font-weight:700; }
.ex-unit { font-size:0.75rem; color:rgba(255,255,255,0.5); font-weight:400; }
.text-yellow { color:#ffd93d; }
.text-green { color:#10b981; }
.text-red { color:#ff6b6b; }
.text-muted { color:rgba(255,255,255,0.3); font-size:0.8rem; font-style:italic; }

.ex-progress-wrap { display:flex; align-items:center; gap:0.5rem; margin:0 0 0.75rem; }
.ex-progress-bar { flex:1; height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden; }
.ex-progress-fill { height:100%; background:linear-gradient(90deg,#4facfe,#10b981); transition:width 0.5s; width:0%; }
.ex-progress-pct { font-size:0.72rem; color:rgba(255,255,255,0.5); min-width:30px; text-align:right; }

.ex-stats-row { display:flex; gap:0.75rem; margin-bottom:0.75rem; }
.ex-stat { display:flex; align-items:center; gap:0.3rem; font-size:0.78rem; color:rgba(255,255,255,0.5); }
.ex-stat strong { color:white; }

.ex-mini-history { margin-bottom:0.75rem; display:flex; flex-direction:column; gap:0.25rem; }
.ex-mini-row { display:flex; align-items:center; gap:0.5rem; font-size:0.72rem; }
.ex-mini-date { color:rgba(255,255,255,0.35); min-width:36px; }
.ex-mini-bar-wrap { flex:1; height:4px; background:rgba(255,255,255,0.06); border-radius:2px; overflow:hidden; }
.ex-mini-bar { height:100%; background:#10b981; border-radius:2px; transition:width 0.3s; }
.ex-mini-val { color:rgba(255,255,255,0.6); min-width:28px; text-align:right; }

.ex-goal-section, .ex-latest { display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:0.4rem; }
.ex-lbl { color:rgba(255,255,255,0.5); }
.ex-val { font-weight:600; }

.ex-actions { display:flex; gap:0.5rem; margin-top:0.5rem; }
.log-btn, .hist-btn { flex:1; display:flex; align-items:center; justify-content:center; gap:0.4rem; padding:0.5rem; border-radius:8px; font-size:0.8rem; cursor:pointer; border:1px solid transparent; background:rgba(255,255,255,0.05); color:#fff; transition:all 0.2s;}
.log-btn { border-color:rgba(16,185,129,0.3); color:#10b981; }
.log-btn:hover { background:rgba(16,185,129,0.1); }
.hist-btn:hover { background:rgba(255,255,255,0.1); }

/* Weight */
.weight-log-form { display:flex; gap:0.5rem; margin-bottom:1.5rem; align-items:center; }
.weight-log-form .finput { flex:1; }
.weight-graph { display:flex; gap:3px; align-items:flex-end; height:120px; }
.wg-col { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%; }
.wg-bar { width:100%; background:linear-gradient(to top,#10b981,#34d399); border-radius:3px 3px 0 0; min-height:4px; }
.wg-val { font-size:0.55rem; color:rgba(255,255,255,0.4); margin-top:2px; }
.weight-stats { display:flex; gap:1.5rem; margin:1.5rem 0; }
.ws-item { display:flex; flex-direction:column; font-size:0.85rem; }
.ws-item span { color:rgba(255,255,255,0.4); font-size:0.75rem; }
.ws-item strong { font-size:1.1rem; }
.weight-target { display:flex; align-items:center; gap:0.75rem; font-size:0.85rem; color:rgba(255,255,255,0.5); margin-bottom:1.5rem; }
.weight-target .finput { max-width:100px; }
.weight-history { margin-top:1rem; }
.wh-item { display:flex; justify-content:space-between; padding:0.5rem 0.75rem; background:rgba(255,255,255,0.03); border-radius:8px; margin-bottom:0.3rem; font-size:0.85rem; }

/* Import */
.import-info { background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.2); border-radius:12px; padding:1rem; margin-bottom:1rem; }
.import-info p { margin:0 0 0.75rem; font-size:0.85rem; color:rgba(255,255,255,0.7); line-height:1.5; }
.copy-template-btn { display:flex; align-items:center; gap:0.4rem; padding:0.5rem 1rem; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.3); border-radius:8px; color:#10b981; cursor:pointer; font-size:0.85rem; }
.json-input { font-family:monospace; font-size:0.8rem; resize:vertical; }
.err-msg { color:#ff6b6b; font-size:0.8rem; margin:0.5rem 0; }
.success-msg { color:#10b981; font-size:0.8rem; margin:0.5rem 0; }

.empty { display:flex; flex-direction:column; align-items:center; gap:0.75rem; padding:3rem; color:rgba(255,255,255,0.3); }
.empty svg { width:3rem; height:3rem; }

/* Modal Global Settings */
.modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:1000; padding:1rem; }
.modal-content { background:#1a1a2e; border-radius:16px; max-width:550px; width:100%; max-height:90vh; overflow-y:auto; border:1px solid rgba(16,185,129,0.3); }
.modal-content.modal-lg { max-width:650px; }
.modal-header { display:flex; justify-content:space-between; align-items:center; padding:1.5rem; border-bottom:1px solid rgba(255,255,255,0.1); }
.modal-header h3 { display:flex; align-items:center; gap:0.5rem; margin:0; font-size:1.1rem; }
.mi { width:1.25rem; height:1.25rem; color:#10b981; }
.modal-close { width:2rem; height:2rem; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:white; cursor:pointer; }
.modal-body { padding:1.5rem; }
.modal-footer { display:flex; gap:1rem; padding:1.5rem; border-top:1px solid rgba(255,255,255,0.1); justify-content:flex-end; }
.fg { margin-bottom:1rem; } .fg label { display:block; color:rgba(255,255,255,0.6); font-size:0.8rem; margin-bottom:0.4rem; }
.fg2 { display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; }
.finput { width:100%; padding:0.65rem 0.9rem; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:10px; color:white; font-size:0.9rem; outline:none; box-sizing:border-box; }
.finput:focus { border-color:#10b981; } .finput::placeholder { color:rgba(255,255,255,0.3); }
.finput.sm { max-width:120px; padding:0.5rem 0.7rem; font-size:0.85rem; }
.btn-primary { display:flex; align-items:center; gap:0.5rem; padding:0.7rem 1.3rem; border-radius:10px; background:linear-gradient(135deg,#10b981,#34d399); color:white; font-weight:600; cursor:pointer; border:none; }
.btn-primary:disabled { opacity: 0.5; cursor:not-allowed; }
.btn-secondary { padding:0.7rem 1.3rem; border-radius:10px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:white; cursor:pointer; }

/* History View */
.goal-stats-row { display:flex; gap:1rem; margin-bottom:1.5rem; background:rgba(255,255,255,0.04); padding:1rem; border-radius:12px; }
.gs-box { flex:1; display:flex; flex-direction:column; }
.gs-box span { font-size:0.75rem; color:rgba(255,255,255,0.5); }
.gs-box strong { font-size:1.1rem; }
.hist-list { display:flex; flex-direction:column; gap:0.5rem; }
.hist-list-item { display:flex; justify-content:space-between; align-items:center; padding:0.75rem 1rem; background:rgba(255,255,255,0.04); border-radius:8px; border-left:3px solid #10b981; }
.hl-date { font-size:0.85rem; color:rgba(255,255,255,0.7); }
.hl-val { font-weight:600; color:#10b981; }

@media (max-width:768px) {
  .page-title { font-size:1.6rem; }
  .weight-log-form { flex-direction:column; }
  .ex-grid { grid-template-columns:1fr; }
  .top-actions { flex-direction:column; gap:0.4rem; }
}
</style>
