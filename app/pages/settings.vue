<template>
  <div class="settings-page">
    <!-- Top Bar -->
    <div class="top-bar">
      <button class="back-btn" @click="navigateTo('/dashboard')">
        <UIcon name="i-heroicons-arrow-left" style="width:16px;height:16px" /> Dashboard
      </button>
      <h1 class="page-title">⚙️ Einstellungen</h1>
    </div>

    <div class="settings-body">

      <!-- ── PROFIL ─────────────────────────────────────────── -->
      <section class="settings-section">
        <h2 class="section-heading">👤 Profil</h2>

        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Name</div>
            <div class="setting-sub">Wird im Dashboard und Begrüßung angezeigt</div>
          </div>
          <input v-model="settings.username" class="setting-input" placeholder="Philipp" />
        </div>

        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">PIN ändern</div>
            <div class="setting-sub">4-stelliger Zugangscode</div>
          </div>
          <div class="pin-change-row">
            <input v-model="newPin" class="setting-input pin-input" type="password" maxlength="4" placeholder="Neuer PIN" inputmode="numeric" />
            <input v-model="newPinConfirm" class="setting-input pin-input" type="password" maxlength="4" placeholder="Wiederholen" inputmode="numeric" />
            <button class="action-btn" :disabled="!pinValid" @click="savePin">Speichern</button>
          </div>
        </div>
        <div v-if="pinError" class="setting-error">{{ pinError }}</div>
        <div v-if="pinSuccess" class="setting-success">PIN wurde gespeichert ✓</div>
      </section>

      <!-- ── WETTER ─────────────────────────────────────────── -->
      <section class="settings-section">
        <h2 class="section-heading">🌤️ Wetter</h2>

        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Stadt / Ort</div>
            <div class="setting-sub">Wird für Wettervorhersagen verwendet</div>
          </div>
          <input v-model="settings.weatherCity" class="setting-input" placeholder="Leopoldshafen" />
        </div>
      </section>

      <!-- ── NACHRICHTEN ─────────────────────────────────────── -->
      <section class="settings-section">
        <h2 class="section-heading">📰 Nachrichten</h2>

        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Standard-Kategorie</div>
            <div class="setting-sub">Beim Öffnen der Nachrichten-Seite</div>
          </div>
          <div class="pill-row">
            <button
              v-for="cat in newsCategories"
              :key="cat.value"
              class="pill-btn"
              :class="{ active: settings.newsDefaultCategory === cat.value }"
              @click="settings.newsDefaultCategory = cat.value"
            >{{ cat.emoji }} {{ cat.label }}</button>
          </div>
        </div>
      </section>

      <!-- ── BÜCHER ─────────────────────────────────────────── -->
      <section class="settings-section">
        <h2 class="section-heading">📚 Bücher</h2>

        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Tägliches Leseziel</div>
            <div class="setting-sub">Seiten pro Tag (Ziel)</div>
          </div>
          <div class="number-row">
            <button class="num-btn" @click="settings.dailyReadingGoal = Math.max(1, (settings.dailyReadingGoal || 20) - 5)">−</button>
            <input v-model.number="settings.dailyReadingGoal" type="number" min="1" max="500" class="setting-input num-input" />
            <button class="num-btn" @click="settings.dailyReadingGoal = Math.min(500, (settings.dailyReadingGoal || 20) + 5)">+</button>
            <span class="num-unit">Seiten</span>
          </div>
        </div>
      </section>

      <!-- ── FITNESS ────────────────────────────────────────── -->
      <section class="settings-section">
        <h2 class="section-heading">💪 Fitness-Übungen</h2>
        <div v-if="fitnessExercises.length === 0" class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Keine Übungen vorhanden</div>
            <div class="setting-sub">Lege zuerst Übungen auf der Fitness-Seite an</div>
          </div>
        </div>
        <div v-else class="toggle-list">
          <div v-for="ex in fitnessExercises" :key="ex.id" class="toggle-row fitness-ex-row">
            <span class="toggle-icon">🏋️</span>
            <span class="toggle-label">{{ ex.name }}</span>
            <div class="ex-inline-goal">
              <input
                v-model.number="ex.goal"
                type="number"
                class="setting-input num-input"
                :title="'Ziel (' + (ex.unit || 'kg') + ')'"
                :placeholder="ex.unit || 'kg'"
              />
              <span class="num-unit">{{ ex.unit || 'kg' }}</span>
            </div>
            <button
              class="toggle-btn"
              :class="{ on: ex.enabled !== false }"
              @click="ex.enabled = ex.enabled === false ? true : false"
            >
              <span class="toggle-knob"></span>
            </button>
          </div>
        </div>
      </section>

      <!-- ── DASHBOARD ──────────────────────────────────────── -->
      <section class="settings-section">
        <h2 class="section-heading">🏠 Dashboard</h2>

        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Sichtbare Karten</div>
            <div class="setting-sub">Wähle, welche Karten im Dashboard erscheinen</div>
          </div>
        </div>
        <div class="toggle-list">
          <div v-for="card in dashboardCards" :key="card.id" class="toggle-row">
            <span class="toggle-icon">{{ card.emoji }}</span>
            <span class="toggle-label">{{ card.label }}</span>
            <button
              class="toggle-btn"
              :class="{ on: !settings.hiddenCards?.includes(card.id) }"
              @click="toggleCard(card.id)"
            >
              <span class="toggle-knob"></span>
            </button>
          </div>
        </div>
      </section>

      <!-- ── PFLEGE (Skincare) ───────────────────────────────── -->
      <section class="settings-section">
        <h2 class="section-heading">🧴 Pflege-Routine</h2>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Morgen-Routine</div>
            <div class="setting-sub">Aktiviere/deaktiviere einzelne Schritte</div>
          </div>
        </div>
        <div class="toggle-list">
          <div v-for="item in skincareItems" :key="item.id" class="toggle-row">
            <span class="toggle-icon">{{ item.emoji }}</span>
            <span class="toggle-label">{{ item.nameLabel }} <span class="toggle-sub">({{ item.time === 'morgen' ? '🌅 Morgen' : '🌙 Abend' }})</span></span>
            <button
              class="toggle-btn"
              :class="{ on: !settings.disabledSkincareItems?.includes(item.id) }"
              @click="toggleSkincareItem(item.id)"
            >
              <span class="toggle-knob"></span>
            </button>
          </div>
        </div>
      </section>

      <!-- ── DATEN ──────────────────────────────────────────── -->
      <section class="settings-section danger-section">
        <h2 class="section-heading">🗑️ Daten</h2>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Alle Daten zurücksetzen</div>
            <div class="setting-sub">Löscht alle gespeicherten Daten (Unwiderruflich!)</div>
          </div>
          <button class="danger-btn" @click="confirmReset">Alles löschen</button>
        </div>
      </section>

      <!-- Save bar -->
      <div class="save-bar">
        <div class="save-hint" v-if="saved">✓ Einstellungen gespeichert</div>
        <button class="save-btn" @click="saveSettings">💾 Speichern</button>
      </div>

    </div>

    <!-- Confirm reset modal -->
    <div v-if="showResetConfirm" class="modal-overlay" @click.self="showResetConfirm = false">
      <div class="modal-box">
        <h3>⚠️ Wirklich alle Daten löschen?</h3>
        <p>Dieser Vorgang ist unwiderruflich. Alle Todos, Bücher, Gewohnheiten, Fitness-Daten, Notizen und Einstellungen werden gelöscht.</p>
        <div class="modal-actions">
          <button class="modal-cancel" @click="showResetConfirm = false">Abbrechen</button>
          <button class="modal-confirm-danger" @click="resetAllData">Ja, alles löschen</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const SETTINGS_KEY = 'app_settings';

