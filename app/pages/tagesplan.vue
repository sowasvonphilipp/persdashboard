<template>
  <div class="planner-container">
    <!-- Top Bar -->
    <div class="top-bar">
      <button class="back-btn" @click="navigateTo('/dashboard')">
        <UIcon name="i-heroicons-arrow-left" style="width:16px;height:16px;" /> Dashboard
      </button>
      <div class="top-actions">
        <button class="icon-btn" @click="showTemplates = !showTemplates" title="Vorlagen">
          <UIcon name="i-heroicons-squares-2x2" style="width:18px;height:18px;" />
        </button>
        <button class="add-btn" @click="openAddModal()">
          <UIcon name="i-heroicons-plus" style="width:18px;height:18px;" /> Block
        </button>
      </div>
    </div>

    <!-- Header with Date + Stats -->
    <div class="header-section">
      <div class="date-nav">
        <button class="nav-arrow" @click="changeDay(-1)"><UIcon name="i-heroicons-chevron-left" style="width:20px;height:20px;" /></button>
        <div class="date-center">
          <div class="date-weekday">{{ dayLabel.weekday }}</div>
          <div class="date-full">{{ dayLabel.full }}</div>
          <div v-if="isToday" class="today-badge">Heute</div>
        </div>
        <button class="nav-arrow" @click="changeDay(1)"><UIcon name="i-heroicons-chevron-right" style="width:20px;height:20px;" /></button>
      </div>
      <div v-if="!isToday" class="today-jump" @click="goToday">&#x21A9; Zurück zu heute</div>

      <!-- Day Stats Bar -->
      <div class="stats-bar" v-if="dayBlocks.length > 0">
        <div class="stat-item">
          <span class="stat-icon">&#x23F1;&#xFE0F;</span>
          <div>
            <div class="stat-value">{{ totalHours }}h</div>
            <div class="stat-label">Geplant</div>
          </div>
        </div>
        <div class="stat-item">
          <span class="stat-icon">&#x1F4E6;</span>
          <div>
            <div class="stat-value">{{ dayBlocks.length }}</div>
            <div class="stat-label">Blöcke</div>
          </div>
        </div>
        <div class="stat-item" v-if="isToday && currentBlock">
          <span class="stat-icon">&#x25B6;&#xFE0F;</span>
          <div>
            <div class="stat-value">{{ currentBlock.title }}</div>
            <div class="stat-label">Jetzt</div>
          </div>
        </div>
        <div class="stat-item" v-if="isToday && nextBlock">
          <span class="stat-icon">&#x23ED;&#xFE0F;</span>
          <div>
            <div class="stat-value">{{ nextBlock.start }} {{ nextBlock.title }}</div>
            <div class="stat-label">Nächstes</div>
          </div>
        </div>
        <div class="day-progress" v-if="isToday">
          <div class="day-progress-label">{{ Math.round(dayProgress) }}% Tag verstrichen</div>
          <div class="day-progress-bar">
            <div class="day-progress-fill" :style="{ width: dayProgress + '%' }"></div>
            <div class="day-progress-now" :style="{ left: dayProgress + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Templates Panel -->
    <div v-if="showTemplates" class="templates-panel">
      <div class="templates-header">
        <h3>&#x1F4CB; Vorlagen</h3>
        <button class="tpl-save-btn" @click="saveAsTemplate">
          <UIcon name="i-heroicons-arrow-down-tray" style="width:14px;height:14px;" /> Heute speichern
        </button>
      </div>
      <div v-if="templates.length === 0" class="empty-hint">Noch keine Vorlagen gespeichert.</div>
      <div v-else class="tpl-list">
        <div v-for="tpl in templates" :key="tpl.name" class="tpl-card">
          <div class="tpl-info">
            <span class="tpl-name">{{ tpl.name }}</span>
            <span class="tpl-count">{{ tpl.blocks.length }} Blöcke</span>
          </div>
          <div class="tpl-actions">
            <button class="tpl-apply" @click="applyTemplate(tpl)">Anwenden</button>
            <button class="tpl-del" @click="deleteTemplate(tpl.name)">&#x2715;</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Layout: Timeline + Sidebar -->
    <div class="main-layout">
      <!-- Timeline -->
      <div class="timeline-wrapper" ref="timelineRef">
        <!-- Current time line -->
        <div v-if="isToday" class="now-line" :style="{ top: nowLineTop + 'px' }">
          <span class="now-dot"></span>
          <span class="now-time">{{ currentTimeStr }}</span>
        </div>

        <div v-for="hour in hours" :key="hour" class="hour-row">
          <div class="hour-label" :class="{ 'future-hour': isToday && hour > currentHour, 'past-hour': isToday && hour < currentHour }">
            {{ String(hour).padStart(2, '0') }}:00
          </div>
          <div class="hour-slot" @click="addBlockAtHour(hour)">
            <div class="half-tick"></div>
          </div>
        </div>

        <!-- Positioned blocks -->
        <div class="blocks-layer">
          <div
            v-for="block in positionedBlocks"
            :key="block.id"
            class="block-card"
            :class="[block.category, { 'block-now': isCurrentBlock(block), 'block-past': isToday && isPastBlock(block) }]"
            :style="{
              top: block._top + 'px',
              height: block._height + 'px',
              left: '64px',
              right: (block._right || 4) + 'px'
            }"
            @click.stop="editBlock(block)"
          >
            <div class="block-content">
              <div class="block-title">{{ getCatIcon(block.category) }} {{ block.title }}</div>
              <div class="block-time">{{ block.start }} – {{ block.end }}</div>
              <div v-if="block.notes" class="block-notes">{{ block.notes }}</div>
            </div>
            <div v-if="block.repeat !== 'none'" class="block-repeat">&#x1F501;</div>
            <div v-if="isCurrentBlock(block)" class="block-progress-bar">
              <div class="block-progress-fill" :style="{ width: getBlockProgress(block) + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="sidebar">
        <!-- Category Legend -->
        <div class="legend-card">
          <h3 class="side-title">Kategorien</h3>
          <div v-for="cat in categories" :key="cat.id" class="legend-item" @click="filterCat = filterCat === cat.id ? null : cat.id" :class="{ active: filterCat === cat.id }">
            <span class="legend-dot" :class="cat.id"></span>
            <span class="legend-label">{{ cat.icon }} {{ cat.label }}</span>
            <span class="legend-count">{{ getCatCount(cat.id) }}</span>
          </div>
        </div>

        <!-- Google Calendar -->
        <div v-if="isCalAuth" class="cal-card">
          <div class="cal-card-header">
            <h3 class="side-title">&#x1F4C5; Google Kalender</h3>
            <button v-if="calendarEvents.length > 0" class="cal-import-btn" @click="importCalendarEvents">
              <UIcon name="i-heroicons-arrow-down-tray" style="width:12px;height:12px;" /> Import
            </button>
          </div>
          <div v-if="calendarEvents.length === 0" class="empty-hint">Keine Termine heute.</div>
          <div v-for="ev in calendarEvents" :key="ev.id" class="cal-event-item">
            <div class="cal-ev-time">{{ formatEventTime(ev) }}</div>
            <div class="cal-ev-title">{{ ev.summary }}</div>
          </div>
        </div>

        <!-- Quick Add -->
        <div class="quick-add-card">
          <h3 class="side-title">Schnell hinzufügen</h3>
          <div class="quick-presets">
            <button v-for="preset in quickPresets" :key="preset.title" class="preset-btn" @click="applyPreset(preset)">
              {{ preset.icon }} {{ preset.title }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingBlock ? 'Block bearbeiten' : 'Block hinzufügen' }}</h3>
          <button class="close-btn" @click="closeModal"><UIcon name="i-heroicons-x-mark" style="width:18px;height:18px;" /></button>
        </div>
        <div class="modal-body">
          <div class="field-group">
            <label>Titel</label>
            <input v-model="form.title" type="text" class="field-input" placeholder="z.B. Sport im Park..." autofocus @keydown.enter="saveBlock" />
          </div>
          <div class="time-grid">
            <div class="field-group">
              <label>Startzeit</label>
              <input v-model="form.start" type="time" class="field-input" />
            </div>
            <div class="field-group">
              <label>Endzeit</label>
              <input v-model="form.end" type="time" class="field-input" />
            </div>
          </div>
          <div class="duration-indicator" v-if="form.start && form.end && formatDuration(form.start, form.end)">
            {{ formatDuration(form.start, form.end) }}
          </div>
          <div class="field-group">
            <label>Kategorie</label>
            <div class="cat-grid">
              <button v-for="cat in categories" :key="cat.id" class="cat-btn" :class="[cat.id, { selected: form.category === cat.id }]" @click="form.category = cat.id">
                {{ cat.icon }} {{ cat.label }}
              </button>
            </div>
          </div>
          <div class="field-group">
            <label>Notizen (optional)</label>
            <textarea v-model="form.notes" class="field-input field-textarea" placeholder="Details, Ort, Aufgaben..." rows="2"></textarea>
          </div>
          <div class="field-group">
            <label>Wiederholen</label>
            <div class="repeat-row">
              <button v-for="r in repeatOptions" :key="r.value" class="repeat-btn" :class="{ selected: form.repeat === r.value }" @click="form.repeat = r.value">
                {{ r.label }}
              </button>
            </div>
          </div>
          <div class="field-group" v-if="isCalAuth && !editingBlock">
            <label class="toggle-label">
              <input type="checkbox" v-model="addToCalendar" class="toggle-check" />
              <span>&#x1F4C5; Zu Google Calendar hinzufügen</span>
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button v-if="editingBlock" class="btn-danger" @click="deleteBlock">
            <UIcon name="i-heroicons-trash" style="width:16px;height:16px;" /> Löschen
          </button>
          <div class="spacer"></div>
          <button class="btn-cancel" @click="closeModal">Abbrechen</button>
          <button class="btn-save" @click="saveBlock" :disabled="!form.title.trim()">
            <UIcon name="i-heroicons-check" style="width:16px;height:16px;" /> Speichern
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const { isAuthenticated: isCalAuth, restoreToken, fetchCalendarEvents, createEvent } = useGoogleAuth();

