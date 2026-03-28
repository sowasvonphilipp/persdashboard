<template>
  <div class="planner-container">
    <div class="top-bar">
      <button class="back-btn" @click="navigateTo('/dashboard')"><UIcon name="i-heroicons-arrow-left" /> Dashboard</button>
      <button class="add-btn" @click="showAdd = true"><UIcon name="i-heroicons-plus" /> Block hinzufügen</button>
    </div>
    <h1 class="page-title"><UIcon name="i-heroicons-calendar" class="title-icon" />Tagesplan</h1>

    <!-- Day Navigation -->
    <div class="day-nav">
      <button @click="changeDay(-1)"><UIcon name="i-heroicons-chevron-left" /></button>
      <span class="day-label" :class="{ today: isToday }">{{ dayLabel }}</span>
      <button @click="changeDay(1)"><UIcon name="i-heroicons-chevron-right" /></button>
      <button class="today-btn" v-if="!isToday" @click="goToday">Heute</button>
      <button class="tomorrow-btn" v-if="isToday" @click="goTomorrow">Morgen Planen <UIcon name="i-heroicons-arrow-right" style="width:14px;height:14px;" /></button>
    </div>

    <!-- Timeline -->
    <div class="timeline">
      <div v-for="hour in hours" :key="hour" class="time-row">
        <div class="time-label">{{ String(hour).padStart(2, '0') }}:00</div>
        <div class="time-slot" @click="addBlockAtHour(hour)">
          <div v-for="block in getBlocksAtHour(hour)" :key="block.id" class="time-block" :class="block.category" :style="{ top: getBlockTop(block, hour) + '%', height: getBlockHeight(block) + 'px' }" @click.stop="editBlock(block)">
            <span class="tb-title">{{ block.title }}</span>
            <span class="tb-time">{{ block.start }} - {{ block.end }}</span>
            <span v-if="block.repeat !== 'none'" class="tb-repeat">🔁</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Calendar Events -->
    <div v-if="isCalAuth" class="cal-events">
      <div class="cal-header">
        <h3>📅 Google Calendar</h3>
        <button v-if="calendarEvents.length > 0" class="tpl-btn apply" @click="importCalendarEvents"><UIcon name="i-heroicons-arrow-down-tray" /> In Tagesplan importieren</button>
      </div>
      <div v-if="calendarEvents.length === 0" class="hint-msg">Keine Termine für diesen Tag gefunden.</div>
      <div v-for="ev in calendarEvents" :key="ev.id" class="cal-event">
        <span class="ce-time">{{ formatEventTime(ev) }}</span>
        <span class="ce-title">{{ ev.summary }}</span>
      </div>
    </div>

    <!-- Templates -->
    <div class="templates-section">
      <h3>📋 Vorlagen</h3>
      <div class="template-actions">
        <button class="tpl-btn" @click="saveAsTemplate"><UIcon name="i-heroicons-arrow-down-tray" /> Tag als Vorlage</button>
        <button v-for="tpl in templates" :key="tpl.name" class="tpl-btn apply" @click="applyTemplate(tpl)"><UIcon name="i-heroicons-squares-2x2" /> {{ tpl.name }}</button>
      </div>
    </div>

    <!-- ADD/EDIT MODAL -->
    <div v-if="showAdd" class="modal-overlay" @click="showAdd = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3><UIcon name="i-heroicons-clock" class="mi" /> {{ editingBlock ? 'Block bearbeiten' : 'Block hinzufügen' }}</h3>
          <button class="modal-close" @click="showAdd = false"><UIcon name="i-heroicons-x-mark" /></button>
        </div>
        <div class="modal-body">
          <div class="fg"><label>Titel</label><input v-model="newBlock.title" type="text" placeholder="z.B. Schule" class="finput" /></div>
          <div class="fg2">
            <div class="fg"><label>Start</label><input v-model="newBlock.start" type="time" class="finput" /></div>
            <div class="fg"><label>Ende</label><input v-model="newBlock.end" type="time" class="finput" /></div>
          </div>
          <div class="fg">
            <label>Kategorie</label>
            <div class="opt-row">
              <button v-for="c in categories" :key="c.id" class="opt-btn" :class="{ sel: newBlock.category === c.id }" @click="newBlock.category = c.id">{{ c.icon }} {{ c.label }}</button>
            </div>
          </div>
          <div class="fg">
            <label>Wiederholen</label>
            <div class="opt-row">
              <button class="opt-btn" :class="{ sel: newBlock.repeat === 'none' }" @click="newBlock.repeat = 'none'">Einmalig</button>
              <button class="opt-btn" :class="{ sel: newBlock.repeat === 'daily' }" @click="newBlock.repeat = 'daily'">Täglich</button>
              <button class="opt-btn" :class="{ sel: newBlock.repeat === 'weekdays' }" @click="newBlock.repeat = 'weekdays'">Mo-Fr</button>
              <button class="opt-btn" :class="{ sel: newBlock.repeat === 'weekly' }" @click="newBlock.repeat = 'weekly'">Wöchentlich</button>
            </div>
          </div>
          <div class="fg" v-if="isCalAuth">
            <label class="checkbox-label"><input type="checkbox" v-model="addToCalendar" /> Zu Google Calendar hinzufügen</label>
          </div>
        </div>
        <div class="modal-footer">
          <button v-if="editingBlock" class="btn-danger" @click="deleteBlock"><UIcon name="i-heroicons-trash" /> Löschen</button>
          <div style="flex:1"></div>
          <button class="btn-secondary" @click="showAdd = false">Abbrechen</button>
          <button class="btn-primary" @click="saveBlock"><UIcon name="i-heroicons-check" /> Speichern</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const config = useRuntimeConfig();