const defaultSettings = {
  username: 'Philipp',
  weatherCity: 'Leopoldshafen',
  newsDefaultCategory: 'general',
  dailyReadingGoal: 20,
  hiddenCards: [],
  disabledSkincareItems: [],
};

const settings = ref({ ...defaultSettings });
const saved = ref(false);
const showResetConfirm = ref(false);
const fitnessExercises = ref([]);

// PIN change
const newPin = ref('');
const newPinConfirm = ref('');
const pinError = ref('');
const pinSuccess = ref(false);
const pinValid = computed(() => newPin.value.length === 4 && newPin.value === newPinConfirm.value && /^\d{4}$/.test(newPin.value));

const newsCategories = [
  { value: 'general', label: 'Allgemein', emoji: '🗞️' },
  { value: 'technology', label: 'Tech', emoji: '💻' },
  { value: 'business', label: 'Wirtschaft', emoji: '📈' },
  { value: 'health', label: 'Gesundheit', emoji: '🏥' },
  { value: 'sports', label: 'Sport', emoji: '⚽' },
  { value: 'entertainment', label: 'Unterhaltung', emoji: '🎬' },
  { value: 'science', label: 'Wissenschaft', emoji: '🔬' },
];

const dashboardCards = [
  { id: 'weather', emoji: '🌤️', label: 'Wetter' },
  { id: 'calendar', emoji: '📅', label: 'Termine' },
  { id: 'tasks', emoji: '✅', label: 'Aufgaben' },
  { id: 'news', emoji: '📰', label: 'Nachrichten' },
  { id: 'books', emoji: '📚', label: 'Bücher' },
  { id: 'fitness', emoji: '💪', label: 'Fitness' },
  { id: 'habits', emoji: '🔗', label: 'Gewohnheiten' },
  { id: 'journal', emoji: '📓', label: 'Journal' },
];

