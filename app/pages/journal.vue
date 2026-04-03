<template>
  <div class="journal-container">
    <div class="top-bar">
      <button class="back-btn" @click="navigateTo('/dashboard')">
        <UIcon name="i-heroicons-arrow-left" /> Dashboard
      </button>
      <div class="top-actions">
        <button class="filter-toggle" @click="showSearch = !showSearch">
          <UIcon name="i-heroicons-magnifying-glass" />
        </button>
        <button class="add-btn" @click="openNewEntry">
          <UIcon name="i-heroicons-plus" /> Neuer Eintrag
        </button>
      </div>
    </div>

    <h1 class="page-title"><UIcon name="i-heroicons-book-open" class="title-icon" />Mein Tagebuch</h1>
    <p class="page-subtitle">Gedanken, Dankbarkeit & Reflexion</p>

    <!-- Stats -->
    <div class="stats-bar">
      <div class="stat-box">
        <div class="stat-val">{{ journalEntries.length }}</div>
        <div class="stat-lbl">Einträge</div>
      </div>
      <div class="stat-box">
        <div class="stat-val">{{ currentStreak }} 🔥</div>
        <div class="stat-lbl">Tage Streak</div>
      </div>
      <div class="stat-box">
        <div class="stat-val">{{ totalWords }}</div>
        <div class="stat-lbl">Wörter gesamt</div>
      </div>
      <div class="stat-box glow">
        <div class="stat-val">{{ avgMood || '—' }}</div>
        <div class="stat-lbl">Ø Stimmung</div>
      </div>
    </div>

    <!-- Search -->
    <div v-if="showSearch" class="search-box">
      <UIcon name="i-heroicons-magnifying-glass" class="search-icon" />
      <input v-model="searchQuery" type="text" placeholder="Einträge durchsuchen..." class="search-input" />
      <button v-if="searchQuery" class="clear-search" @click="searchQuery = ''"><UIcon name="i-heroicons-x-mark" /></button>
    </div>

    <!-- Main Content -->
    <div class="journal-layout">
      <!-- Today's Entry -->
      <div class="today-panel">
        <div class="today-header">
          <div class="today-label">
            <span class="today-badge">Heute</span>
            <span class="today-date">{{ formatDate(new Date()) }}</span>
          </div>
          <div class="mood-selector">
            <span class="mood-label">Stimmung:</span>
            <div class="mood-buttons">
              <button v-for="m in moods" :key="m.value" class="mood-btn" :class="{ active: todayMood === m.value }" @click="todayMood = m.value" :title="m.label">
                {{ m.emoji }}
              </button>
            </div>
          </div>
        </div>

        <!-- Prompts -->
        <div class="prompts-section">
          <button class="prompts-toggle" @click="showPrompts = !showPrompts">
            <UIcon name="i-heroicons-light-bulb" /> {{ showPrompts ? 'Prompts verbergen' : 'Schreibimpuls anzeigen' }}
          </button>
          <div v-if="showPrompts" class="prompts-list">
            <button v-for="p in dailyPrompts" :key="p" class="prompt-chip" @click="appendPrompt(p)">
              {{ p }}
            </button>
          </div>
        </div>

        <!-- Writing sections -->
        <div class="writing-sections">
          <div class="section-tab-bar">
            <button v-for="s in sections" :key="s.id" class="sec-tab" :class="{ active: activeSection === s.id }" @click="activeSection = s.id">
              {{ s.icon }} {{ s.label }}
            </button>
          </div>

          <div v-for="s in sections" :key="s.id" v-show="activeSection === s.id" class="writing-area">
            <textarea
              v-model="todayEntry[s.id]"
              :placeholder="s.placeholder"
              class="journal-textarea"
              rows="8"
              @input="autoSave"
            ></textarea>
            <div class="word-count">{{ countWords(todayEntry[s.id]) }} Wörter</div>
          </div>
        </div>

        <!-- Gratitude -->
        <div class="gratitude-section">
          <h4><span class="g-icon">🙏</span> Heute dankbar für...</h4>
          <div class="gratitude-items">
            <div v-for="(g, i) in todayGratitude" :key="i" class="gratitude-item">
              <span class="g-num">{{ i + 1 }}.</span>
              <input v-model="todayGratitude[i]" type="text" placeholder="z.B. gute Gesundheit..." class="g-input" @input="autoSave" />
            </div>
          </div>
        </div>

        <div class="save-row">
          <button class="save-btn" @click="saveEntry" :class="{ saved: justSaved }">
            <UIcon :name="justSaved ? 'i-heroicons-check' : 'i-heroicons-arrow-down-tray'" />
            {{ justSaved ? 'Gespeichert!' : 'Speichern' }}
          </button>
          <span v-if="autoSavedAt" class="autosave-info">Auto-gespeichert {{ autoSavedAt }}</span>
        </div>
      </div>

      <!-- History Panel -->
      <div class="history-panel">
        <h3 class="history-title">
          <UIcon name="i-heroicons-clock" /> Vergangene Einträge
        </h3>

        <div v-if="filteredEntries.length === 0" class="empty-state">
          <UIcon name="i-heroicons-document-text" />
          <p v-if="searchQuery">Keine Einträge gefunden</p>
          <p v-else>Noch keine vergangenen Einträge</p>
        </div>

        <div class="entries-list">
          <div
            v-for="entry in filteredEntries"
            :key="entry.date"
            class="entry-card"
            :class="{ active: viewingEntry?.date === entry.date }"
            @click="viewEntry(entry)"
          >
            <div class="entry-header">
              <span class="entry-date">{{ formatDate(new Date(entry.date)) }}</span>
              <span v-if="entry.mood" class="entry-mood">{{ moods.find(m => m.value === entry.mood)?.emoji }}</span>
            </div>
            <p class="entry-preview">{{ getPreview(entry) }}</p>
            <div class="entry-stats">
              <span><UIcon name="i-heroicons-document-text" /> {{ countEntryWords(entry) }} Wörter</span>
              <span v-if="entry.gratitude?.filter(g => g).length"><UIcon name="i-heroicons-heart" /> {{ entry.gratitude.filter(g => g).length }}x dankbar</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- View Entry Modal -->
    <div v-if="viewingEntry && viewingEntry.date !== todayStr" class="modal-overlay" @click="viewingEntry = null">
      <div class="modal-content modal-lg" @click.stop>
        <div class="modal-header">
          <h3>{{ formatDate(new Date(viewingEntry.date)) }} {{ moods.find(m => m.value === viewingEntry.mood)?.emoji }}</h3>
          <div class="modal-actions">
            <button class="btn-danger-sm" @click="deleteEntry(viewingEntry.date)"><UIcon name="i-heroicons-trash" /></button>
            <button class="modal-close" @click="viewingEntry = null"><UIcon name="i-heroicons-x-mark" /></button>
          </div>
        </div>
        <div class="modal-body">
          <div v-for="s in sections" :key="s.id">
            <div v-if="viewingEntry[s.id]" class="view-section">
              <h4 class="vs-title">{{ s.icon }} {{ s.label }}</h4>
              <p class="vs-content">{{ viewingEntry[s.id] }}</p>
            </div>
          </div>
          <div v-if="viewingEntry.gratitude?.filter(g => g).length" class="view-section">
            <h4 class="vs-title">🙏 Dankbarkeit</h4>
            <ul class="gratitude-view">
              <li v-for="g in viewingEntry.gratitude.filter(g => g)" :key="g">{{ g }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const todayStr = computed(() => new Date().toISOString().split('T')[0]);

const journalEntries = ref([]);
const showSearch = ref(false);
const searchQuery = ref('');
const showPrompts = ref(false);
const viewingEntry = ref(null);
const justSaved = ref(false);
const autoSavedAt = ref('');
let autoSaveTimer = null;

const activeSection = ref('reflections');
const todayMood = ref(0);
const todayGratitude = ref(['', '', '']);

const sections = [
  { id: 'reflections', label: 'Reflexion', icon: '💭', placeholder: 'Wie war dein Tag? Was hast du erlebt? Was hast du gelernt? Was würdest du anders machen?' },
  { id: 'goals', label: 'Ziele morgen', icon: '🎯', placeholder: 'Was möchtest du morgen erreichen? Welche wichtigen Aufgaben stehen an?' },
  { id: 'thoughts', label: 'Gedanken', icon: '🧠', placeholder: 'Was beschäftigt dich? Gedanken, Ideen, Fragen die dir durch den Kopf gehen...' },
  { id: 'wins', label: 'Erfolge', icon: '🏆', placeholder: 'Was hat heute gut geklappt? Welche kleinen oder großen Erfolge hattest du?' },
];

const moods = [
  { value: 1, emoji: '😢', label: 'Sehr schlecht' },
  { value: 2, emoji: '😟', label: 'Schlecht' },
  { value: 3, emoji: '😐', label: 'OK' },
  { value: 4, emoji: '🙂', label: 'Gut' },
  { value: 5, emoji: '😄', label: 'Sehr gut' },
  { value: 6, emoji: '🤩', label: 'Fantastisch' },
];

const dailyPrompts = [
  'Wofür bin ich heute dankbar?',
  'Was hat mich heute überrascht?',
  'Was möchte ich als nächstes erreichen?',
  'Wer hat mich heute positiv beeinflusst?',
  'Was habe ich heute über mich gelernt?',
  'Was würde ich meinem jüngeren Ich raten?',
  'Was macht mich heute glücklich?',
  'Welche Herausforderung hat mich heute stärker gemacht?',
];

const todayEntry = ref({ reflections: '', goals: '', thoughts: '', wins: '' });

const totalWords = computed(() => {
  return journalEntries.value.reduce((sum, e) => sum + countEntryWords(e), 0);
});

const avgMood = computed(() => {
  const withMood = journalEntries.value.filter(e => e.mood);
  if (!withMood.length) return 0;
  const avg = withMood.reduce((s, e) => s + e.mood, 0) / withMood.length;
  return moods.find(m => m.value === Math.round(avg))?.emoji || '';
});

const currentStreak = computed(() => {
  let s = 0;
  const d = new Date();
  const dates = new Set(journalEntries.value.map(e => e.date));
  while (dates.has(d.toISOString().split('T')[0])) {
    s++;
    d.setDate(d.getDate() - 1);
  }
  return s;
});

const filteredEntries = computed(() => {
  let entries = journalEntries.value.filter(e => e.date !== todayStr.value);
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    entries = entries.filter(e =>
      (e.reflections || '').toLowerCase().includes(q) ||
      (e.thoughts || '').toLowerCase().includes(q) ||
      (e.wins || '').toLowerCase().includes(q) ||
      (e.goals || '').toLowerCase().includes(q) ||
      (e.gratitude || []).some(g => g.toLowerCase().includes(q))
    );
  }
  return entries.sort((a, b) => b.date.localeCompare(a.date));
});

