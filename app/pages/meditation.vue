<template>
  <div class="meditation-container">
    <div class="top-bar">
      <button class="back-btn" @click="navigateTo('/dashboard')">
        <UIcon name="i-heroicons-arrow-left" /> Dashboard
      </button>
    </div>

    <h1 class="page-title"><span class="title-emoji">🧘</span> Meditation</h1>
    <p class="page-subtitle">Finde deine innere Ruhe</p>

    <!-- Tabs -->
    <div class="tabs">
      <button :class="{ active: tab === 'timer' }" @click="tab = 'timer'">⏱ Timer</button>
      <button :class="{ active: tab === 'breathe' }" @click="tab = 'breathe'">🌬 Atemübung</button>
      <button :class="{ active: tab === 'history' }" @click="tab = 'history'">📊 Verlauf</button>
    </div>

    <!-- TIMER TAB -->
    <div v-if="tab === 'timer'" class="tab-content">
      <!-- Duration selector -->
      <div v-if="!timerRunning && timerTime === selectedDuration * 60" class="duration-picker">
        <h3>Dauer wählen</h3>
        <div class="duration-options">
          <button v-for="d in durations" :key="d" class="duration-btn" :class="{ active: selectedDuration === d }" @click="selectDuration(d)">
            {{ d }} Min
          </button>
        </div>
        <div class="sound-picker">
          <h3>Hintergrundton</h3>
          <div class="sound-options">
            <button v-for="s in sounds" :key="s.id" class="sound-btn" :class="{ active: selectedSound === s.id }" @click="selectedSound = s.id">
              {{ s.emoji }} {{ s.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Timer Circle -->
      <div class="timer-area">
        <div class="meditation-circle">
          <svg viewBox="0 0 240 240" class="timer-svg">
            <circle cx="120" cy="120" r="108" class="circle-bg" />
            <circle
              cx="120" cy="120" r="108"
              class="circle-progress"
              :style="{ strokeDashoffset: timerDashoffset }"
            />
          </svg>
          <div class="timer-inner">
            <div class="timer-display">{{ timerDisplay }}</div>
            <div class="timer-label">{{ timerStatusLabel }}</div>
          </div>
        </div>

        <div class="breathing-guide" v-if="timerRunning">
          <div class="breath-circle" :class="breathPhase"></div>
          <p class="breath-text">{{ breathLabel }}</p>
        </div>

        <div class="timer-controls">
          <button v-if="!timerRunning" class="control-btn start-btn" @click="startTimer">
            <UIcon name="i-heroicons-play" />
            {{ timerTime === selectedDuration * 60 ? 'Starten' : 'Fortsetzen' }}
          </button>
          <button v-if="timerRunning" class="control-btn pause-btn" @click="pauseTimer">
            <UIcon name="i-heroicons-pause" /> Pause
          </button>
          <button class="control-btn reset-btn" @click="resetTimer">
            <UIcon name="i-heroicons-arrow-path" /> Reset
          </button>
        </div>
      </div>

      <!-- Completed session -->
      <div v-if="timerTime === 0 && !timerRunning" class="session-complete">
        <div class="complete-emoji">🙏</div>
        <h2>Meditation abgeschlossen!</h2>
        <p>Du hast {{ selectedDuration }} Minuten meditiert.</p>
        <div class="session-note-area">
          <textarea v-model="sessionNote" placeholder="Wie war deine Session? Gedanken oder Gefühle notieren..." class="session-note" rows="3"></textarea>
        </div>
        <button class="save-session-btn" @click="saveSession">
          <UIcon name="i-heroicons-check" /> Session speichern
        </button>
      </div>
    </div>

    <!-- BREATHE TAB -->
    <div v-if="tab === 'breathe'" class="tab-content">
      <div class="breathe-header">
        <h3>Atemübungen</h3>
        <p class="subtitle-text">Wähle eine Technik und folge dem Rhythmus</p>
      </div>

      <div class="breathe-techniques">
        <div
          v-for="tech in breatheTechniques"
          :key="tech.id"
          class="technique-card"
          :class="{ active: activeTechnique?.id === tech.id && breatheRunning }"
          @click="selectTechnique(tech)"
        >
          <div class="tech-emoji">{{ tech.emoji }}</div>
          <h4>{{ tech.name }}</h4>
          <p>{{ tech.description }}</p>
          <div class="tech-pattern">
            <span>Einatmen: {{ tech.inhale }}s</span>
            <span v-if="tech.hold">Halten: {{ tech.hold }}s</span>
            <span>Ausatmen: {{ tech.exhale }}s</span>
          </div>
        </div>
      </div>

      <div v-if="activeTechnique" class="breathe-player">
        <div class="breathe-visual">
          <div class="breathe-ring" :class="breatheState" :style="{ '--duration': breatheStateDuration + 's' }"></div>
          <div class="breathe-center">
            <div class="breathe-state-label">{{ breatheStateLabel }}</div>
            <div class="breathe-countdown">{{ breatheCountdown }}</div>
          </div>
        </div>

        <div class="breathe-round">Runde {{ breatheRound }} / {{ breatheTargetRounds }}</div>

        <div class="breathe-controls">
          <button v-if="!breatheRunning" class="control-btn start-btn" @click="startBreathe">
            <UIcon name="i-heroicons-play" /> Starten
          </button>
          <button v-if="breatheRunning" class="control-btn pause-btn" @click="stopBreathe">
            <UIcon name="i-heroicons-stop" /> Stoppen
          </button>
        </div>
      </div>
    </div>

    <!-- HISTORY TAB -->
    <div v-if="tab === 'history'" class="tab-content">
      <div class="history-stats">
        <div class="hs-card">
          <div class="hs-val">{{ sessions.length }}</div>
          <div class="hs-lbl">Sessions gesamt</div>
        </div>
        <div class="hs-card">
          <div class="hs-val">{{ totalMinutes }}</div>
          <div class="hs-lbl">Minuten gesamt</div>
        </div>
        <div class="hs-card">
          <div class="hs-val">{{ meditationStreak }} 🔥</div>
          <div class="hs-lbl">Streak</div>
        </div>
        <div class="hs-card">
          <div class="hs-val">{{ todaySessions }}</div>
          <div class="hs-lbl">Heute</div>
        </div>
      </div>

      <!-- 14-day view -->
      <div class="streak-heatmap">
        <h4>Letzte 14 Tage</h4>
        <div class="heatmap-row">
          <div v-for="d in last14Days" :key="d.date" class="hm-cell" :class="{ done: d.done }" :title="d.label">
            <span class="hm-date">{{ d.short }}</span>
            <span v-if="d.done" class="hm-check">✓</span>
          </div>
        </div>
      </div>

      <div v-if="sessions.length === 0" class="empty">
        <span>🧘</span>
        <p>Noch keine Sessions. Starte deine erste Meditation!</p>
      </div>
      <div class="session-list">
        <div v-for="s in sessions.slice().reverse().slice(0, 20)" :key="s.id" class="session-item">
          <div class="si-left">
            <div class="si-date">{{ formatDate(s.date) }}</div>
            <div v-if="s.note" class="si-note">{{ s.note }}</div>
          </div>
          <div class="si-right">
            <span class="si-dur">{{ s.duration }} Min</span>
            <span class="si-sound">{{ sounds.find(x => x.id === s.sound)?.emoji || '🔕' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const tab = ref('timer');

// Timer state
const durations = [3, 5, 10, 15, 20, 30];
const selectedDuration = ref(5);
const timerTime = ref(300);
const timerRunning = ref(false);
let timerInterval = null;

const sounds = [
  { id: 'none', emoji: '🔕', label: 'Kein Ton' },
  { id: 'bowl', emoji: '🔔', label: 'Klangschale' },
  { id: 'rain', emoji: '🌧', label: 'Regen' },
  { id: 'ocean', emoji: '🌊', label: 'Ozean' },
  { id: 'forest', emoji: '🌲', label: 'Wald' },
];
const selectedSound = ref('none');
const sessionNote = ref('');

const timerDisplay = computed(() => {
  const m = Math.floor(timerTime.value / 60);
  const s = timerTime.value % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
});

const timerDashoffset = computed(() => {
  const total = selectedDuration.value * 60;
  const pct = timerTime.value / total;
  const circ = 2 * Math.PI * 108;
  return circ - pct * circ;
});

const timerStatusLabel = computed(() => {
  if (timerRunning.value) return 'Meditiere...';
  if (timerTime.value === 0) return 'Fertig! 🙏';
  if (timerTime.value === selectedDuration.value * 60) return 'Bereit';
  return 'Pause';
});

// Breathing guide during timer
const breathCycle = ref(0);
const breathPhase = computed(() => {
  const c = breathCycle.value % 8;
  if (c < 4) return 'inhale';
  return 'exhale';
});
const breathLabel = computed(() => breathPhase.value === 'inhale' ? '🫁 Einatmen' : '💨 Ausatmen');

const selectDuration = (d) => {
  selectedDuration.value = d;
  timerTime.value = d * 60;
};

const startTimer = () => {
  timerRunning.value = true;
  timerInterval = setInterval(() => {
    timerTime.value--;
    breathCycle.value++;
    if (timerTime.value <= 0) {
      pauseTimer();
      saveSession();
    }
  }, 1000);
};

const pauseTimer = () => {
  timerRunning.value = false;
  clearInterval(timerInterval);
};

const resetTimer = () => {
  pauseTimer();
  timerTime.value = selectedDuration.value * 60;
  breathCycle.value = 0;
  sessionNote.value = '';
};

// Breathing techniques
const breatheTechniques = [
  { id: '478', emoji: '😌', name: '4-7-8 Atmung', description: 'Beruhigt Nervensystem & Stresslevel', inhale: 4, hold: 7, exhale: 8 },
  { id: 'box', emoji: '🟦', name: 'Box Breathing', description: 'Navy SEALs Technik für Fokus & Ruhe', inhale: 4, hold: 4, exhale: 4, hold2: 4 },
  { id: '2b', emoji: '⚡', name: 'Aktivierendes Atmen', description: 'Energieladend für morgens', inhale: 5, hold: 0, exhale: 2 },
  { id: 'coherent', emoji: '💙', name: 'Kohärentes Atmen', description: 'Herzfrequenz-Variabilität verbessern', inhale: 5, hold: 0, exhale: 5 },
];

const activeTechnique = ref(null);
const breatheRunning = ref(false);
const breatheState = ref('idle');
const breatheCountdown = ref(0);
const breatheRound = ref(0);
const breatheTargetRounds = ref(5);
const breatheStateDuration = ref(4);
let breatheInterval = null;
let breatheTimeout = null;

const breatheStateLabel = computed(() => {
  if (!breatheRunning.value) return 'Bereit';
  if (breatheState.value === 'inhale') return 'Einatmen';
  if (breatheState.value === 'hold' || breatheState.value === 'hold2') return 'Halten';
  if (breatheState.value === 'exhale') return 'Ausatmen';
  return '';
});

const selectTechnique = (tech) => {
  activeTechnique.value = tech;
  stopBreathe();
};

const startBreathe = () => {
  breatheRunning.value = true;
  breatheRound.value = 0;
  runBreathePhase('inhale');
};

const runBreathePhase = (phase) => {
  if (!breatheRunning.value) return;
  const t = activeTechnique.value;
  let duration = 0;
  let nextPhase = '';

  if (phase === 'inhale') {
    duration = t.inhale;
    nextPhase = t.hold ? 'hold' : 'exhale';
  } else if (phase === 'hold') {
    duration = t.hold;
    nextPhase = 'exhale';
  } else if (phase === 'exhale') {
    duration = t.exhale;
    nextPhase = t.hold2 ? 'hold2' : 'inhale';
  } else if (phase === 'hold2') {
    duration = t.hold2 || 0;
    nextPhase = 'inhale';
  }

  breatheState.value = phase;
  breatheStateDuration.value = duration;
  breatheCountdown.value = duration;

  clearInterval(breatheInterval);
  breatheInterval = setInterval(() => {
    breatheCountdown.value--;
    if (breatheCountdown.value <= 0) {
      clearInterval(breatheInterval);
      if (phase === 'exhale') {
        breatheRound.value++;
        if (breatheRound.value >= breatheTargetRounds.value) {
          stopBreathe();
          return;
        }
      }
      runBreathePhase(nextPhase);
    }
  }, 1000);
};

const stopBreathe = () => {
  breatheRunning.value = false;
  breatheState.value = 'idle';
  clearInterval(breatheInterval);
  clearTimeout(breatheTimeout);
};

// Session history
const sessions = ref([]);
const todayStr = computed(() => new Date().toISOString().split('T')[0]);

const totalMinutes = computed(() => sessions.value.reduce((s, x) => s + x.duration, 0));
const todaySessions = computed(() => sessions.value.filter(s => s.date === todayStr.value).length);

const meditationStreak = computed(() => {
  let s = 0;
  const d = new Date();
  const dates = new Set(sessions.value.map(x => x.date));
  while (dates.has(d.toISOString().split('T')[0])) {
    s++;
    d.setDate(d.getDate() - 1);
  }
  return s;
});

const last14Days = computed(() => {
  const days = [];
  const sessionDates = new Set(sessions.value.map(s => s.date));
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.push({
      date: key,
      done: sessionDates.has(key),
      short: `${d.getDate()}.`,
      label: d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' }),
    });
  }
  return days;
});

const saveSession = () => {
  const session = {
    id: Date.now().toString(),
    date: todayStr.value,
    duration: selectedDuration.value,
    sound: selectedSound.value,
    note: sessionNote.value.trim(),
    timestamp: new Date().toISOString(),
  };
  sessions.value.push(session);
  localStorage.setItem('meditation_sessions_v2', JSON.stringify(sessions.value));
  sessionNote.value = '';
};

const formatDate = (dateStr) => {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('de-DE', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
};

const load = () => {
  // Load new sessions
  const newData = localStorage.getItem('meditation_sessions_v2');
  if (newData) {
    sessions.value = JSON.parse(newData);
  } else {
    // Migrate old data
    const oldSessions = parseInt(localStorage.getItem('meditation_sessions') || '0');
    if (oldSessions > 0) {
      for (let i = 0; i < oldSessions; i++) {
        sessions.value.push({
          id: `old_${i}`,
          date: todayStr.value,
          duration: 5,
          sound: 'none',
          note: '',
          timestamp: new Date().toISOString(),
        });
      }
    }
  }
};

onMounted(() => load());
onBeforeUnmount(() => {
  clearInterval(timerInterval);
  clearInterval(breatheInterval);
});
</script>

<style scoped>
.meditation-container { min-height:100vh; background:linear-gradient(135deg,#0f0f1e 0%,#1a1a2e 50%,#16213e 100%); padding:2rem; color:white; }
.top-bar { display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; }
.back-btn { display:inline-flex; align-items:center; gap:0.5rem; padding:0.6rem 1.2rem; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:12px; color:rgba(255,255,255,0.8); cursor:pointer; font-size:0.9rem; }
.back-btn:hover { background:rgba(255,255,255,0.12); }

.page-title { display:flex; align-items:center; gap:0.75rem; font-size:2.2rem; font-weight:700; margin:0 0 0.5rem; background:linear-gradient(135deg,#a8edea,#fed6e3); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
.title-emoji { font-size:2rem; -webkit-text-fill-color:initial; }
.page-subtitle { color:rgba(255,255,255,0.5); margin:0 0 1.5rem; }

.tabs { display:flex; gap:0.4rem; margin-bottom:1.5rem; background:rgba(255,255,255,0.04); border-radius:12px; padding:4px; }
.tabs button { flex:1; padding:0.65rem; border-radius:10px; background:none; border:none; color:rgba(255,255,255,0.4); cursor:pointer; font-size:0.85rem; transition:all 0.2s; }
.tabs button.active { background:rgba(168,237,234,0.15); color:#a8edea; }
.tab-content { animation:fadeIn 0.3s ease; max-width:600px; margin:0 auto; }
@keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }

/* Duration picker */
.duration-picker h3, .sound-picker h3 { font-size:0.9rem; color:rgba(255,255,255,0.6); margin:0 0 0.75rem; }
.sound-picker { margin-top:1.5rem; }
.duration-options, .sound-options { display:flex; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.5rem; }
.duration-btn, .sound-btn { padding:0.5rem 1rem; border-radius:10px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.7); font-size:0.85rem; cursor:pointer; transition:all 0.2s; }
.duration-btn.active, .sound-btn.active { background:rgba(168,237,234,0.15); border-color:#a8edea; color:#a8edea; }

/* Timer circle */
.timer-area { display:flex; flex-direction:column; align-items:center; padding:2rem 0; }
.meditation-circle { position:relative; width:240px; height:240px; margin-bottom:2rem; }
.timer-svg { width:100%; height:100%; transform:rotate(-90deg); }
.circle-bg { fill:none; stroke:rgba(255,255,255,0.06); stroke-width:10; }
.circle-progress { fill:none; stroke:url(#meditation-gradient); stroke-width:10; stroke-linecap:round; stroke-dasharray: 679; transition:stroke-dashoffset 1s linear; }
.timer-inner { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; }
.timer-display { font-size:3rem; font-weight:700; line-height:1; background:linear-gradient(135deg,#a8edea,#fed6e3); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
.timer-label { color:rgba(255,255,255,0.4); font-size:0.85rem; margin-top:0.3rem; }

.breathing-guide { display:flex; flex-direction:column; align-items:center; gap:0.5rem; margin-bottom:1.5rem; }
.breath-circle { width:60px; height:60px; border-radius:50%; border:2px solid #a8edea; transition:all 4s ease-in-out; }
.breath-circle.inhale { transform:scale(1.5); background:rgba(168,237,234,0.15); }
.breath-circle.exhale { transform:scale(1); background:transparent; }
.breath-text { color:rgba(255,255,255,0.6); font-size:0.85rem; }

.timer-controls { display:flex; gap:0.75rem; }
.control-btn { display:inline-flex; align-items:center; gap:0.5rem; padding:0.75rem 1.75rem; border-radius:14px; border:none; font-size:0.95rem; font-weight:600; cursor:pointer; transition:all 0.2s; }
.start-btn { background:linear-gradient(135deg,#a8edea,#fed6e3); color:#1a1a2e; }
.pause-btn { background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:white; }
.reset-btn { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.6); }

/* Session complete */
.session-complete { text-align:center; padding:2rem; background:rgba(168,237,234,0.06); border:1px solid rgba(168,237,234,0.2); border-radius:20px; margin-top:1rem; }
.complete-emoji { font-size:3rem; margin-bottom:1rem; }
.session-note { width:100%; padding:0.75rem; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:10px; color:white; font-size:0.85rem; resize:none; outline:none; margin:1rem 0; font-family:inherit; }
.session-note::placeholder { color:rgba(255,255,255,0.25); }
.save-session-btn { display:inline-flex; align-items:center; gap:0.5rem; padding:0.7rem 1.5rem; background:linear-gradient(135deg,#a8edea,#fed6e3); border:none; border-radius:12px; color:#1a1a2e; font-weight:700; cursor:pointer; }

/* Breathe techniques */
.breathe-header { margin-bottom:1.5rem; }
.breathe-header h3 { font-size:1.2rem; margin:0 0 0.3rem; }
.subtitle-text { color:rgba(255,255,255,0.5); font-size:0.85rem; margin:0; }
.breathe-techniques { display:grid; grid-template-columns:repeat(2,1fr); gap:0.75rem; margin-bottom:1.5rem; }
.technique-card { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:1rem; cursor:pointer; transition:all 0.2s; }
.technique-card:hover { border-color:rgba(168,237,234,0.3); background:rgba(168,237,234,0.05); }
.technique-card.active { border-color:#a8edea; background:rgba(168,237,234,0.1); }
.tech-emoji { font-size:1.8rem; margin-bottom:0.5rem; }
.technique-card h4 { margin:0 0 0.3rem; font-size:0.9rem; }
.technique-card p { color:rgba(255,255,255,0.5); font-size:0.75rem; margin:0 0 0.5rem; }
.tech-pattern { display:flex; flex-wrap:wrap; gap:0.3rem; }
.tech-pattern span { font-size:0.7rem; background:rgba(255,255,255,0.06); padding:0.2rem 0.4rem; border-radius:6px; color:rgba(255,255,255,0.6); }

.breathe-player { text-align:center; padding:1.5rem; background:rgba(255,255,255,0.03); border-radius:20px; border:1px solid rgba(255,255,255,0.06); }
.breathe-visual { position:relative; display:flex; align-items:center; justify-content:center; width:180px; height:180px; margin:0 auto 1.5rem; }
.breathe-ring { width:120px; height:120px; border-radius:50%; border:3px solid rgba(168,237,234,0.4); transition:transform calc(var(--duration) * 1s) ease-in-out; }
.breathe-ring.inhale { transform:scale(1.5); background:rgba(168,237,234,0.1); border-color:#a8edea; }
.breathe-ring.exhale { transform:scale(1); background:transparent; }
.breathe-ring.hold, .breathe-ring.hold2 { transform:scale(1.5); background:rgba(254,214,227,0.1); border-color:#fed6e3; }
.breathe-center { position:absolute; text-align:center; }
.breathe-state-label { font-size:1rem; font-weight:600; color:rgba(255,255,255,0.8); }
.breathe-countdown { font-size:2rem; font-weight:700; color:#a8edea; }
.breathe-round { color:rgba(255,255,255,0.4); font-size:0.8rem; margin-bottom:1rem; }
.breathe-controls { display:flex; justify-content:center; }

/* History */
.history-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:0.75rem; margin-bottom:1.5rem; }
.hs-card { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:1rem; text-align:center; }
.hs-val { font-size:1.4rem; font-weight:700; color:#a8edea; }
.hs-lbl { color:rgba(255,255,255,0.4); font-size:0.7rem; margin-top:0.2rem; }

.streak-heatmap { margin-bottom:1.5rem; }
.streak-heatmap h4 { font-size:0.85rem; color:rgba(255,255,255,0.6); margin:0 0 0.75rem; }
.heatmap-row { display:flex; gap:0.3rem; }
.hm-cell { flex:1; aspect-ratio:1; border-radius:6px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.06); display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:0.55rem; color:rgba(255,255,255,0.3); }
.hm-cell.done { background:rgba(168,237,234,0.2); border-color:#a8edea; }
.hm-cell.done .hm-date { color:#a8edea; }
.hm-check { font-size:0.8rem; }

.empty { display:flex; flex-direction:column; align-items:center; gap:0.5rem; padding:2rem; color:rgba(255,255,255,0.3); font-size:2rem; text-align:center; }

.session-list { display:flex; flex-direction:column; gap:0.5rem; }
.session-item { display:flex; justify-content:space-between; align-items:center; padding:0.75rem 1rem; background:rgba(255,255,255,0.04); border-radius:10px; }
.si-date { font-size:0.85rem; font-weight:500; }
.si-note { font-size:0.75rem; color:rgba(255,255,255,0.4); margin-top:0.2rem; }
.si-right { display:flex; align-items:center; gap:0.5rem; }
.si-dur { font-size:0.9rem; font-weight:700; color:#a8edea; }
.si-sound { font-size:1.1rem; }

@media (max-width:600px) {
  .meditation-container { padding:1rem; }
  .breathe-techniques { grid-template-columns:1fr; }
  .history-stats { grid-template-columns:repeat(2,1fr); }
}
</style>