const skincareItems = [
  { id: 'morgen-reinigung', nameLabel: 'Reinigung', emoji: '🫧', time: 'morgen' },
  { id: 'morgen-creme',     nameLabel: 'Gesichtscreme', emoji: '🧴', time: 'morgen' },
  { id: 'morgen-sonnen',   nameLabel: 'Sonnenschutz', emoji: '☀️', time: 'morgen' },
  { id: 'morgen-lip',      nameLabel: 'Lip Balm', emoji: '💋', time: 'morgen' },
  { id: 'abend-reinigung', nameLabel: 'Reinigung', emoji: '🫧', time: 'abend' },
  { id: 'abend-creme',     nameLabel: 'Abendcreme', emoji: '🧴', time: 'abend' },
  { id: 'abend-augen',     nameLabel: 'Augencreme', emoji: '👁️', time: 'abend' },
  { id: 'abend-koerper',   nameLabel: 'Körpercreme', emoji: '🪷', time: 'abend' },
];

const toggleCard = (id) => {
  if (!settings.value.hiddenCards) settings.value.hiddenCards = [];
  const idx = settings.value.hiddenCards.indexOf(id);
  if (idx > -1) settings.value.hiddenCards.splice(idx, 1);
  else settings.value.hiddenCards.push(id);
};

const toggleSkincareItem = (id) => {
  if (!settings.value.disabledSkincareItems) settings.value.disabledSkincareItems = [];
  const idx = settings.value.disabledSkincareItems.indexOf(id);
  if (idx > -1) settings.value.disabledSkincareItems.splice(idx, 1);
  else settings.value.disabledSkincareItems.push(id);
};

const savePin = () => {
  pinError.value = '';
  if (!pinValid.value) {
    pinError.value = 'PIN muss 4 Ziffern sein und übereinstimmen.';
    return;
  }
  localStorage.setItem('app_pin', newPin.value);
  pinSuccess.value = true;
  newPin.value = '';
  newPinConfirm.value = '';
  setTimeout(() => { pinSuccess.value = false; }, 3000);
};

const saveSettings = () => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.value));
  // Sync reading goal to existing buecher key
  localStorage.setItem('reading_daily_goal', String(settings.value.dailyReadingGoal));
  // Save fitness exercises (goals + enabled state)
  if (fitnessExercises.value.length > 0) {
    localStorage.setItem('fitness_exercises_v2', JSON.stringify(fitnessExercises.value));
  }
  saved.value = true;
  setTimeout(() => { saved.value = false; }, 2500);
};

const confirmReset = () => { showResetConfirm.value = true; };
const resetAllData = () => {
  localStorage.clear();
  showResetConfirm.value = false;
  navigateTo('/');
};

onMounted(() => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (stored) {
    settings.value = { ...defaultSettings, ...JSON.parse(stored) };
  }
  // Sync reading goal from buecher page if not yet in settings
  if (!settings.value.dailyReadingGoal) {
    const storedGoal = localStorage.getItem('reading_daily_goal');
    if (storedGoal) settings.value.dailyReadingGoal = parseInt(storedGoal);
  }
  // Load fitness exercises
  const fe = localStorage.getItem('fitness_exercises_v2');
  if (fe) fitnessExercises.value = JSON.parse(fe);
});
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: linear-gradient(135deg,#0f0f1e 0%,#1a1a2e 50%,#16213e 100%);
  color: white;
  padding-bottom: 5rem;
}

/* ── Top Bar ────────────────────────────────────────────── */
.top-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: rgba(15,15,30,0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 10px;
  color: rgba(255,255,255,0.8);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
}
.page-title {
  flex: 1;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}