const { isAuthenticated: isCalAuth, restoreToken, fetchCalendarEvents, createEvent } = useGoogleAuth();

const blocks = ref([]);
const templates = ref([]);
const calendarEvents = ref([]);
const showAdd = ref(false);
const editingBlock = ref(null);
const addToCalendar = ref(false);
const selectedDate = ref(new Date());
const hours = Array.from({ length: 19 }, (_, i) => i + 5); // 5:00 - 23:00

const categories = [
  { id: 'school', label: 'Schule', icon: '📚' },
  { id: 'sport', label: 'Sport', icon: '🏋️' },
  { id: 'work', label: 'Arbeit', icon: '💼' },
  { id: 'personal', label: 'Persönlich', icon: '🏠' },
  { id: 'social', label: 'Sozial', icon: '👥' },
  { id: 'travel', label: 'Unterwegs', icon: '🚌' },
  { id: 'free', label: 'Freizeit', icon: '🎮' },
  { id: 'sleep', label: 'Schlaf/Ruhe', icon: '😴' },
];

const newBlock = ref({ title: '', start: '08:00', end: '09:00', category: 'personal', repeat: 'none' });

const dateStr = computed(() => selectedDate.value.toISOString().split('T')[0]);
const isToday = computed(() => dateStr.value === new Date().toISOString().split('T')[0]);
const dayLabel = computed(() => selectedDate.value.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }));
const dayOfWeek = computed(() => selectedDate.value.getDay());

const dayBlocks = computed(() => {
  return blocks.value.filter(b => {
    if (b.date === dateStr.value) return true;
    if (b.repeat === 'daily') return true;
    if (b.repeat === 'weekdays' && dayOfWeek.value >= 1 && dayOfWeek.value <= 5) return true;
    if (b.repeat === 'weekly' && new Date(b.date).getDay() === dayOfWeek.value) return true;
    return false;
  });
});

const getBlocksAtHour = (hour) => dayBlocks.value.filter(b => {
  const sh = parseInt(b.start.split(':')[0]);
  const eh = parseInt(b.end.split(':')[0]);
  return sh <= hour && eh > hour;
});
const getBlockTop = (block, hour) => {
  const sh = parseInt(block.start.split(':')[0]);
  const sm = parseInt(block.start.split(':')[1]);
  if (sh === hour) return (sm / 60) * 100;
  return 0;
};
const getBlockHeight = (block) => {
  const [sh, sm] = block.start.split(':').map(Number);
  const [eh, em] = block.end.split(':').map(Number);
  return Math.max(24, ((eh * 60 + em) - (sh * 60 + sm)) / 60 * 50);
};

