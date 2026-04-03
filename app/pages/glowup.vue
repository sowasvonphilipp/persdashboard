<template>
  <div class="glowup-container">
    <div class="top-bar">
      <button class="back-btn" @click="navigateTo('/dashboard')"><UIcon name="i-heroicons-arrow-left" /> Dashboard</button>
    </div>
    <h1 class="page-title"><UIcon name="i-heroicons-sparkles" class="title-icon" />Glowup Tracker</h1>
    <p class="page-subtitle">Selfies, Gewicht & Selbstreflexion</p>

    <div class="tabs">
      <button :class="{ active: tab === 'selfie' }" @click="tab = 'selfie'">📸 Selfie</button>
      <button :class="{ active: tab === 'gallery' }" @click="tab = 'gallery'">🖼️ Galerie</button>
      <button :class="{ active: tab === 'stats' }" @click="tab = 'stats'">📊 Verlauf</button>
      <button :class="{ active: tab === 'pflege' }" @click="tab = 'pflege'">🧴 Pflege</button>
    </div>

    <!-- SELFIE TAB -->
    <div v-if="tab === 'selfie'" class="tab-content">
      <div class="selfie-card">
        <h3>📸 Selfie aufnehmen</h3>
        <div class="time-picker">
          <button v-for="t in ['morgen','mittag','abend']" :key="t" class="tp-btn" :class="{ active: selfieTime === t }" @click="selfieTime = t">{{ { morgen:'🌅 Morgen', mittag:'🍲 Mittag', abend:'🌙 Abend' }[t] }}</button>
        </div>

        <!-- Camera / Upload -->
        <div class="upload-area">
          <div v-if="!previewUrl" class="upload-placeholder" @click="$refs.fileInput.click()">
            <UIcon name="i-heroicons-camera" /><p>Foto aufnehmen oder hochladen</p>
          </div>
          <img v-else :src="previewUrl" class="preview-img" @click="$refs.fileInput.click()" />
          <input ref="fileInput" type="file" accept="image/*" capture="user" @change="handleFile" style="display:none" />
        </div>

        <div class="fg"><label>Wie fühlst du dich? (1-10)</label>
          <div class="feeling-grid">
            <button v-for="n in 10" :key="n" class="feel-btn" :class="{ sel: feeling === n }" @click="feeling = n">{{ n }}</button>
          </div>
          <div class="feel-label">{{ feeling > 0 ? feelingLabels[feeling-1] : 'Tippe auf eine Zahl' }}</div>
        </div>
        <div class="fg"><label>Notiz</label><input v-model="selfieNote" type="text" placeholder="Wie siehst du dich heute?" class="finput" /></div>
        <button class="save-btn" @click="saveSelfie" :disabled="!previewUrl"><UIcon name="i-heroicons-arrow-down-tray" /> Speichern</button>
      </div>

      <!-- Today's selfies -->
      <div v-if="todaySelfies.length" class="today-selfies">
        <h3>Heute</h3>
        <div class="selfie-row">
          <div v-for="s in todaySelfies" :key="s.id" class="selfie-thumb" @click="viewSelfie(s)">
            <img :src="s.image" /><span>{{ { morgen:'🌅', mittag:'🍲', abend:'🌙' }[s.timeOfDay] }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- GALLERY TAB -->
    <div v-if="tab === 'gallery'" class="tab-content">
      <div v-if="selfies.length === 0" class="empty"><UIcon name="i-heroicons-photo" /><p>Noch keine Selfies</p></div>
      <div v-else>
        <div v-for="group in groupedSelfies" :key="group.date" class="gallery-group">
          <h3 class="gallery-date">{{ formatDate(group.date) }}</h3>
          <div class="gallery-row">
            <div v-for="s in group.items" :key="s.id" class="gallery-item" @click="viewSelfie(s)">
              <img :src="s.image" />
              <div class="gi-overlay">
                <span>{{ { morgen:'🌅', mittag:'🍲', abend:'🌙' }[s.timeOfDay] }}</span>
                <span>{{ s.feeling }}/10</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- STATS TAB -->
    <div v-if="tab === 'stats'" class="tab-content">
      <div class="stats-grid">
        <div class="stat-box"><div class="stat-val">{{ selfies.length }}</div><div class="stat-lbl">Selfies</div></div>
        <div class="stat-box"><div class="stat-val">{{ avgFeeling || '—' }}</div><div class="stat-lbl">Ø Gefühl</div></div>
        <div class="stat-box"><div class="stat-val">{{ uniqueDays }}</div><div class="stat-lbl">Tage getrackt</div></div>
        <div class="stat-box"><div class="stat-val">{{ streak }}</div><div class="stat-lbl">Streak 🔥</div></div>
      </div>
      <h3 class="section-title" style="margin-top:1.5rem">Gefühlsverlauf (letzte 14 Tage)</h3>
      <div class="feeling-chart">
        <div v-for="d in feelingHistory" :key="d.date" class="fc-col">
          <div class="fc-bar" :style="{ height: (d.avg / 10 * 100) + '%' }" :class="getFeelingColor(d.avg)"></div>
          <span class="fc-val">{{ d.avg.toFixed(1) }}</span>
          <span class="fc-date">{{ d.short }}</span>
        </div>
      </div>
    </div>

    <!-- PFLEGE (SKINCARE) TAB -->
    <div v-if="tab === 'pflege'" class="tab-content">
      <!-- Today compliance banner -->
      <div class="pflege-banner">
        <div class="pflege-banner-left">
          <div class="pflege-pct">{{ skincareComplianceToday }}%</div>
          <div class="pflege-pct-lbl">Heute erledigt</div>
        </div>
        <div class="pflege-pbar-wrap">
          <div class="pflege-pbar" :style="{ width: skincareComplianceToday + '%' }"></div>
        </div>
        <div class="pflege-done-count">{{ skincareDoneCount }}/{{ skincareTotalCount }}</div>
      </div>

      <!-- Morning routine -->
      <div class="pflege-section">
        <h3 class="pflege-section-title">🌅 Morgen</h3>
        <div class="pflege-list">
          <div v-for="item in skincareItems.filter(i => i.time === 'morgen')" :key="item.id" class="pflege-item" :class="{ done: isSkincareChecked(item.id) }" @click="toggleSkincare(item.id)">
            <div class="pflege-check" :class="{ done: isSkincareChecked(item.id) }">
              <span v-if="isSkincareChecked(item.id)">✓</span>
            </div>
            <div class="pflege-item-info">
              <div class="pflege-item-name">{{ item.emoji }} {{ item.name }}</div>
              <div class="pflege-item-sub">🔥 {{ getSkincareStreak(item.id) }}d Streak · 7 Tage: {{ getSkincareWeek(item.id) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Evening routine -->
      <div class="pflege-section">
        <h3 class="pflege-section-title">🌙 Abend</h3>
        <div class="pflege-list">
          <div v-for="item in skincareItems.filter(i => i.time === 'abend')" :key="item.id" class="pflege-item" :class="{ done: isSkincareChecked(item.id) }" @click="toggleSkincare(item.id)">
            <div class="pflege-check" :class="{ done: isSkincareChecked(item.id) }">
              <span v-if="isSkincareChecked(item.id)">✓</span>
            </div>
            <div class="pflege-item-info">
              <div class="pflege-item-name">{{ item.emoji }} {{ item.name }}</div>
              <div class="pflege-item-sub">🔥 {{ getSkincareStreak(item.id) }}d Streak · 7 Tage: {{ getSkincareWeek(item.id) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 7-day grid -->
      <div class="pflege-section">
        <h3 class="pflege-section-title">📅 Letzte 7 Tage</h3>
        <div class="pflege-calendar">
          <div class="pflege-cal-header">
            <div class="pflege-cal-item-col">Pflege</div>
            <div v-for="d in last7Days" :key="d.key" class="pflege-cal-day" :class="{ today: d.key === todayStr }">{{ d.short }}</div>
          </div>
          <div v-for="item in skincareItems" :key="item.id" class="pflege-cal-row">
            <div class="pflege-cal-item-col">{{ item.emoji }} {{ item.name }}</div>
            <div v-for="d in last7Days" :key="d.key" class="pflege-cal-cell" :class="{ done: isSkincareCheckedDate(item.id, d.key), today: d.key === todayStr }">{{ isSkincareCheckedDate(item.id, d.key) ? '✓' : '·' }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- VIEW SELFIE MODAL -->
    <div v-if="viewingSelfie" class="modal-overlay" @click="viewingSelfie = null">
      <div class="modal-content modal-lg" @click.stop>
        <div class="modal-header"><h3>{{ formatDate(viewingSelfie.date) }} · {{ { morgen:'🌅 Morgen', mittag:'🍲 Mittag', abend:'🌙 Abend' }[viewingSelfie.timeOfDay] }}</h3><button class="modal-close" @click="viewingSelfie = null"><UIcon name="i-heroicons-x-mark" /></button></div>
        <div class="modal-body selfie-view">
          <img :src="viewingSelfie.image" class="selfie-full" />
          <div class="selfie-info">
            <div class="si-feeling">Gefühl: {{ viewingSelfie.feeling }}/10 {{ feelingLabels[viewingSelfie.feeling - 1] }}</div>
            <div v-if="viewingSelfie.note" class="si-note">📝 {{ viewingSelfie.note }}</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-danger" @click="deleteSelfie(viewingSelfie.id)"><UIcon name="i-heroicons-trash" /> Löschen</button>
          <button class="btn-primary" @click="viewingSelfie = null">Schließen</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const selfies = ref([]);
const tab = ref('selfie');
const selfieTime = ref('morgen');
const feeling = ref(0);
const selfieNote = ref('');
const previewUrl = ref('');
const viewingSelfie = ref(null);
const feelingLabels = ['Schrecklich','Sehr schlecht','Schlecht','Nicht gut','OK','Ganz gut','Gut','Sehr gut','Fantastisch','Perfekt!'];

const todayStr = computed(() => new Date().toISOString().split('T')[0]);
const todaySelfies = computed(() => selfies.value.filter(s => s.date === todayStr.value));

const groupedSelfies = computed(() => {
  const map = {};
  selfies.value.forEach(s => { if (!map[s.date]) map[s.date] = []; map[s.date].push(s); });
  return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0])).map(([date, items]) => ({ date, items }));
});

const avgFeeling = computed(() => {
  if (!selfies.value.length) return 0;
  return (selfies.value.reduce((s, x) => s + x.feeling, 0) / selfies.value.length).toFixed(1);
});
const uniqueDays = computed(() => new Set(selfies.value.map(s => s.date)).size);
const streak = computed(() => {
  let s = 0; const d = new Date(); const dates = new Set(selfies.value.map(x => x.date));
  while (dates.has(d.toISOString().split('T')[0])) { s++; d.setDate(d.getDate() - 1); }
  return s;
});

const feelingHistory = computed(() => {
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const daySelfies = selfies.value.filter(s => s.date === key);
    const avg = daySelfies.length ? daySelfies.reduce((s, x) => s + x.feeling, 0) / daySelfies.length : 0;
    days.push({ date: key, avg, short: `${d.getDate()}.${d.getMonth() + 1}` });
  }
  return days;
});

const getFeelingColor = (v) => v >= 7 ? 'green' : v >= 4 ? 'yellow' : 'red';
const formatDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

const handleFile = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    // Compress image
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxSize = 900;
      let w = img.width, h = img.height;
      if (w > h) { h = (h / w) * maxSize; w = maxSize; } else { w = (w / h) * maxSize; h = maxSize; }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      previewUrl.value = canvas.toDataURL('image/jpeg', 0.88);
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
};

const saveSelfie = () => {
  if (!previewUrl.value || !feeling.value) return;
  selfies.value.push({ id: Date.now().toString(), date: todayStr.value, timeOfDay: selfieTime.value, image: previewUrl.value, feeling: feeling.value, note: selfieNote.value, timestamp: new Date().toISOString() });
  save(); previewUrl.value = ''; feeling.value = 0; selfieNote.value = '';
};

const viewSelfie = (s) => { viewingSelfie.value = s; };
const deleteSelfie = (id) => { selfies.value = selfies.value.filter(s => s.id !== id); save(); viewingSelfie.value = null; };

const save = () => localStorage.setItem('glowup_selfies', JSON.stringify(selfies.value));
const load = () => { const s = localStorage.getItem('glowup_selfies'); if (s) selfies.value = JSON.parse(s); };

// ── Skincare tracker ──────────────────────────────────────────
const skincareItems = [
  { id: 'morgen-reinigung', name: 'Reinigung', emoji: '🫧', time: 'morgen' },
  { id: 'morgen-creme',     name: 'Gesichtscreme', emoji: '🧴', time: 'morgen' },
  { id: 'morgen-sonnen',   name: 'Sonnenschutz', emoji: '☀️', time: 'morgen' },
  { id: 'morgen-lip',      name: 'Lip Balm', emoji: '💋', time: 'morgen' },
  { id: 'abend-reinigung', name: 'Reinigung', emoji: '🫧', time: 'abend' },
  { id: 'abend-creme',     name: 'Abendcreme', emoji: '🧴', time: 'abend' },
  { id: 'abend-augen',     name: 'Augencreme', emoji: '👁️', time: 'abend' },
  { id: 'abend-koerper',   name: 'Körpercreme', emoji: '🪷', time: 'abend' },
];

const skincareLog = ref({});  // { [dateKey]: { [itemId]: true } }

const loadSkincare = () => {
  const s = localStorage.getItem('glowup_skincare');
  if (s) skincareLog.value = JSON.parse(s);
};
const saveSkincare = () => localStorage.setItem('glowup_skincare', JSON.stringify(skincareLog.value));

const isSkincareChecked = (id) => !!(skincareLog.value[todayStr.value]?.[id]);
const isSkincareCheckedDate = (id, date) => !!(skincareLog.value[date]?.[id]);

const toggleSkincare = (id) => {
  if (!skincareLog.value[todayStr.value]) skincareLog.value[todayStr.value] = {};
  skincareLog.value[todayStr.value][id] = !skincareLog.value[todayStr.value][id];
  saveSkincare();
};

const skincareTotalCount = skincareItems.length;
const skincareDoneCount = computed(() => skincareItems.filter(i => isSkincareChecked(i.id)).length);
const skincareComplianceToday = computed(() => Math.round((skincareDoneCount.value / skincareTotalCount) * 100));

const getSkincareStreak = (id) => {
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = d.toISOString().split('T')[0];
    if (skincareLog.value[key]?.[id]) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
};

const getSkincareWeek = (id) => {
  let dots = '';
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    dots += skincareLog.value[key]?.[id] ? '●' : '○';
  }
  return dots;
};