const formatDate = (date) => {
  return date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const countWords = (text) => {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
};

const countEntryWords = (entry) => {
  return countWords(entry.reflections) + countWords(entry.thoughts) + countWords(entry.wins) + countWords(entry.goals);
};

const getPreview = (entry) => {
  const text = entry.reflections || entry.thoughts || entry.wins || entry.goals || '';
  return text.length > 120 ? text.substring(0, 120) + '...' : text || 'Kein Text';
};

const appendPrompt = (prompt) => {
  const cur = todayEntry.value[activeSection.value];
  todayEntry.value[activeSection.value] = cur ? cur + '\n\n' + prompt + '\n' : prompt + '\n';
};

const autoSave = () => {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    save(false);
    autoSavedAt.value = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }, 2000);
};

const saveEntry = () => {
  save(true);
  justSaved.value = true;
  setTimeout(() => (justSaved.value = false), 2500);
};

const save = (showFeedback = false) => {
  const today = todayStr.value;
  const existing = journalEntries.value.findIndex(e => e.date === today);
  const entry = {
    date: today,
    mood: todayMood.value,
    gratitude: [...todayGratitude.value],
    ...todayEntry.value,
    timestamp: new Date().toISOString(),
  };
  if (existing > -1) {
    journalEntries.value[existing] = entry;
  } else {
    journalEntries.value.unshift(entry);
  }
  localStorage.setItem('journal_entries_v2', JSON.stringify(journalEntries.value));
};