const blocks = ref([]);
const templates = ref([]);
const calendarEvents = ref([]);
const showModal = ref(false);
const showTemplates = ref(false);
const editingBlock = ref(null);
const addToCalendar = ref(false);
const selectedDate = ref(new Date());
const filterCat = ref(null);
const timelineRef = ref(null);
const currentTime = ref(new Date());
const hourHeight = 64;

const hours = Array.from({ length: 20 }, (_, i) => i + 4);

const categories = [
  { id: 'school', label: 'Schule', icon: '📚' },
  { id: 'sport', label: 'Sport', icon: '🏋️' },
  { id: 'work', label: 'Arbeit', icon: '💼' },
  { id: 'personal', label: 'Persönlich', icon: '🏠' },
  { id: 'social', label: 'Sozial', icon: '👥' },
  { id: 'travel', label: 'Unterwegs', icon: '🚌' },
  { id: 'free', label: 'Freizeit', icon: '🎮' },
  { id: 'sleep', label: 'Schlaf', icon: '😴' },
];

const repeatOptions = [
  { value: 'none', label: 'Einmalig' },
  { value: 'daily', label: 'Täglich' },
  { value: 'weekdays', label: 'Mo–Fr' },
  { value: 'weekly', label: 'Wöchentlich' },
];

const quickPresets = [
  { icon: '😴', title: 'Schlafen', start: '23:00', end: '07:00', category: 'sleep' },
  { icon: '🏋️', title: 'Training', start: '07:00', end: '08:00', category: 'sport' },
  { icon: '📚', title: 'Lernen', start: '09:00', end: '11:00', category: 'school' },
  { icon: '🍽️', title: 'Mittagessen', start: '12:00', end: '13:00', category: 'personal' },
  { icon: '🎮', title: 'Gaming', start: '19:00', end: '21:00', category: 'free' },
];