const last7Days = computed(() => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split('T')[0];
    return { key, short: `${d.getDate()}.${d.getMonth() + 1}` };
  });
});

onMounted(() => { load(); loadSkincare(); const h = new Date().getHours(); selfieTime.value = h < 11 ? 'morgen' : h < 16 ? 'mittag' : 'abend'; });
</script>

<style scoped>
.glowup-container { min-height:100vh; background:linear-gradient(135deg,#0f0f1e 0%,#1a1a2e 50%,#16213e 100%); padding:2rem; color:white; }
.top-bar { display:flex; justify-content:space-between; margin-bottom:2rem; }
.back-btn { display:inline-flex; align-items:center; gap:0.5rem; padding:0.6rem 1.2rem; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:12px; color:rgba(255,255,255,0.8); cursor:pointer; font-size:0.9rem; }
.back-btn:hover { background:rgba(255,255,255,0.12); }
.page-title { display:flex; align-items:center; gap:0.75rem; font-size:2.2rem; font-weight:700; margin:0 0 0.5rem; background:linear-gradient(135deg,#fff,#ff9ff3); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
.title-icon { width:2.5rem; height:2.5rem; }
.page-subtitle { color:rgba(255,255,255,0.5); margin:0 0 2rem; }

.tabs { display:flex; gap:0.4rem; margin-bottom:1.5rem; background:rgba(255,255,255,0.04); border-radius:12px; padding:4px; }
.tabs button { flex:1; padding:0.65rem; border-radius:10px; background:none; border:none; color:rgba(255,255,255,0.5); cursor:pointer; font-size:0.85rem; transition:all 0.2s; }
.tabs button.active { background:rgba(255,159,243,0.2); color:#ff9ff3; }
.tab-content { animation:fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

.selfie-card { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:1.5rem; }
.selfie-card h3 { margin:0 0 1rem; }
.time-picker { display:flex; gap:0.4rem; margin-bottom:1rem; }
.tp-btn { flex:1; padding:0.6rem; border-radius:10px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.6); cursor:pointer; font-size:0.85rem; transition:all 0.2s; }
.tp-btn.active { background:rgba(255,159,243,0.15); border-color:#ff9ff3; color:#ff9ff3; }

.upload-area { margin-bottom:1rem; }
.upload-placeholder { display:flex; flex-direction:column; align-items:center; gap:0.5rem; padding:3rem; border:2px dashed rgba(255,255,255,0.15); border-radius:14px; cursor:pointer; color:rgba(255,255,255,0.4); transition:all 0.2s; }
.upload-placeholder:hover { border-color:rgba(255,159,243,0.3); color:rgba(255,255,255,0.6); }
.upload-placeholder svg { width:3rem; height:3rem; }
.preview-img { width:100%; max-height:300px; object-fit:cover; border-radius:14px; cursor:pointer; }

.feeling-grid { display:flex; gap:0.3rem; margin:0.5rem 0; }
.feel-btn { width:36px; height:36px; border-radius:8px; border:2px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:rgba(255,255,255,0.6); font-size:0.9rem; font-weight:600; cursor:pointer; transition:all 0.2s; }
.feel-btn:hover { border-color:#ff9ff3; }
.feel-btn.sel { border-color:#ff9ff3; background:rgba(255,159,243,0.25); color:#ff9ff3; transform:scale(1.1); }
.feel-label { color:#ff9ff3; font-size:0.85rem; font-weight:500; min-height:1.2rem; }

.fg { margin-bottom:1rem; }
.fg label { display:block; color:rgba(255,255,255,0.6); font-size:0.8rem; margin-bottom:0.4rem; }
.finput { width:100%; padding:0.65rem 0.9rem; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:10px; color:white; font-size:0.9rem; outline:none; box-sizing:border-box; }
.finput:focus { border-color:#ff9ff3; }
.finput::placeholder { color:rgba(255,255,255,0.3); }

.save-btn { display:flex; align-items:center; gap:0.5rem; padding:0.75rem 1.5rem; background:linear-gradient(135deg,#ff9ff3,#f368e0); border:none; border-radius:12px; color:white; font-weight:600; cursor:pointer; width:100%; justify-content:center; }
.save-btn:disabled { opacity:0.4; cursor:not-allowed; }

.today-selfies { margin-top:1.5rem; }
.today-selfies h3 { margin:0 0 0.75rem; font-size:1rem; }
.selfie-row { display:flex; gap:0.75rem; }
.selfie-thumb { width:100px; height:100px; border-radius:12px; overflow:hidden; cursor:pointer; position:relative; }
.selfie-thumb img { width:100%; height:100%; object-fit:cover; }
.selfie-thumb span { position:absolute; bottom:4px; right:4px; font-size:0.8rem; }

.gallery-group { margin-bottom:1.5rem; }
.gallery-date { font-size:0.9rem; font-weight:600; margin:0 0 0.5rem; color:rgba(255,255,255,0.7); }
.gallery-row { display:grid; grid-template-columns:repeat(auto-fill,minmax(120px,1fr)); gap:0.75rem; }
.gallery-item { aspect-ratio:1; border-radius:12px; overflow:hidden; cursor:pointer; position:relative; }
.gallery-item img { width:100%; height:100%; object-fit:cover; }
.gi-overlay { position:absolute; bottom:0; left:0; right:0; padding:0.4rem; background:linear-gradient(transparent,rgba(0,0,0,0.7)); display:flex; justify-content:space-between; font-size:0.7rem; }

.stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; }
.stat-box { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:1rem; text-align:center; }
.stat-val { font-size:1.4rem; font-weight:700; color:#ff9ff3; }
.stat-lbl { color:rgba(255,255,255,0.5); font-size:0.75rem; }

.section-title { font-size:1rem; font-weight:600; margin:0 0 1rem; color:rgba(255,255,255,0.8); }
.feeling-chart { display:flex; gap:4px; align-items:flex-end; height:120px; }
.fc-col { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%; }
.fc-bar { width:100%; border-radius:4px 4px 0 0; min-height:2px; transition:height 0.5s; }
.fc-bar.green { background:linear-gradient(to top,#10b981,#34d399); }
.fc-bar.yellow { background:linear-gradient(to top,#ffd93d,#f9ca24); }
.fc-bar.red { background:linear-gradient(to top,#ff6b6b,#ee5a24); }
.fc-val { font-size:0.6rem; color:rgba(255,255,255,0.4); margin-top:2px; }
.fc-date { font-size:0.55rem; color:rgba(255,255,255,0.3); }

.empty { display:flex; flex-direction:column; align-items:center; gap:0.5rem; padding:3rem; color:rgba(255,255,255,0.3); }
.empty svg { width:3rem; height:3rem; }

.modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:1000; padding:1rem; }
.modal-content { background:#1a1a2e; border-radius:16px; max-width:550px; width:100%; max-height:90vh; overflow-y:auto; border:1px solid rgba(255,159,243,0.2); }
.modal-content.modal-lg { max-width:650px; }
.modal-header { display:flex; justify-content:space-between; align-items:center; padding:1.25rem; border-bottom:1px solid rgba(255,255,255,0.1); }
.modal-header h3 { margin:0; font-size:1rem; }
.modal-close { width:2rem; height:2rem; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:white; cursor:pointer; }
.modal-body { padding:1.25rem; }
.modal-footer { display:flex; gap:1rem; padding:1.25rem; border-top:1px solid rgba(255,255,255,0.1); justify-content:flex-end; }
.selfie-full { width:100%; border-radius:12px; margin-bottom:1rem; }
.selfie-info { display:flex; flex-direction:column; gap:0.5rem; }
.si-feeling { font-size:1rem; font-weight:600; color:#ff9ff3; }
.si-note { font-size:0.9rem; color:rgba(255,255,255,0.6); }
.btn-primary { padding:0.7rem 1.3rem; border-radius:10px; background:linear-gradient(135deg,#ff9ff3,#f368e0); color:white; font-weight:600; cursor:pointer; border:none; }
.btn-danger { display:flex; align-items:center; gap:0.4rem; padding:0.7rem 1.3rem; border-radius:10px; background:rgba(255,107,107,0.15); border:1px solid rgba(255,107,107,0.3); color:#ff6b6b; cursor:pointer; }

/* ── Pflege / Skincare ─────────────────────────────── */
.pflege-banner { display:flex; align-items:center; gap:1rem; background:rgba(255,159,243,0.08); border:1px solid rgba(255,159,243,0.2); border-radius:16px; padding:1.2rem 1.5rem; margin-bottom:1.5rem; }
.pflege-banner-left { min-width:64px; text-align:center; }
.pflege-pct { font-size:1.8rem; font-weight:700; color:#ff9ff3; line-height:1; }
.pflege-pct-lbl { font-size:0.7rem; color:rgba(255,255,255,0.4); }
.pflege-pbar-wrap { flex:1; height:8px; background:rgba(255,255,255,0.08); border-radius:99px; overflow:hidden; }
.pflege-pbar { height:100%; background:linear-gradient(90deg,#ff9ff3,#f368e0); border-radius:99px; transition:width 0.4s; }
.pflege-done-count { font-size:0.95rem; font-weight:600; color:rgba(255,255,255,0.7); }

.pflege-section { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:1.25rem; margin-bottom:1rem; }
.pflege-section-title { margin:0 0 1rem; font-size:1rem; font-weight:600; }
.pflege-list { display:flex; flex-direction:column; gap:0.6rem; }
.pflege-item { display:flex; align-items:center; gap:1rem; padding:0.9rem 1rem; border-radius:12px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); cursor:pointer; transition:all 0.2s; }
.pflege-item:hover { background:rgba(255,255,255,0.07); }
.pflege-item.done { background:rgba(255,159,243,0.08); border-color:rgba(255,159,243,0.25); }
.pflege-check { width:28px; height:28px; border-radius:50%; border:2px solid rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; font-size:0.85rem; font-weight:600; flex-shrink:0; transition:all 0.2s; }
.pflege-check.done { border-color:#ff9ff3; background:#ff9ff3; color:#1a1a2e; }
.pflege-item-name { font-size:0.95rem; font-weight:500; margin-bottom:0.25rem; }
.pflege-item-sub { font-size:0.72rem; color:rgba(255,255,255,0.4); letter-spacing:0.02em; }

.pflege-calendar { overflow-x:auto; }
.pflege-cal-header, .pflege-cal-row { display:grid; grid-template-columns:140px repeat(7, 1fr); gap:0; }
.pflege-cal-header { margin-bottom:0.4rem; }
.pflege-cal-item-col { font-size:0.75rem; color:rgba(255,255,255,0.5); padding:0.3rem 0.4rem; }
.pflege-cal-day { font-size:0.72rem; color:rgba(255,255,255,0.4); text-align:center; padding:0.3rem 0.1rem; }
.pflege-cal-day.today { color:#ff9ff3; font-weight:700; }
.pflege-cal-row { margin-bottom:4px; }
.pflege-cal-cell { font-size:0.75rem; text-align:center; padding:0.4rem 0.1rem; border-radius:6px; color:rgba(255,255,255,0.2); }
.pflege-cal-cell.done { color:#ff9ff3; font-weight:700; }
.pflege-cal-cell.today { background:rgba(255,159,243,0.06); }

@media (max-width:768px) {
  .stats-grid { grid-template-columns:repeat(2,1fr); }
  .gallery-row { grid-template-columns:repeat(3,1fr); }
  .page-title { font-size:1.6rem; }
  .pflege-cal-header, .pflege-cal-row { grid-template-columns:100px repeat(7,1fr); }
}
</style>