const viewEntry = (entry) => {
  viewingEntry.value = entry;
};

const deleteEntry = (date) => {
  if (!confirm('Eintrag wirklich löschen?')) return;
  journalEntries.value = journalEntries.value.filter(e => e.date !== date);
  localStorage.setItem('journal_entries_v2', JSON.stringify(journalEntries.value));
  viewingEntry.value = null;
};

const openNewEntry = () => {
  activeSection.value = 'reflections';
  const el = document.querySelector('.writing-area textarea');
  if (el) el.focus();
};

const load = () => {
  // Load new format
  const newData = localStorage.getItem('journal_entries_v2');
  if (newData) {
    journalEntries.value = JSON.parse(newData);
  } else {
    // Migrate old format from dashboard
    const oldData = localStorage.getItem('dashboard_journal_entries');
    if (oldData) {
      const old = JSON.parse(oldData);
      journalEntries.value = old.map(e => ({
        date: e.date,
        reflections: e.content || '',
        mood: 0,
        gratitude: ['', '', ''],
        timestamp: e.timestamp,
      }));
      localStorage.setItem('journal_entries_v2', JSON.stringify(journalEntries.value));
    }
  }

  // Load today's data
  const today = journalEntries.value.find(e => e.date === todayStr.value);
  if (today) {
    todayEntry.value = {
      reflections: today.reflections || '',
      goals: today.goals || '',
      thoughts: today.thoughts || '',
      wins: today.wins || '',
    };
    todayMood.value = today.mood || 0;
    todayGratitude.value = today.gratitude?.length >= 3 ? today.gratitude : ['', '', ''];
  }
};