const form = ref({ title: '', start: '08:00', end: '09:00', category: 'personal', repeat: 'none', notes: '' });

const dateStr = computed(() => selectedDate.value.toISOString().split('T')[0]);
const isToday = computed(() => dateStr.value === new Date().toISOString().split('T')[0]);
const dayLabel = computed(() => ({
  weekday: selectedDate.value.toLocaleDateString('de-DE', { weekday: 'long' }),
  full: selectedDate.value.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }),
}));
const dayOfWeek = computed(() => selectedDate.value.getDay());

const currentHour = computed(() => currentTime.value.getHours());
const currentTimeStr = computed(() => currentTime.value.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }));
const nowLineTop = computed(() => {
  const h = currentTime.value.getHours();
  const m = currentTime.value.getMinutes();
  return Math.max(0, (h - hours[0]) * hourHeight + (m / 60) * hourHeight);
});

const dayProgress = computed(() => {
  const nowMin = currentTime.value.getHours() * 60 + currentTime.value.getMinutes();
  return Math.min(100, (nowMin / (24 * 60)) * 100);
});

const dayBlocks = computed(() => {
  let filtered = blocks.value.filter(b => {
    if (b.date === dateStr.value) return true;
    if (b.repeat === 'daily') return true;
    if (b.repeat === 'weekdays' && dayOfWeek.value >= 1 && dayOfWeek.value <= 5) return true;
    if (b.repeat === 'weekly') {
      const bd = new Date(b.date + 'T12:00:00');
      return bd.getDay() === dayOfWeek.value;
    }
    return false;
  });
  if (filterCat.value) filtered = filtered.filter(b => b.category === filterCat.value);
  return filtered.sort((a, b) => a.start.localeCompare(b.start));
});