const formatEventTime = (ev) => {
  if (ev.start?.dateTime) return new Date(ev.start.dateTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  return 'Ganztägig';
};

const changeDay = (dir) => { const d = new Date(selectedDate.value); d.setDate(d.getDate() + dir); selectedDate.value = d; loadCalendar(); };
const goToday = () => { selectedDate.value = new Date(); loadCalendar(); };
const goTomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); selectedDate.value = d; loadCalendar(); };

const addBlockAtHour = (hour) => {
  newBlock.value = { title: '', start: `${String(hour).padStart(2, '0')}:00`, end: `${String(hour + 1).padStart(2, '0')}:00`, category: 'personal', repeat: 'none' };
  editingBlock.value = null; showAdd.value = true;
};

const editBlock = (block) => {
  newBlock.value = { ...block };
  editingBlock.value = block; showAdd.value = true;
};

const saveBlock = async () => {
  if (!newBlock.value.title.trim()) return;
  if (editingBlock.value) {
    const idx = blocks.value.findIndex(b => b.id === editingBlock.value.id);
    if (idx > -1) blocks.value[idx] = { ...newBlock.value };
  } else {
    blocks.value.push({ id: Date.now().toString(), ...JSON.parse(JSON.stringify(newBlock.value)), date: dateStr.value });
  }
  if (addToCalendar.value && isCalAuth.value) {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await createEvent({ summary: newBlock.value.title, start: { dateTime: `${dateStr.value}T${newBlock.value.start}:00`, timeZone: tz }, end: { dateTime: `${dateStr.value}T${newBlock.value.end}:00`, timeZone: tz } });
    } catch (e) { console.error('Calendar event creation failed:', e); }
  }
  save(); showAdd.value = false; editingBlock.value = null; addToCalendar.value = false;
};

const deleteBlock = () => {
  if (editingBlock.value) { blocks.value = blocks.value.filter(b => b.id !== editingBlock.value.id); save(); }
  showAdd.value = false; editingBlock.value = null;
};

const saveAsTemplate = () => {
  const name = prompt('Vorlagenname?');
  if (!name) return;
  templates.value.push({ name, blocks: dayBlocks.value.map(b => ({ title: b.title, start: b.start, end: b.end, category: b.category, repeat: b.repeat })) });
  localStorage.setItem('planner_templates', JSON.stringify(templates.value));
};

const applyTemplate = (tpl) => {
  tpl.blocks.forEach(b => { blocks.value.push({ id: Date.now().toString() + Math.random(), ...b, date: dateStr.value }); });
  save();
};

const loadCalendar = async () => {
  if (!isCalAuth.value) return;
  try {
    const start = new Date(selectedDate.value); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 1);
    calendarEvents.value = await fetchCalendarEvents(start.toISOString(), end.toISOString());
  } catch (e) { console.error(e); }
};