/* ── Body ───────────────────────────────────────────────── */
.settings-body {
  max-width: 700px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ── Sections ───────────────────────────────────────────── */
.settings-section {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 1.25rem;
}
.danger-section { border-color: rgba(255,107,107,0.2); }

.section-heading {
  margin: 0 0 1.1rem;
  font-size: 1rem;
  font-weight: 700;
  color: rgba(255,255,255,0.9);
}

/* ── Setting rows ───────────────────────────────────────── */
.setting-row {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.75rem 0;
  border-top: 1px solid rgba(255,255,255,0.05);
}
.setting-row:first-of-type { border-top: none; }
.setting-info { flex: 1; min-width: 0; }
.setting-label { font-size: 0.92rem; font-weight: 600; margin-bottom: 0.2rem; }
.setting-sub { font-size: 0.75rem; color: rgba(255,255,255,0.4); }

.setting-input {
  padding: 0.55rem 0.85rem;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 10px;
  color: white;
  font-size: 0.9rem;
  outline: none;
  min-width: 140px;
  max-width: 200px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.setting-input:focus { border-color: rgba(79,172,254,0.5); }
.setting-input::placeholder { color: rgba(255,255,255,0.3); }

/* ── PIN row ────────────────────────────────────────────── */
.pin-change-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}
.pin-input { max-width: 110px; min-width: 90px; }
.action-btn {
  padding: 0.55rem 1rem;
  background: rgba(79,172,254,0.15);
  border: 1px solid rgba(79,172,254,0.35);
  border-radius: 10px;
  color: #4facfe;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;
}
.action-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.setting-error { font-size: 0.8rem; color: #ff6b6b; margin-top: 0.4rem; }
.setting-success { font-size: 0.8rem; color: #10b981; margin-top: 0.4rem; }

/* ── Pill row ───────────────────────────────────────────── */
.pill-row {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  flex: 1;
  justify-content: flex-end;
}
.pill-btn {
  padding: 0.4rem 0.75rem;
  border-radius: 20px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.6);
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.pill-btn.active {
  background: rgba(79,172,254,0.15);
  border-color: #4facfe;
  color: #4facfe;
  font-weight: 600;
}

/* ── Number input ───────────────────────────────────────── */
.number-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.num-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.12);
  color: white;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.num-input {
  width: 70px;
  min-width: 70px;
  max-width: 70px;
  text-align: center;
}
.num-unit { font-size: 0.82rem; color: rgba(255,255,255,0.45); }

/* ── Toggle list ────────────────────────────────────────── */
.toggle-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 0.5rem;
}
.toggle-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  background: rgba(255,255,255,0.03);
  border-radius: 10px;
}
.toggle-icon { font-size: 1.1rem; flex-shrink: 0; }
.toggle-label { flex: 1; font-size: 0.88rem; font-weight: 500; }
.toggle-sub { font-size: 0.72rem; color: rgba(255,255,255,0.35); }
.toggle-btn {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: rgba(255,255,255,0.12);
  border: none;
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
}
.toggle-btn.on { background: #10b981; }
.toggle-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  transition: transform 0.2s;
}
.toggle-btn.on .toggle-knob { transform: translateX(20px); }

.fitness-ex-row { align-items: center; gap: 0.6rem; }
.ex-inline-goal { display: flex; align-items: center; gap: 0.3rem; margin-left: auto; margin-right: 0.5rem; }
.ex-inline-goal .num-input { width: 60px; min-width: 60px; max-width: 60px; text-align: center; padding: 0.4rem 0.5rem; font-size: 0.85rem; }

/* ── Danger ─────────────────────────────────────────────── */
.danger-btn {
  padding: 0.6rem 1.1rem;
  background: rgba(255,107,107,0.12);
  border: 1px solid rgba(255,107,107,0.3);
  border-radius: 10px;
  color: #ff6b6b;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;
}

/* ── Save bar ───────────────────────────────────────────── */
.save-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  padding: 0.9rem 1.5rem;
  background: rgba(15,15,30,0.97);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255,255,255,0.08);
  z-index: 50;
}
.save-hint { font-size: 0.85rem; color: #10b981; font-weight: 600; flex: 1; }
.save-btn {
  padding: 0.7rem 1.8rem;
  background: linear-gradient(135deg,#4facfe,#00f2fe);
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
}

/* ── Modal ──────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
.modal-box {
  background: #1a1a2e;
  border: 1px solid rgba(255,107,107,0.3);
  border-radius: 16px;
  max-width: 420px;
  width: 100%;
  padding: 1.75rem;
}
.modal-box h3 { margin: 0 0 0.75rem; font-size: 1.1rem; }
.modal-box p { color: rgba(255,255,255,0.65); font-size: 0.88rem; line-height: 1.5; margin: 0 0 1.5rem; }
.modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }
.modal-cancel {
  padding: 0.65rem 1.2rem;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 10px;
  color: white;
  cursor: pointer;
  font-size: 0.88rem;
}
.modal-confirm-danger {
  padding: 0.65rem 1.2rem;
  background: rgba(255,107,107,0.15);
  border: 1px solid rgba(255,107,107,0.35);
  border-radius: 10px;
  color: #ff6b6b;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.88rem;
}

/* ── Mobile ─────────────────────────────────────────────── */
@media (max-width: 600px) {
  .setting-row { flex-direction: column; gap: 0.75rem; }
  .setting-input { max-width: 100%; min-width: 0; width: 100%; }
  .pill-row { justify-content: flex-start; }
  .pin-change-row { flex-direction: column; align-items: stretch; }
  .pin-input { max-width: 100%; }
}
</style>