const positionedBlocks = computed(() => {
  return dayBlocks.value.map(block => {
    const [sh, sm] = block.start.split(':').map(Number);
    const [eh, em] = block.end.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    const top = (sh - hours[0]) * hourHeight + (sm / 60) * hourHeight;
    const height = Math.max(32, ((endMin - startMin) / 60) * hourHeight);
    return { ...block, _top: top, _height: height, _right: 4 };
  });
});

const totalHours = computed(() => {
  let mins = 0;
  dayBlocks.value.forEach(b => {
    const [sh, sm] = b.start.split(':').map(Number);
    const [eh, em] = b.end.split(':').map(Number);
    mins += (eh * 60 + em) - (sh * 60 + sm);
  });
  return Math.round(mins / 60 * 10) / 10;
});

const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const nowMin = computed(() => currentTime.value.getHours() * 60 + currentTime.value.getMinutes());

const currentBlock = computed(() => {
  if (!isToday.value) return null;
  return dayBlocks.value.find(b => nowMin.value >= toMin(b.start) && nowMin.value < toMin(b.end)) || null;
});
const nextBlock = computed(() => {
  if (!isToday.value) return null;
  return dayBlocks.value.find(b => toMin(b.start) > nowMin.value) || null;
});

const getCatIcon = (id) => categories.find(c => c.id === id)?.icon || '📌';
const getCatCount = (id) => dayBlocks.value.filter(b => b.category === id).length;

const isCurrentBlock = (block) => isToday.value && nowMin.value >= toMin(block.start) && nowMin.value < toMin(block.end);
const isPastBlock = (block) => toMin(block.end) < nowMin.value;

const getBlockProgress = (block) => {
  const s = toMin(block.start), e = toMin(block.end), n = nowMin.value;
  return Math.min(100, Math.max(0, ((n - s) / (e - s)) * 100));
};