const importCalendarEvents = () => {
  let imported = 0;
  calendarEvents.value.forEach(ev => {
    if (!ev.start || !ev.start.dateTime || !ev.end || !ev.end.dateTime) return; // Skip full day events
    
    const stTime = new Date(ev.start.dateTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    const enTime = new Date(ev.end.dateTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    
    // Check for duplicates
    const exists = blocks.value.find(b => b.title === ev.summary && b.start === stTime && b.date === dateStr.value);
    if (!exists) {
      blocks.value.push({
        id: Date.now().toString() + Math.random().toString(),
        title: ev.summary,
        start: stTime,
        end: enTime,
        category: 'personal', // Default category
        repeat: 'none',
        date: dateStr.value
      });
      imported++;
    }
  });
  if (imported > 0) {
    save();
    alert(`${imported} Termine erfolgreich importiert!`);
  } else {
    alert('Keine neuen Termine zum Importieren gefunden.');
  }
};

const save = () => localStorage.setItem('planner_blocks', JSON.stringify(blocks.value));
const load = () => {
  const b = localStorage.getItem('planner_blocks'); if (b) blocks.value = JSON.parse(b);
  const t = localStorage.getItem('planner_templates'); if (t) templates.value = JSON.parse(t);
};
onMounted(async () => { load(); await restoreToken(); loadCalendar(); });
</script>

<style scoped>
.planner-container { min-height:100vh; background:linear-gradient(135deg,#0f0f1e 0%,#1a1a2e 50%,#16213e 100%); padding:2rem; color:white; }
.top-bar { display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; }
.back-btn { display:inline-flex; align-items:center; gap:0.5rem; padding:0.6rem 1.2rem; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:12px; color:rgba(255,255,255,0.8); cursor:pointer; font-size:0.9rem; }
.back-btn:hover { background:rgba(255,255,255,0.12); }
.add-btn { display:inline-flex; align-items:center; gap:0.5rem; padding:0.6rem 1.2rem; background:linear-gradient(135deg,#4facfe,#00f2fe); border:none; border-radius:12px; color:white; font-weight:600; cursor:pointer; font-size:0.9rem; }
.page-title { display:flex; align-items:center; gap:0.75rem; font-size:2.2rem; font-weight:700; margin:0 0 1.5rem; background:linear-gradient(135deg,#fff,#4facfe); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
.title-icon { width:2.5rem; height:2.5rem; }

.day-nav { display:flex; align-items:center; justify-content:center; gap:0.75rem; margin-bottom:1.5rem; flex-wrap:wrap; }
.day-nav button { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:8px; color:white; cursor:pointer; padding:0.4rem 0.6rem; display:flex; align-items:center; gap:0.4rem; }
.day-label { font-weight:600; font-size:1.1rem; min-width:140px; text-align:center; }
.day-label.today { color:#4facfe; }
.today-btn { background:rgba(79,172,254,0.15) !important; border-color:rgba(79,172,254,0.3) !important; color:#4facfe !important; font-size:0.8rem; }
.tomorrow-btn { background:linear-gradient(135deg,#4facfe,#00f2fe) !important; color:white !important; border:none !important; font-size:0.8rem; font-weight:600; padding:0.4rem 0.8rem !important; }

.timeline { display:flex; flex-direction:column; gap:1px; }
.time-row { display:flex; min-height:50px; }
.time-label { width:60px; font-size:0.75rem; color:rgba(255,255,255,0.35); padding-top:2px; flex-shrink:0; }
.time-slot { flex:1; position:relative; border-top:1px solid rgba(255,255,255,0.06); cursor:pointer; min-height:50px; }
.time-slot:hover { background:rgba(255,255,255,0.02); }

.time-block { position:absolute; left:4px; right:4px; border-radius:8px; padding:0.35rem 0.5rem; font-size:0.75rem; cursor:pointer; z-index:1; overflow:hidden; border-left:3px solid; }
.time-block.school { background:rgba(255,217,61,0.15); border-left-color:#ffd93d; }
.time-block.sport { background:rgba(16,185,129,0.15); border-left-color:#10b981; }
.time-block.work { background:rgba(79,172,254,0.15); border-left-color:#4facfe; }
.time-block.personal { background:rgba(162,155,254,0.15); border-left-color:#a29bfe; }
.time-block.social { background:rgba(255,159,243,0.15); border-left-color:#ff9ff3; }
.time-block.travel { background:rgba(255,107,53,0.15); border-left-color:#ff6b35; }
.time-block.free { background:rgba(0,242,254,0.1); border-left-color:#00f2fe; }
.time-block.sleep { background:rgba(99,110,114,0.15); border-left-color:#636e72; }
.tb-title { display:block; font-weight:600; }
.tb-time { display:block; color:rgba(255,255,255,0.4); font-size:0.65rem; }
.tb-repeat { position:absolute; top:4px; right:6px; font-size:0.6rem; }

.cal-events { margin-top:2rem; padding-top:1.5rem; border-top:1px solid rgba(255,255,255,0.08); }
.cal-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; flex-wrap:wrap; gap:0.5rem; }
.cal-header h3 { margin:0; font-size:1rem; }
.cal-event { display:flex; gap:0.75rem; padding:0.5rem 0.75rem; background:rgba(255,255,255,0.04); border-radius:8px; margin-bottom:0.4rem; font-size:0.85rem; border-left:3px solid #a29bfe; }
.ce-time { color:#a29bfe; font-weight:600; min-width:50px; }
.hint-msg { color:rgba(255,255,255,0.4); font-size:0.85rem; font-style:italic; margin-bottom:0.5rem; }

.templates-section { margin-top:2rem; padding-top:1.5rem; border-top:1px solid rgba(255,255,255,0.08); }
.templates-section h3 { margin:0 0 0.75rem; font-size:1rem; }
.template-actions { display:flex; gap:0.5rem; flex-wrap:wrap; }
.tpl-btn { display:flex; align-items:center; gap:0.4rem; padding:0.5rem 0.8rem; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:rgba(255,255,255,0.6); cursor:pointer; font-size:0.8rem; }
.tpl-btn:hover { background:rgba(255,255,255,0.08); }
.tpl-btn.apply { border-color:rgba(79,172,254,0.2); color:#4facfe; }

.modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:1000; padding:1rem; }
.modal-content { background:#1a1a2e; border-radius:16px; max-width:550px; width:100%; max-height:90vh; overflow-y:auto; border:1px solid rgba(79,172,254,0.2); }
.modal-header { display:flex; justify-content:space-between; align-items:center; padding:1.5rem; border-bottom:1px solid rgba(255,255,255,0.1); }
.modal-header h3 { display:flex; align-items:center; gap:0.5rem; margin:0; font-size:1.1rem; }
.mi { width:1.25rem; height:1.25rem; color:#4facfe; }
.modal-close { width:2rem; height:2rem; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:white; cursor:pointer; }
.modal-body { padding:1.5rem; } .modal-footer { display:flex; gap:0.75rem; padding:1.5rem; border-top:1px solid rgba(255,255,255,0.1); }
.fg { margin-bottom:1rem; } .fg label { display:block; color:rgba(255,255,255,0.6); font-size:0.8rem; margin-bottom:0.4rem; }
.fg2 { display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; }
.finput { width:100%; padding:0.65rem 0.9rem; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:10px; color:white; font-size:0.9rem; outline:none; box-sizing:border-box; }
.finput:focus { border-color:#4facfe; } .finput::placeholder { color:rgba(255,255,255,0.3); }
.opt-row { display:flex; gap:0.4rem; flex-wrap:wrap; }
.opt-btn { padding:0.4rem 0.7rem; border-radius:8px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.6); cursor:pointer; font-size:0.78rem; transition:all 0.2s; }
.opt-btn.sel { background:rgba(79,172,254,0.15); border-color:#4facfe; color:#4facfe; }
.checkbox-label { display:flex; align-items:center; gap:0.5rem; font-size:0.85rem; color:rgba(255,255,255,0.7); cursor:pointer; }
.checkbox-label input { accent-color:#4facfe; }
.btn-primary { display:flex; align-items:center; gap:0.5rem; padding:0.7rem 1.3rem; border-radius:10px; background:linear-gradient(135deg,#4facfe,#00f2fe); color:white; font-weight:600; cursor:pointer; border:none; }
.btn-secondary { padding:0.7rem 1.3rem; border-radius:10px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:white; cursor:pointer; }
.btn-danger { display:flex; align-items:center; gap:0.4rem; padding:0.7rem 1.3rem; border-radius:10px; background:rgba(255,107,107,0.15); border:1px solid rgba(255,107,107,0.3); color:#ff6b6b; cursor:pointer; }

@media (max-width:768px) {
  .page-title { font-size:1.6rem; }
  .time-label { width:45px; font-size:0.65rem; }
}
</style>