onMounted(() => load());
onBeforeUnmount(() => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
});
</script>

<style scoped>
.journal-container { min-height:100vh; background:linear-gradient(135deg,#0f0f1e 0%,#1a1a2e 50%,#16213e 100%); padding:2rem; color:white; }
.top-bar { display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; }
.back-btn { display:inline-flex; align-items:center; gap:0.5rem; padding:0.6rem 1.2rem; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:12px; color:rgba(255,255,255,0.8); cursor:pointer; font-size:0.9rem; }
.back-btn:hover { background:rgba(255,255,255,0.12); }
.top-actions { display:flex; gap:0.5rem; }
.filter-toggle { padding:0.6rem 0.75rem; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:12px; color:rgba(255,255,255,0.7); cursor:pointer; display:flex; align-items:center; }
.add-btn { display:inline-flex; align-items:center; gap:0.5rem; padding:0.6rem 1.2rem; background:linear-gradient(135deg,#ffecd2,#fcb69f); border:none; border-radius:12px; color:#1a1a2e; font-weight:700; cursor:pointer; font-size:0.9rem; }

.page-title { display:flex; align-items:center; gap:0.75rem; font-size:2.2rem; font-weight:700; margin:0 0 0.5rem; background:linear-gradient(135deg,#ffecd2,#fcb69f); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
.title-icon { width:2.5rem; height:2.5rem; }
.page-subtitle { color:rgba(255,255,255,0.5); margin:0 0 1.5rem; }

.stats-bar { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:1.5rem; }
.stat-box { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:1rem; text-align:center; }
.stat-box.glow { border-color:rgba(252,182,159,0.3); }
.stat-val { font-size:1.5rem; font-weight:700; color:#fcb69f; }
.stat-lbl { color:rgba(255,255,255,0.5); font-size:0.75rem; margin-top:0.2rem; }

.search-box { display:flex; align-items:center; gap:0.5rem; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:12px; padding:0.6rem 1rem; margin-bottom:1.5rem; }
.search-icon { color:rgba(255,255,255,0.4); width:1rem; height:1rem; }
.search-input { flex:1; background:none; border:none; color:white; font-size:0.9rem; outline:none; }
.search-input::placeholder { color:rgba(255,255,255,0.3); }
.clear-search { background:none; border:none; color:rgba(255,255,255,0.4); cursor:pointer; padding:0; display:flex; }

.journal-layout { display:grid; grid-template-columns:1fr 360px; gap:1.5rem; align-items:start; }

.today-panel { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:20px; padding:1.5rem; }

.today-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.25rem; flex-wrap:wrap; gap:0.75rem; }
.today-label { display:flex; flex-direction:column; gap:0.2rem; }
.today-badge { display:inline-block; background:linear-gradient(135deg,#ffecd2,#fcb69f); color:#1a1a2e; padding:0.2rem 0.75rem; border-radius:20px; font-size:0.75rem; font-weight:700; width:fit-content; }
.today-date { color:rgba(255,255,255,0.5); font-size:0.85rem; }
.mood-selector { display:flex; align-items:center; gap:0.5rem; }
.mood-label { color:rgba(255,255,255,0.5); font-size:0.8rem; }
.mood-buttons { display:flex; gap:0.25rem; }
.mood-btn { width:34px; height:34px; border-radius:8px; border:2px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); font-size:1.1rem; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; justify-content:center; }
.mood-btn:hover { border-color:rgba(252,182,159,0.5); transform:scale(1.1); }
.mood-btn.active { border-color:#fcb69f; background:rgba(252,182,159,0.2); transform:scale(1.15); }

.prompts-section { margin-bottom:1.25rem; }
.prompts-toggle { display:inline-flex; align-items:center; gap:0.4rem; padding:0.4rem 0.8rem; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:rgba(255,255,255,0.6); font-size:0.8rem; cursor:pointer; transition:all 0.2s; }
.prompts-toggle:hover { background:rgba(255,255,255,0.08); }
.prompts-list { display:flex; flex-wrap:wrap; gap:0.4rem; margin-top:0.75rem; }
.prompt-chip { padding:0.35rem 0.7rem; background:rgba(252,182,159,0.1); border:1px solid rgba(252,182,159,0.2); border-radius:8px; color:rgba(252,182,159,0.9); font-size:0.75rem; cursor:pointer; transition:all 0.2s; }
.prompt-chip:hover { background:rgba(252,182,159,0.2); }

.section-tab-bar { display:flex; gap:0.3rem; margin-bottom:1rem; background:rgba(255,255,255,0.04); border-radius:12px; padding:4px; overflow-x:auto; }
.sec-tab { flex:1; min-width:fit-content; padding:0.5rem 0.75rem; border-radius:9px; background:none; border:none; color:rgba(255,255,255,0.45); cursor:pointer; font-size:0.8rem; white-space:nowrap; transition:all 0.2s; }
.sec-tab.active { background:rgba(252,182,159,0.2); color:#fcb69f; }

.journal-textarea { width:100%; padding:0.9rem; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:white; font-size:0.9rem; line-height:1.6; outline:none; resize:vertical; box-sizing:border-box; font-family:inherit; }
.journal-textarea:focus { border-color:rgba(252,182,159,0.4); }
.journal-textarea::placeholder { color:rgba(255,255,255,0.25); }
.word-count { text-align:right; font-size:0.75rem; color:rgba(255,255,255,0.3); margin-top:0.4rem; }

.gratitude-section { margin-top:1.25rem; }
.gratitude-section h4 { display:flex; align-items:center; gap:0.5rem; font-size:0.9rem; font-weight:600; margin:0 0 0.75rem; color:rgba(255,255,255,0.8); }
.g-icon { font-size:1.1rem; }
.gratitude-items { display:flex; flex-direction:column; gap:0.5rem; }
.gratitude-item { display:flex; align-items:center; gap:0.5rem; }
.g-num { color:rgba(252,182,159,0.7); font-size:0.85rem; font-weight:600; min-width:20px; }
.g-input { flex:1; padding:0.55rem 0.8rem; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:white; font-size:0.85rem; outline:none; }
.g-input:focus { border-color:rgba(252,182,159,0.4); }
.g-input::placeholder { color:rgba(255,255,255,0.25); }

.save-row { display:flex; align-items:center; gap:1rem; margin-top:1.25rem; }
.save-btn { display:inline-flex; align-items:center; gap:0.5rem; padding:0.7rem 1.5rem; background:linear-gradient(135deg,#ffecd2,#fcb69f); border:none; border-radius:12px; color:#1a1a2e; font-weight:700; cursor:pointer; transition:all 0.3s; }
.save-btn.saved { background:linear-gradient(135deg,#10b981,#34d399); color:white; }
.autosave-info { color:rgba(255,255,255,0.35); font-size:0.75rem; }

/* History Panel */
.history-panel { position:sticky; top:1.5rem; }
.history-title { display:flex; align-items:center; gap:0.5rem; font-size:1rem; font-weight:600; margin:0 0 1rem; color:rgba(255,255,255,0.7); }

.entries-list { display:flex; flex-direction:column; gap:0.6rem; max-height:75vh; overflow-y:auto; }
.entry-card { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:1rem; cursor:pointer; transition:all 0.2s; }
.entry-card:hover { background:rgba(255,255,255,0.07); border-color:rgba(252,182,159,0.2); }
.entry-card.active { border-color:rgba(252,182,159,0.4); background:rgba(252,182,159,0.08); }
.entry-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem; }
.entry-date { font-size:0.8rem; font-weight:600; color:rgba(255,255,255,0.7); }
.entry-mood { font-size:1.2rem; }
.entry-preview { font-size:0.8rem; color:rgba(255,255,255,0.45); line-height:1.5; margin:0 0 0.5rem; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.entry-stats { display:flex; gap:0.75rem; font-size:0.7rem; color:rgba(255,255,255,0.35); }
.entry-stats span { display:flex; align-items:center; gap:0.2rem; }

.empty-state { display:flex; flex-direction:column; align-items:center; gap:0.5rem; padding:2rem; color:rgba(255,255,255,0.3); text-align:center; }
.empty-state svg { width:2.5rem; height:2.5rem; }

/* Modal */
.modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:1000; padding:1rem; }
.modal-content { background:#1a1a2e; border-radius:20px; max-width:700px; width:100%; max-height:88vh; overflow-y:auto; border:1px solid rgba(252,182,159,0.2); }
.modal-content.modal-lg { max-width:750px; }
.modal-header { display:flex; justify-content:space-between; align-items:center; padding:1.25rem 1.5rem; border-bottom:1px solid rgba(255,255,255,0.08); }
.modal-header h3 { margin:0; font-size:1.1rem; }
.modal-actions { display:flex; gap:0.5rem; }
.modal-close { width:2rem; height:2rem; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:white; cursor:pointer; }
.btn-danger-sm { width:2rem; height:2rem; display:flex; align-items:center; justify-content:center; background:rgba(255,107,107,0.1); border:1px solid rgba(255,107,107,0.3); border-radius:8px; color:#ff6b6b; cursor:pointer; }
.modal-body { padding:1.5rem; }
.view-section { margin-bottom:1.25rem; }
.vs-title { font-size:0.85rem; font-weight:600; color:rgba(252,182,159,0.8); margin:0 0 0.5rem; }
.vs-content { font-size:0.9rem; color:rgba(255,255,255,0.7); line-height:1.6; margin:0; white-space:pre-wrap; }
.gratitude-view { margin:0; padding-left:1.2rem; }
.gratitude-view li { color:rgba(255,255,255,0.7); font-size:0.9rem; margin-bottom:0.3rem; }

@media (max-width: 900px) {
  .journal-layout { grid-template-columns:1fr; }
  .history-panel { position:static; }
  .stats-bar { grid-template-columns:repeat(2,1fr); }
}
@media (max-width: 600px) {
  .journal-container { padding:1rem; }
  .page-title { font-size:1.6rem; }
}
</style>