const formatDuration = (start, end) => {
  const mins = toMin(end) - toMin(start);
  if (mins <= 0) return '';
  if (mins < 60) return `${mins} Min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
};

const formatEventTime = (ev) => {
  if (ev.start?.dateTime) return new Date(ev.start.dateTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  return 'Ganztägig';
};

const changeDay = (dir) => {
  const d = new Date(selectedDate.value);
  d.setDate(d.getDate() + dir);
  selectedDate.value = d;
  loadCalendar();
};
const goToday = () => { selectedDate.value = new Date(); loadCalendar(); };

const openAddModal = (hour = null) => {
  editingBlock.value = null;
  addToCalendar.value = false;
  const h = hour ?? new Date().getHours();
  const eh = Math.min(h + 1, 23);
  form.value = { title: '', start: `${String(h).padStart(2,'0')}:00`, end: `${String(eh).padStart(2,'0')}:00`, category: 'personal', repeat: 'none', notes: '' };
  showModal.value = true;
};

const addBlockAtHour = (hour) => openAddModal(hour);

const editBlock = (block) => {
  editingBlock.value = block;
  form.value = { ...block, notes: block.notes || '' };
  addToCalendar.value = false;
  showModal.value = true;
};

const closeModal = () => { showModal.value = false; editingBlock.value = null; };

const saveBlock = async () => {
  if (!form.value.title.trim()) return;
  if (editingBlock.value) {
    const idx = blocks.value.findIndex(b => b.id === editingBlock.value.id);
    if (idx > -1) blocks.value[idx] = { ...form.value };
  } else {
    blocks.value.push({ id: Date.now().toString(), ...JSON.parse(JSON.stringify(form.value)), date: dateStr.value });
  }
  if (addToCalendar.value && isCalAuth.value) {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await createEvent({ summary: form.value.title, start: { dateTime: `${dateStr.value}T${form.value.start}:00`, timeZone: tz }, end: { dateTime: `${dateStr.value}T${form.value.end}:00`, timeZone: tz } });
    } catch (e) { console.error('Calendar error:', e); }
  }
  save(); closeModal();
};

const deleteBlock = () => {
  if (editingBlock.value) blocks.value = blocks.value.filter(b => b.id !== editingBlock.value.id);
  save(); closeModal();
};

const applyPreset = (preset) => {
  form.value = { title: preset.title, start: preset.start, end: preset.end, category: preset.category, repeat: 'none', notes: '' };
  editingBlock.value = null;
  showModal.value = true;
};

const saveAsTemplate = () => {
  const name = prompt('Name für diese Vorlage?');
  if (!name?.trim()) return;
  templates.value.push({ name: name.trim(), blocks: dayBlocks.value.map(b => ({ title: b.title, start: b.start, end: b.end, category: b.category, repeat: b.repeat, notes: b.notes || '' })) });
  localStorage.setItem('planner_templates', JSON.stringify(templates.value));
};

const applyTemplate = (tpl) => {
  tpl.blocks.forEach(b => blocks.value.push({ id: Date.now().toString() + Math.random(), ...b, date: dateStr.value }));
  save(); showTemplates.value = false;
};

const deleteTemplate = (name) => {
  templates.value = templates.value.filter(t => t.name !== name);
  localStorage.setItem('planner_templates', JSON.stringify(templates.value));
};

const loadCalendar = async () => {
  if (!isCalAuth.value) return;
  try {
    const start = new Date(selectedDate.value); start.setHours(0,0,0,0);
    const end = new Date(start); end.setDate(end.getDate() + 1);
    calendarEvents.value = await fetchCalendarEvents(start.toISOString(), end.toISOString());
  } catch (e) { console.error(e); }
};

const importCalendarEvents = () => {
  let imported = 0;
  calendarEvents.value.forEach(ev => {
    if (!ev.start?.dateTime) return;
    const stTime = new Date(ev.start.dateTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    const enTime = new Date(ev.end.dateTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    const exists = blocks.value.find(b => b.title === ev.summary && b.start === stTime && b.date === dateStr.value);
    if (!exists) { blocks.value.push({ id: Date.now().toString() + Math.random(), title: ev.summary, start: stTime, end: enTime, category: 'personal', repeat: 'none', notes: '', date: dateStr.value }); imported++; }
  });
  if (imported > 0) { save(); alert(`${imported} Termine importiert!`); }
  else alert('Keine neuen Termine gefunden.');
};

const save = () => localStorage.setItem('planner_blocks', JSON.stringify(blocks.value));
const load = () => {
  const b = localStorage.getItem('planner_blocks'); if (b) blocks.value = JSON.parse(b);
  const t = localStorage.getItem('planner_templates'); if (t) templates.value = JSON.parse(t);
};

const scrollToNow = () => {
  if (!isToday.value || !timelineRef.value) return;
  timelineRef.value.scrollTop = Math.max(0, nowLineTop.value - 150);
};

onMounted(async () => {
  load();
  await restoreToken();
  loadCalendar();
  setInterval(() => { currentTime.value = new Date(); }, 60000);
  nextTick(() => scrollToNow());
});
</script>

<style scoped>
.planner-container { min-height:100vh; background:linear-gradient(135deg,#0f0f1e 0%,#1a1a2e 50%,#16213e 100%); padding:1.5rem; color:white; }

.top-bar { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; }
.back-btn { display:inline-flex; align-items:center; gap:0.4rem; padding:0.5rem 1rem; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:10px; color:rgba(255,255,255,0.8); cursor:pointer; font-size:0.85rem; transition:background 0.2s; }
.back-btn:hover { background:rgba(255,255,255,0.1); }
.top-actions { display:flex; gap:0.5rem; align-items:center; }
.icon-btn { width:38px; height:38px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:10px; color:rgba(255,255,255,0.7); cursor:pointer; transition:all 0.2s; }
.icon-btn:hover { background:rgba(255,255,255,0.12); color:white; }
.add-btn { display:inline-flex; align-items:center; gap:0.4rem; padding:0.5rem 1rem; background:linear-gradient(135deg,#4facfe,#00f2fe); border:none; border-radius:10px; color:white; font-weight:600; cursor:pointer; font-size:0.9rem; transition:opacity 0.2s; }
.add-btn:hover { opacity:0.9; }

.header-section { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:1.25rem; margin-bottom:1.25rem; }
.date-nav { display:flex; align-items:center; justify-content:center; gap:1rem; margin-bottom:0.75rem; }
.nav-arrow { width:34px; height:34px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:white; cursor:pointer; transition:background 0.2s; }
.nav-arrow:hover { background:rgba(255,255,255,0.12); }
.date-center { text-align:center; }
.date-weekday { font-size:0.8rem; color:rgba(255,255,255,0.5); text-transform:uppercase; letter-spacing:0.1em; }
.date-full { font-size:1.3rem; font-weight:700; color:white; margin:0.1rem 0; }
.today-badge { display:inline-block; padding:0.15rem 0.6rem; background:rgba(79,172,254,0.2); border:1px solid rgba(79,172,254,0.4); border-radius:20px; color:#4facfe; font-size:0.7rem; font-weight:600; }
.today-jump { text-align:center; color:rgba(79,172,254,0.8); font-size:0.8rem; cursor:pointer; margin-bottom:0.5rem; }
.today-jump:hover { color:#4facfe; }

.stats-bar { display:flex; align-items:center; gap:1.5rem; padding-top:0.75rem; border-top:1px solid rgba(255,255,255,0.08); flex-wrap:wrap; }
.stat-item { display:flex; align-items:center; gap:0.5rem; }
.stat-icon { font-size:1.1rem; }
.stat-value { font-size:0.9rem; font-weight:600; color:white; }
.stat-label { font-size:0.65rem; color:rgba(255,255,255,0.4); }
.day-progress { flex:1; min-width:180px; }
.day-progress-label { font-size:0.65rem; color:rgba(255,255,255,0.4); margin-bottom:0.3rem; }
.day-progress-bar { position:relative; height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:visible; }
.day-progress-fill { height:100%; background:linear-gradient(90deg,#4facfe,#00f2fe); border-radius:3px; transition:width 1s; }
.day-progress-now { position:absolute; top:-3px; width:12px; height:12px; background:white; border:2px solid #4facfe; border-radius:50%; transform:translateX(-50%); }

.templates-panel { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:1rem; margin-bottom:1.25rem; }
.templates-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; }
.templates-header h3 { margin:0; font-size:0.95rem; }
.tpl-save-btn { display:flex; align-items:center; gap:0.3rem; padding:0.35rem 0.75rem; background:rgba(79,172,254,0.15); border:1px solid rgba(79,172,254,0.3); border-radius:8px; color:#4facfe; font-size:0.8rem; cursor:pointer; }
.tpl-list { display:flex; flex-direction:column; gap:0.4rem; }
.tpl-card { display:flex; align-items:center; gap:0.75rem; padding:0.5rem 0.75rem; background:rgba(255,255,255,0.04); border-radius:8px; }
.tpl-info { flex:1; }
.tpl-name { font-size:0.9rem; font-weight:500; }
.tpl-count { font-size:0.75rem; color:rgba(255,255,255,0.4); margin-left:0.5rem; }
.tpl-actions { display:flex; gap:0.4rem; }
.tpl-apply { padding:0.3rem 0.7rem; background:rgba(79,172,254,0.15); border:1px solid rgba(79,172,254,0.3); border-radius:6px; color:#4facfe; font-size:0.8rem; cursor:pointer; }
.tpl-del { padding:0.3rem 0.5rem; background:rgba(255,107,107,0.1); border:1px solid rgba(255,107,107,0.2); border-radius:6px; color:#ff6b6b; font-size:0.8rem; cursor:pointer; }

.main-layout { display:grid; grid-template-columns:1fr 260px; gap:1.25rem; align-items:start; }

.timeline-wrapper { position:relative; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:16px; overflow:hidden; }
.hour-row { display:flex; height:64px; border-bottom:1px solid rgba(255,255,255,0.04); }
.hour-label { width:60px; flex-shrink:0; display:flex; align-items:flex-start; padding:6px 8px 0; font-size:0.7rem; color:rgba(255,255,255,0.3); font-weight:500; user-select:none; }
.hour-label.past-hour { color:rgba(255,255,255,0.15); }
.hour-label.future-hour { color:rgba(255,255,255,0.45); }
.hour-slot { flex:1; position:relative; cursor:pointer; transition:background 0.15s; }
.hour-slot:hover { background:rgba(79,172,254,0.05); }
.half-tick { position:absolute; top:50%; left:0; right:0; height:1px; background:rgba(255,255,255,0.03); }

.now-line { position:absolute; left:0; right:0; display:flex; align-items:center; z-index:10; pointer-events:none; }
.now-dot { display:block; width:10px; height:10px; background:#ff4757; border-radius:50%; margin-left:54px; flex-shrink:0; box-shadow:0 0 6px rgba(255,71,87,0.6); }
.now-time { font-size:0.65rem; font-weight:700; color:#ff4757; margin-left:4px; background:rgba(15,15,30,0.9); padding:1px 4px; border-radius:4px; }
.now-line::after { content:''; position:absolute; left:60px; right:0; top:50%; height:1.5px; background:#ff4757; opacity:0.6; }

.blocks-layer { position:absolute; top:0; left:0; right:0; bottom:0; pointer-events:none; }
.block-card { position:absolute; border-radius:10px; padding:0.4rem 0.6rem; cursor:pointer; pointer-events:all; overflow:hidden; transition:transform 0.15s,box-shadow 0.15s; border-left:3px solid transparent; display:flex; flex-direction:column; }
.block-card:hover { transform:translateX(2px); box-shadow:0 4px 16px rgba(0,0,0,0.3); z-index:5; }

.block-card.school { background:rgba(255,217,61,0.18); border-left-color:#ffd93d; }
.block-card.sport { background:rgba(16,185,129,0.18); border-left-color:#10b981; }
.block-card.work { background:rgba(79,172,254,0.18); border-left-color:#4facfe; }
.block-card.personal { background:rgba(162,155,254,0.18); border-left-color:#a29bfe; }
.block-card.social { background:rgba(255,159,243,0.18); border-left-color:#ff9ff3; }
.block-card.travel { background:rgba(255,107,53,0.18); border-left-color:#ff6b35; }
.block-card.free { background:rgba(0,242,254,0.12); border-left-color:#00f2fe; }
.block-card.sleep { background:rgba(99,110,114,0.2); border-left-color:#636e72; }

.block-card.block-now { box-shadow:0 0 0 1.5px rgba(79,172,254,0.5),0 4px 20px rgba(79,172,254,0.2); z-index:3; }
.block-card.block-past { opacity:0.45; }
.block-content { flex:1; overflow:hidden; }
.block-title { font-size:0.82rem; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.block-time { font-size:0.68rem; color:rgba(255,255,255,0.5); margin-top:1px; }
.block-notes { font-size:0.68rem; color:rgba(255,255,255,0.4); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.block-repeat { position:absolute; top:4px; right:6px; font-size:0.6rem; }
.block-progress-bar { height:3px; background:rgba(255,255,255,0.1); border-radius:2px; margin-top:4px; }
.block-progress-fill { height:100%; background:rgba(79,172,254,0.8); border-radius:2px; transition:width 1s; }

.sidebar { display:flex; flex-direction:column; gap:1rem; }
.legend-card,.cal-card,.quick-add-card { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:1rem; }
.side-title { margin:0 0 0.75rem; font-size:0.9rem; font-weight:600; color:rgba(255,255,255,0.7); }
.legend-item { display:flex; align-items:center; gap:0.5rem; padding:0.3rem 0.5rem; border-radius:8px; cursor:pointer; transition:background 0.15s; font-size:0.82rem; }
.legend-item:hover { background:rgba(255,255,255,0.05); }
.legend-item.active { background:rgba(255,255,255,0.08); }
.legend-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
.legend-dot.school { background:#ffd93d; }
.legend-dot.sport { background:#10b981; }
.legend-dot.work { background:#4facfe; }
.legend-dot.personal { background:#a29bfe; }
.legend-dot.social { background:#ff9ff3; }
.legend-dot.travel { background:#ff6b35; }
.legend-dot.free { background:#00f2fe; }
.legend-dot.sleep { background:#636e72; }
.legend-label { flex:1; color:rgba(255,255,255,0.8); }
.legend-count { font-size:0.7rem; color:rgba(255,255,255,0.35); background:rgba(255,255,255,0.06); padding:0.1rem 0.4rem; border-radius:10px; }

.cal-card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; }
.cal-card-header .side-title { margin-bottom:0; }
.cal-import-btn { display:flex; align-items:center; gap:0.3rem; padding:0.25rem 0.6rem; background:rgba(79,172,254,0.15); border:1px solid rgba(79,172,254,0.3); border-radius:6px; color:#4facfe; font-size:0.72rem; cursor:pointer; }
.cal-event-item { padding:0.4rem 0; border-bottom:1px solid rgba(255,255,255,0.05); }
.cal-event-item:last-child { border-bottom:none; }
.cal-ev-time { font-size:0.7rem; color:#a29bfe; font-weight:600; }
.cal-ev-title { font-size:0.8rem; color:rgba(255,255,255,0.8); }
.quick-presets { display:flex; flex-direction:column; gap:0.35rem; }
.preset-btn { padding:0.5rem 0.75rem; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:8px; color:rgba(255,255,255,0.7); cursor:pointer; font-size:0.82rem; text-align:left; transition:background 0.15s; }
.preset-btn:hover { background:rgba(255,255,255,0.08); color:white; }
.empty-hint { font-size:0.8rem; color:rgba(255,255,255,0.3); font-style:italic; }

.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.75); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; z-index:1000; padding:1rem; }
.modal-content { background:#1a1a2e; border:1px solid rgba(79,172,254,0.2); border-radius:18px; max-width:520px; width:100%; max-height:92vh; overflow-y:auto; box-shadow:0 25px 60px rgba(0,0,0,0.5); }
.modal-header { display:flex; justify-content:space-between; align-items:center; padding:1.25rem 1.5rem 1rem; border-bottom:1px solid rgba(255,255,255,0.08); }
.modal-header h3 { margin:0; font-size:1.1rem; }
.close-btn { width:32px; height:32px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:rgba(255,255,255,0.6); cursor:pointer; transition:all 0.2s; }
.close-btn:hover { background:rgba(255,255,255,0.1); color:white; }
.modal-body { padding:1.25rem 1.5rem; display:flex; flex-direction:column; gap:1rem; }
.modal-footer { display:flex; align-items:center; gap:0.75rem; padding:1rem 1.5rem; border-top:1px solid rgba(255,255,255,0.08); }
.spacer { flex:1; }

.field-group { display:flex; flex-direction:column; gap:0.35rem; }
.field-group label { font-size:0.78rem; color:rgba(255,255,255,0.5); font-weight:500; }
.field-input { width:100%; padding:0.6rem 0.9rem; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:10px; color:white; font-size:0.9rem; outline:none; box-sizing:border-box; transition:border-color 0.2s; }
.field-input:focus { border-color:rgba(79,172,254,0.5); background:rgba(79,172,254,0.08); }
.field-input::placeholder { color:rgba(255,255,255,0.25); }
.field-textarea { resize:vertical; font-family:inherit; min-height:60px; }
.time-grid { display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; }
.duration-indicator { font-size:0.8rem; color:#4facfe; background:rgba(79,172,254,0.08); border:1px solid rgba(79,172,254,0.15); border-radius:8px; padding:0.35rem 0.75rem; text-align:center; }

.cat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:0.4rem; }
.cat-btn { padding:0.45rem 0.25rem; border-radius:8px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:rgba(255,255,255,0.6); cursor:pointer; font-size:0.72rem; text-align:center; transition:all 0.15s; }
.cat-btn:hover { background:rgba(255,255,255,0.08); color:white; }
.cat-btn.selected { border-color:rgba(79,172,254,0.5); color:white; background:rgba(79,172,254,0.15); }
.cat-btn.school.selected { border-color:#ffd93d; background:rgba(255,217,61,0.1); }
.cat-btn.sport.selected { border-color:#10b981; background:rgba(16,185,129,0.1); }
.cat-btn.work.selected { border-color:#4facfe; background:rgba(79,172,254,0.1); }
.cat-btn.personal.selected { border-color:#a29bfe; background:rgba(162,155,254,0.1); }
.cat-btn.social.selected { border-color:#ff9ff3; background:rgba(255,159,243,0.1); }
.cat-btn.travel.selected { border-color:#ff6b35; background:rgba(255,107,53,0.1); }
.cat-btn.free.selected { border-color:#00f2fe; background:rgba(0,242,254,0.08); }
.cat-btn.sleep.selected { border-color:#636e72; background:rgba(99,110,114,0.15); }

.repeat-row { display:flex; gap:0.4rem; flex-wrap:wrap; }
.repeat-btn { padding:0.4rem 0.75rem; border-radius:8px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.6); cursor:pointer; font-size:0.8rem; transition:all 0.15s; }
.repeat-btn:hover { background:rgba(255,255,255,0.08); }
.repeat-btn.selected { background:rgba(79,172,254,0.15); border-color:rgba(79,172,254,0.4); color:#4facfe; }
.toggle-label { display:flex; align-items:center; gap:0.5rem; cursor:pointer; font-size:0.85rem; color:rgba(255,255,255,0.7); }
.toggle-check { accent-color:#4facfe; width:15px; height:15px; }

.btn-save { display:flex; align-items:center; gap:0.4rem; padding:0.6rem 1.2rem; background:linear-gradient(135deg,#4facfe,#00f2fe); border:none; border-radius:10px; color:white; font-weight:600; cursor:pointer; font-size:0.9rem; transition:opacity 0.2s; }
.btn-save:disabled { opacity:0.4; cursor:not-allowed; }
.btn-save:not(:disabled):hover { opacity:0.9; }
.btn-cancel { padding:0.6rem 1.1rem; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:10px; color:rgba(255,255,255,0.7); cursor:pointer; font-size:0.9rem; }
.btn-cancel:hover { background:rgba(255,255,255,0.1); }
.btn-danger { display:flex; align-items:center; gap:0.4rem; padding:0.6rem 1rem; background:rgba(255,107,107,0.12); border:1px solid rgba(255,107,107,0.25); border-radius:10px; color:#ff6b6b; cursor:pointer; font-size:0.9rem; transition:background 0.2s; }
.btn-danger:hover { background:rgba(255,107,107,0.2); }

@media (max-width:900px) {
  .main-layout { grid-template-columns:1fr; }
  .sidebar { flex-direction:row; flex-wrap:wrap; }
  .legend-card,.cal-card,.quick-add-card { flex:1; min-width:200px; }
  .cat-grid { grid-template-columns:repeat(3,1fr); }
}
@media (max-width:600px) {
  .planner-container { padding:1rem; }
  .cat-grid { grid-template-columns:repeat(2,1fr); }
  .stats-bar { gap:0.75rem; }
}
</style>
