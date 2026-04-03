<template>
  <div class="books-container">
    <div class="top-bar">
      <button class="back-btn" @click="navigateTo('/dashboard')"><UIcon name="i-heroicons-arrow-left" /> Dashboard</button>
      <button class="add-btn" @click="showAdd = true"><UIcon name="i-heroicons-plus" /> Buch hinzufügen</button>
    </div>
    
    <h1 class="page-title"><UIcon name="i-heroicons-book-open" class="title-icon" />Bibliothek</h1>
    <p class="page-subtitle">Tracke deine Bücher, Seiten & Lesegewohnheiten</p>

    <!-- Stats -->
    <div class="stats-bar">
      <div class="stat-box"><div class="stat-val">{{ booksCurrentlyReading.length }}</div><div class="stat-lbl">Aktuell</div></div>
      <div class="stat-box"><div class="stat-val">{{ booksFinished.length }}</div><div class="stat-lbl">Gelesen</div></div>
      <div class="stat-box"><div class="stat-val">{{ totalPagesRead }}</div><div class="stat-lbl">Seiten gelesen</div></div>
      <div class="stat-box glow"><div class="stat-val">{{ currentReadingStreak }} 🔥</div><div class="stat-lbl">Lese-Streak</div></div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button :class="{ active: tab === 'reading' }" @click="tab = 'reading'">📖 Aktuell ({{ booksCurrentlyReading.length }})</button>
      <button :class="{ active: tab === 'toread' }" @click="tab = 'toread'">📚 Wunschliste ({{ booksToRead.length }})</button>
      <button :class="{ active: tab === 'finished' }" @click="tab = 'finished'">🏆 Beendet ({{ booksFinished.length }})</button>
    </div>

    <!-- TAB: READING -->
    <div v-if="tab === 'reading'" class="tab-content">
      <!-- Motivation quote -->
      <div class="motivation-banner">
        <div class="motivation-quote">{{ currentQuote.text }}</div>
        <div class="motivation-author">— {{ currentQuote.author }}</div>
        <button class="quote-next-btn" @click="nextQuote">🔀</button>
      </div>

      <!-- Daily page goal -->
      <div class="daily-goal-card">
        <div class="dg-left">
          <div class="dg-label">📅 Heutige Seiten</div>
          <div class="dg-stats">
            <span class="dg-today">{{ todayPagesRead }}</span>
            <span class="dg-sep">/</span>
            <span class="dg-goal">{{ dailyPageGoal }}</span>
            <span class="dg-unit">Seiten</span>
          </div>
        </div>
        <div class="dg-center">
          <div class="dg-pbar-wrap">
            <div class="dg-pbar" :style="{ width: Math.min(100, todayPagesRead / Math.max(1, dailyPageGoal) * 100) + '%' }"></div>
          </div>
          <div class="dg-pct">{{ Math.min(100, Math.round(todayPagesRead / Math.max(1, dailyPageGoal) * 100)) }}%</div>
        </div>
        <div class="dg-right">
          <button class="dg-edit-btn" @click="showGoalEdit = !showGoalEdit">⚙️</button>
        </div>
      </div>
      <div v-if="showGoalEdit" class="goal-edit-row">
        <label>Tagesziel (Seiten):</label>
        <input v-model.number="dailyPageGoal" type="number" min="1" max="999" class="finput sm goal-input" @change="saveDailyGoal" />
      </div>

      <div v-if="booksCurrentlyReading.length === 0" class="empty"><UIcon name="i-heroicons-book-open" /><p>Du liest aktuell kein Buch</p></div>
      <div class="books-grid">
        <div v-for="book in booksCurrentlyReading" :key="book.id" class="book-card" @click="viewBook(book)">
          <div class="book-cover"><img v-if="book.cover" :src="book.cover" /><div v-else class="book-placeholder">{{ book.title.charAt(0) }}</div></div>
          <div class="book-info">
            <h4 class="book-title">{{ book.title }}</h4>
            <p class="book-author">{{ book.author }}</p>
            <div class="book-progress">
              <div class="bp-bar"><div class="bp-fill" :style="{ width: getProgressPct(book) + '%' }"></div></div>
              <div class="bp-text">{{ book.currentPage }} / {{ book.totalPages }} ({{ getProgressPct(book).toFixed(0) }}%)</div>
            </div>
            <div v-if="book.deadline" class="book-deadline-calc">
              <UIcon name="i-heroicons-clock" /> 
              <span v-if="getPagesPerDay(book) > 0">{{ getPagesPerDay(book) }} Seiten/Tag bis {{ formatDateStr(book.deadline) }}</span>
              <span v-else>Ziel erreicht!</span>
            </div>
            <button class="update-btn" @click.stop="openUpdateProgress(book)">Fortschritt eintragen</button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB: TO READ -->
    <div v-if="tab === 'toread'" class="tab-content">
      <div v-if="booksToRead.length === 0" class="empty"><UIcon name="i-heroicons-bookmark" /><p>Wunschliste ist leer</p></div>
      <div class="books-grid">
        <div v-for="book in booksToRead" :key="book.id" class="book-card" @click="viewBook(book)">
          <div class="book-cover"><img v-if="book.cover" :src="book.cover" /><div v-else class="book-placeholder">{{ book.title.charAt(0) }}</div></div>
          <div class="book-info">
            <h4 class="book-title">{{ book.title }}</h4>
            <p class="book-author">{{ book.author }}</p>
            <div class="book-meta" v-if="book.totalPages">{{ book.totalPages }} Seiten</div>
            <button class="start-btn" @click.stop="startReading(book)">Lesen beginnen</button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB: FINISHED -->
    <div v-if="tab === 'finished'" class="tab-content">
      <div v-if="booksFinished.length === 0" class="empty"><UIcon name="i-heroicons-trophy" /><p>Noch kein Buch beendet</p></div>
      <div class="books-grid">
        <div v-for="book in booksFinished" :key="book.id" class="book-card" @click="viewBook(book)">
          <div class="book-cover"><img v-if="book.cover" :src="book.cover" /><div v-else class="book-placeholder">{{ book.title.charAt(0) }}</div></div>
          <div class="book-info">
            <h4 class="book-title">{{ book.title }}</h4>
            <p class="book-author">{{ book.author }}</p>
            <div class="book-rating" v-if="book.rating">
              <span v-for="n in 5" :key="n" class="star" :class="{ filled: n <= book.rating }">★</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- START READING MODAL (Set Deadline) -->
    <div v-if="startingBook" class="modal-overlay" @click="startingBook = null">
      <div class="modal-content modal-sm" @click.stop>
        <div class="modal-header"><h3>Lesen beginnen</h3><button class="modal-close" @click="startingBook = null"><UIcon name="i-heroicons-x-mark" /></button></div>
        <div class="modal-body">
          <p style="color:rgba(255,255,255,0.7);font-size:0.9rem;margin-top:0;">{{ startingBook.title }}</p>
          <div class="fg" style="margin-top:1rem;">
            <label>Möchtest du eine Lese-Deadline setzen? (optional)</label>
            <input v-model="startDeadline" type="date" class="finput" />
          </div>
        </div>
        <div class="modal-footer"><button class="btn-primary" @click="confirmStartReading">Loslegen</button></div>
      </div>
    </div>

    <!-- INIT BOOK MODAL -->
    <div v-if="showAdd" class="modal-overlay" @click="showAdd = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header"><h3><UIcon name="i-heroicons-plus-circle" class="mi" /> Buch hinzufügen</h3><button class="modal-close" @click="showAdd = false"><UIcon name="i-heroicons-x-mark" /></button></div>
        <div class="modal-body">
          <div class="search-box" v-if="searchMode">
            <input v-model="searchQuery" type="text" placeholder="Suche nach Titel oder ISBN (OpenLibrary API)" class="finput" @keyup.enter="searchBooks" />
            <button class="add-form-btn wide" style="margin-top:0.5rem" @click="searchBooks"><UIcon name="i-heroicons-magnifying-glass" /> Suchen</button>
            <div v-if="searchResults.length" class="search-results">
              <div v-for="res in searchResults" :key="res.key" class="search-item" @click="selectSearchResult(res)">
                <img v-if="res.coverUrl" :src="res.coverUrl" class="res-cover" />
                <div v-else class="res-cover empty-cover">?</div>
                <div class="res-info">
                  <strong>{{ res.title }}</strong><br />
                  <small>{{ res.author }}</small>
                </div>
              </div>
            </div>
            <div v-if="isSearching" class="hint-msg">Suche läuft...</div>
            <div v-if="searchError" class="err-msg">{{ searchError }}</div>
            <button class="text-btn" style="margin-top:1rem" @click="searchMode = false">Manuell eingeben</button>
          </div>
          <div v-else>
            <div class="fg"><label>Titel</label><input v-model="newBook.title" type="text" class="finput" /></div>
            <div class="fg"><label>Autor</label><input v-model="newBook.author" type="text" class="finput" /></div>
            <div class="fg"><label>Gesamtseiten</label><input v-model.number="newBook.totalPages" type="number" class="finput" /></div>
            <div class="fg"><label>Cover URL (optional)</label><input v-model="newBook.cover" type="url" class="finput" placeholder="http..." /></div>
            <div class="fg"><label>Status</label>
              <select v-model="newBook.status" class="fselect">
                <option value="toread">Wunschliste</option>
                <option value="reading">Lese ich gerade</option>
                <option value="finished">Beendet</option>
              </select>
            </div>
            <div class="fg" v-if="newBook.status === 'reading'">
              <label>Deadline (optional)</label>
              <input v-model="newBook.deadline" type="date" class="finput" />
            </div>
            <button class="text-btn" style="margin-top:0.5rem" @click="searchMode = true">Per API suchen</button>
          </div>
        </div>
        <div class="modal-footer" v-if="!searchMode"><button class="btn-secondary" @click="showAdd = false">Abbrechen</button><button class="btn-primary" @click="addBook">Speichern</button></div>
      </div>
    </div>

    <!-- UPDATE PROGRESS MODAL -->
    <div v-if="updatingBook && viewingBook === null" class="modal-overlay" @click="updatingBook = null">
      <div class="modal-content modal-sm" @click.stop>
        <div class="modal-header"><h3>Fortschritt eintragen</h3><button class="modal-close" @click="updatingBook = null"><UIcon name="i-heroicons-x-mark" /></button></div>
        <div class="modal-body">
          <div class="fg"><label>Auf welcher Seite bist du? (Gesamt: {{ updatingBook.totalPages }})</label>
            <input v-model.number="newCurrentPage" type="number" min="0" :max="updatingBook.totalPages" class="finput" @keyup.enter="saveProgress"/>
          </div>
        </div>
        <div class="modal-footer"><button class="btn-primary" @click="saveProgress">Speichern</button></div>
      </div>
    </div>

    <!-- VIEW BOOK MODAL -->
    <div v-if="viewingBook" class="modal-overlay" @click="viewingBook = null">
      <div class="modal-content" @click.stop>
        <div class="modal-header"><h3>Buchdetails</h3><button class="modal-close" @click="viewingBook = null"><UIcon name="i-heroicons-x-mark" /></button></div>
        <div class="modal-body flex-body">
          <div class="vb-cover"><img v-if="viewingBook.cover" :src="viewingBook.cover" /><div v-else class="book-placeholder lg">{{ viewingBook.title.charAt(0) }}</div></div>
          <div class="vb-details">
            <h2>{{ viewingBook.title }}</h2>
            <p class="author">{{ viewingBook.author }}</p>
            <p v-if="viewingBook.status === 'finished'" class="status-badge fin">Beendet</p>
            <p v-else-if="viewingBook.status === 'reading'" class="status-badge rd">Lese ich gerade</p>
            <p v-else class="status-badge wsh">Wunschliste</p>

            <div v-if="viewingBook.status === 'reading'" class="vb-prog">
              Seiten: {{ viewingBook.currentPage }} / {{ viewingBook.totalPages }} ({{ getProgressPct(viewingBook).toFixed(0) }}%)
              <div class="fg" style="margin-top:1rem;">
                <label style="color:#a29bfe"><UIcon name="i-heroicons-clock" /> Deadline</label>
                <div style="display:flex;gap:0.5rem;align-items:center;">
                  <input v-model="viewingBook.deadline" type="date" class="finput sm" @change="save" />
                  <span v-if="getPagesPerDay(viewingBook) > 0" style="font-size:0.8rem;color:rgba(255,255,255,0.6)">{{ getPagesPerDay(viewingBook) }} Seiten/Tag</span>
                </div>
              </div>
            </div>

            <div v-if="viewingBook.status === 'finished'" class="fg" style="margin-top:1rem">
              <label>Buch bewerten</label>
              <div class="rating-sel">
                <span v-for="n in 5" :key="n" class="star-sel" :class="{ filled: n <= (viewingBook.rating || 0) }" @click="setRating(viewingBook, n)">★</span>
              </div>
            </div>
            
            <div class="fg" style="margin-top:1rem">
              <label>✨ Warum lese ich dieses Buch?</label>
              <textarea v-model="viewingBook.motivation" class="finput motivation-input" rows="2" placeholder="Was erhoffst du dir? Was motiviert dich?" @change="save"></textarea>
            </div>
            <div class="fg" style="margin-top:1rem">
              <label>Notizen / Rezension</label>
              <textarea v-model="viewingBook.review" class="finput" rows="4" @change="save"></textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer"><button class="btn-danger" @click="deleteBook(viewingBook.id)"><UIcon name="i-heroicons-trash" /> Löschen</button><button class="btn-primary" @click="viewingBook = null">Schließen</button></div>
      </div>
    </div>
  </div>
</template>

<script setup>
const books = ref([]);
const tab = ref('reading');
const showAdd = ref(false);

// ── Motivation quotes ─────────────────────────────────────────
const readingQuotes = [
  { text: 'Ein Leser lebt tausend Leben, bevor er stirbt. Einer, der nie liest, lebt nur einmal.', author: 'George R.R. Martin' },
  { text: 'Nicht alle, die wandern, sind verloren.', author: 'J.R.R. Tolkien' },
  { text: 'Das Lesen ist das beste Lernen.', author: 'Alexander Puschkin' },
  { text: 'Lesen ohne nachzudenken ist wie Essen ohne zu verdauen.', author: 'Edmund Burke' },
  { text: 'Bücher sind Spiegel: Man sieht in ihnen nur, was man bereits in sich hat.', author: 'Carlos Ruiz Zafón' },
  { text: 'Ein Buch ist ein Garten, den man in der Tasche trägt.', author: 'Arabisches Sprichwort' },
];
const quoteIndex = ref(0);
const currentQuote = computed(() => readingQuotes[quoteIndex.value % readingQuotes.length]);
const nextQuote = () => { quoteIndex.value++; };

// ── Daily page goal ─────────────────────────────────────────
const dailyPageGoal = ref(20);
const showGoalEdit = ref(false);
const todayStr2 = new Date().toISOString().split('T')[0];
const todayPagesRead = computed(() => {
  const log = JSON.parse(localStorage.getItem('reading_log') || '{}');
  return log[todayStr2] || 0;
});
const saveDailyGoal = () => localStorage.setItem('reading_daily_goal', String(dailyPageGoal.value));

const startingBook = ref(null);
const startDeadline = ref('');

const updatingBook = ref(null);
const viewingBook = ref(null);
const newCurrentPage = ref(0);

// Search API
const searchMode = ref(true);
const searchQuery = ref('');
const searchResults = ref([]);
const isSearching = ref(false);
const searchError = ref('');

const newBook = ref({ title: '', author: '', totalPages: 0, currentPage: 0, cover: '', status: 'toread', deadline: '' });

const booksCurrentlyReading = computed(() => books.value.filter(b => b.status === 'reading'));
const booksToRead = computed(() => books.value.filter(b => b.status === 'toread'));
const booksFinished = computed(() => books.value.filter(b => b.status === 'finished'));

const totalPagesRead = computed(() => {
  return books.value.reduce((s, b) => s + (b.currentPage || (b.status === 'finished' ? b.totalPages : 0)), 0);
});

const currentReadingStreak = computed(() => {
  const log = JSON.parse(localStorage.getItem('reading_log') || '{}');
  let streak = 0; const d = new Date();
  while (log[d.toISOString().split('T')[0]]) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
});

const getProgressPct = (b) => {
  if (!b.totalPages) return 0;
  return Math.min(100, (b.currentPage / b.totalPages) * 100);
};

const formatDateStr = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getPagesPerDay = (book) => {
  if (!book.deadline || book.status !== 'reading') return 0;
  const today = new Date(); today.setHours(0,0,0,0);
  const dl = new Date(book.deadline); dl.setHours(0,0,0,0);
  const diffDays = Math.max(1, Math.ceil((dl - today) / 86400000));
  const pagesLeft = book.totalPages - book.currentPage;
  if (pagesLeft <= 0) return 0;
  return Math.ceil(pagesLeft / diffDays);
};

const searchBooks = async () => {
  if (!searchQuery.value.trim()) return;
  isSearching.value = true; searchError.value = ''; searchResults.value = [];
  try {
    const q = encodeURIComponent(searchQuery.value);
    const res = await $fetch(`https://openlibrary.org/search.json?q=${q}&limit=5`);
    if (res.docs && res.docs.length > 0) {
      searchResults.value = res.docs.map(d => ({
        key: d.key,
        title: d.title,
        author: d.author_name ? d.author_name[0] : 'Unbekannt',
        totalPages: d.number_of_pages_median || 0,
        coverUrl: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : ''
      }));
    } else {
      searchError.value = 'Keine Ergebnisse gefunden.';
    }
  } catch (e) {
    searchError.value = 'Fehler bei der Suche.';
  }
  isSearching.value = false;
};

const selectSearchResult = (res) => {
  newBook.value = { title: res.title, author: res.author, totalPages: res.totalPages, currentPage: 0, cover: res.coverUrl, status: 'toread', deadline: '' };
  searchMode.value = false;
};

const addBook = () => {
  if (!newBook.value.title) return;
  books.value.push({ id: Date.now().toString(), ...newBook.value, rating: 0, review: '' });
  save(); showAdd.value = false;
  newBook.value = { title: '', author: '', totalPages: 0, currentPage: 0, cover: '', status: 'toread', deadline: '' };
  searchMode.value = true;
};

const openUpdateProgress = (book) => { updatingBook.value = book; newCurrentPage.value = book.currentPage; };

const saveProgress = () => {
  if (!updatingBook.value) return;
  const oldPages = updatingBook.value.currentPage;
  updatingBook.value.currentPage = Math.min(newCurrentPage.value, updatingBook.value.totalPages);
  
  const diff = updatingBook.value.currentPage - oldPages;
  if (diff > 0) {
    const log = JSON.parse(localStorage.getItem('reading_log') || '{}');
    const today = new Date().toISOString().split('T')[0];
    log[today] = (log[today] || 0) + diff;
    localStorage.setItem('reading_log', JSON.stringify(log));
  }

  if (updatingBook.value.currentPage >= updatingBook.value.totalPages) {
    updatingBook.value.status = 'finished';
  }
  save(); updatingBook.value = null;
};

const startReading = (book) => { 
  startingBook.value = book; 
  startDeadline.value = '';
};

const confirmStartReading = () => {
  if (startingBook.value) {
    startingBook.value.status = 'reading';
    startingBook.value.deadline = startDeadline.value;
    save();
    tab.value = 'reading';
    startingBook.value = null;
  }
};

const viewBook = (book) => { viewingBook.value = book; };
const setRating = (book, r) => { book.rating = r; save(); };
const deleteBook = (id) => { books.value = books.value.filter(b => b.id !== id); save(); viewingBook.value = null; };

const save = () => { localStorage.setItem('dashboard_books', JSON.stringify(books.value)); };
const load = () => {
  const storedGoal = localStorage.getItem('reading_daily_goal');
  if (storedGoal) dailyPageGoal.value = parseInt(storedGoal);
  const b = localStorage.getItem('dashboard_books');
  const oldB = localStorage.getItem('dashboard_current_book');
  
  if (b) {
    books.value = JSON.parse(b);
  } else if (oldB) {
    const oldBook = JSON.parse(oldB);
    books.value = [{ id: Date.now().toString(), title: oldBook.title, author: oldBook.author, totalPages: oldBook.totalPages, currentPage: oldBook.currentPage, cover: '', status: (oldBook.currentPage >= oldBook.totalPages) ? 'finished' : 'reading' }];
    save();
  }
};
onMounted(load);
</script>

<style scoped>
.books-container { min-height:100vh; background:linear-gradient(135deg,#0f0f1e 0%,#1a1a2e 50%,#16213e 100%); padding:2rem; color:white; }
.top-bar { display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; }
.back-btn,.add-btn { display:inline-flex; align-items:center; gap:0.5rem; padding:0.6rem 1.2rem; border-radius:12px; cursor:pointer; font-size:0.9rem; border:none; }
.back-btn { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color:rgba(255,255,255,0.8); }
.back-btn:hover { background:rgba(255,255,255,0.12); }
.add-btn { background:linear-gradient(135deg,#e056fd,#686de0); color:white; font-weight:600; }

.page-title { display:flex; align-items:center; gap:0.75rem; font-size:2.2rem; font-weight:700; margin:0 0 0.5rem; background:linear-gradient(135deg,#fff,#e056fd); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
.title-icon { width:2.5rem; height:2.5rem; }
.page-subtitle { color:rgba(255,255,255,0.5); margin:0 0 2rem; }

.stats-bar { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:1.5rem; }
.stat-box { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:1rem; text-align:center; }
.stat-box.glow { border-color:rgba(255,107,53,0.3); background:rgba(255,107,53,0.05); }
.stat-val { font-size:1.4rem; font-weight:700; color:#e056fd; }
.stat-box.glow .stat-val { color:#ff6b35; }
.stat-lbl { color:rgba(255,255,255,0.5); font-size:0.75rem; }

.tabs { display:flex; gap:0.4rem; margin-bottom:1.5rem; background:rgba(255,255,255,0.04); border-radius:12px; padding:4px; }
.tabs button { flex:1; padding:0.65rem; border-radius:10px; background:none; border:none; color:rgba(255,255,255,0.5); cursor:pointer; font-size:0.85rem; transition:all 0.2s; }
.tabs button.active { background:rgba(224,86,253,0.2); color:#e056fd; font-weight:600;}
.tab-content { animation:fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

.books-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:1rem; }
.book-card { display:flex; gap:1rem; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:1rem; cursor:pointer; transition:transform 0.2s; }
.book-card:hover { transform:translateY(-3px); background:rgba(255,255,255,0.06); }
.book-cover { width:70px; height:105px; flex-shrink:0; border-radius:6px; overflow:hidden; background:rgba(0,0,0,0.3); }
.book-cover img { width:100%; height:100%; object-fit:cover; }
.book-placeholder { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:2rem; font-weight:700; color:rgba(255,255,255,0.2); }
.book-placeholder.lg { width:150px; height:225px; font-size:4rem; }
.book-info { flex:1; display:flex; flex-direction:column; justify-content:center; }
.book-title { margin:0 0 0.2rem; font-size:1rem; font-weight:600; line-height:1.3; }
.book-author { margin:0 0 0.5rem; font-size:0.8rem; color:rgba(255,255,255,0.5); }
.book-progress { margin-top:0.5rem; }
.bp-bar { height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden; }
.bp-fill { height:100%; background:linear-gradient(90deg,#e056fd,#686de0); border-radius:3px; }
.bp-text { font-size:0.7rem; color:rgba(255,255,255,0.4); margin-top:0.25rem; text-align:right; }

.book-deadline-calc { display:flex; align-items:center; gap:0.3rem; margin-top:0.4rem; font-size:0.7rem; color:#a29bfe; font-weight:600;}

/* ── Motivation & daily goal ────────────────────────────── */
.motivation-banner { position:relative; background:linear-gradient(135deg,rgba(224,86,253,0.12),rgba(104,109,224,0.12)); border:1px solid rgba(224,86,253,0.25); border-radius:16px; padding:1.25rem 3rem 1.25rem 1.5rem; margin-bottom:1rem; }
.motivation-quote { font-size:0.95rem; font-style:italic; color:rgba(255,255,255,0.85); line-height:1.6; margin-bottom:0.4rem; }
.motivation-author { font-size:0.75rem; color:rgba(255,255,255,0.45); font-weight:500; }
.quote-next-btn { position:absolute; top:0.75rem; right:0.75rem; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:white; cursor:pointer; width:32px; height:32px; font-size:0.9rem; display:flex; align-items:center; justify-content:center; }
.quote-next-btn:hover { background:rgba(224,86,253,0.2); }

.daily-goal-card { display:flex; align-items:center; gap:1rem; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:1rem 1.25rem; margin-bottom:0.5rem; }
.dg-left { min-width:120px; }
.dg-label { font-size:0.7rem; color:rgba(255,255,255,0.4); margin-bottom:0.2rem; }
.dg-stats { display:flex; align-items:baseline; gap:0.3rem; }
.dg-today { font-size:1.4rem; font-weight:700; color:#e056fd; }
.dg-sep { color:rgba(255,255,255,0.3); }
.dg-goal { font-size:1rem; font-weight:600; color:rgba(255,255,255,0.6); }
.dg-unit { font-size:0.7rem; color:rgba(255,255,255,0.3); }
.dg-center { flex:1; }
.dg-pbar-wrap { height:8px; background:rgba(255,255,255,0.08); border-radius:99px; overflow:hidden; margin-bottom:0.3rem; }
.dg-pbar { height:100%; background:linear-gradient(90deg,#e056fd,#686de0); border-radius:99px; transition:width 0.4s; }
.dg-pct { font-size:0.7rem; color:rgba(255,255,255,0.4); text-align:right; }
.dg-right { }
.dg-edit-btn { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:white; cursor:pointer; padding:0.4rem 0.5rem; font-size:0.8rem; }
.goal-edit-row { display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem; color:rgba(255,255,255,0.6); font-size:0.85rem; }
.goal-input { max-width:100px !important; }
.motivation-input { font-style:italic; color:rgba(255,255,255,0.8); }

.update-btn { margin-top:auto; background:rgba(224,86,253,0.15); border:1px solid rgba(224,86,253,0.3); color:#e056fd; padding:0.4rem; border-radius:6px; font-size:0.75rem; cursor:pointer; }
.update-btn:hover { background:rgba(224,86,253,0.25); }
.start-btn { margin-top:auto; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.3); color:#10b981; padding:0.4rem; border-radius:6px; font-size:0.75rem; cursor:pointer; }
.book-meta { font-size:0.75rem; color:rgba(255,255,255,0.4); margin-top:0.5rem; }
.book-rating .star { color:rgba(255,255,255,0.2); font-size:1.2rem; }
.book-rating .star.filled { color:#ffd93d; }

.empty { display:flex; flex-direction:column; align-items:center; gap:0.5rem; padding:3rem; color:rgba(255,255,255,0.3); }
.empty svg { width:3rem; height:3rem; }

.search-box { margin-bottom:1.5rem; }
.search-results { margin-top:1rem; display:flex; flex-direction:column; gap:0.5rem; max-height:250px; overflow-y:auto; }
.search-item { display:flex; gap:0.75rem; padding:0.5rem; background:rgba(255,255,255,0.03); border-radius:8px; cursor:pointer; border:1px solid transparent; }
.search-item:hover { border-color:#e056fd; background:rgba(224,86,253,0.05); }
.res-cover { width:40px; height:60px; object-fit:cover; border-radius:4px; }
.empty-cover { background:rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,0.3); }
.res-info { flex:1; font-size:0.85rem; }
.res-info small { color:rgba(255,255,255,0.5); }
.hint-msg { color:rgba(255,255,255,0.4); font-size:0.8rem; margin:0.5rem 0; }
.err-msg { color:#ff6b6b; font-size:0.8rem; margin:0.5rem 0; }
.text-btn { background:none; border:none; color:#a29bfe; cursor:pointer; font-size:0.85rem; text-decoration:underline; }

.modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:1000; padding:1rem; }
.modal-content { background:#1a1a2e; border-radius:16px; max-width:550px; width:100%; max-height:90vh; overflow-y:auto; border:1px solid rgba(224,86,253,0.3); }
.modal-content.modal-sm { max-width:400px; }
.modal-header { display:flex; justify-content:space-between; align-items:center; padding:1.5rem; border-bottom:1px solid rgba(255,255,255,0.1); }
.modal-header h3 { display:flex; align-items:center; gap:0.5rem; margin:0; font-size:1.1rem; }
.mi { width:1.25rem; height:1.25rem; color:#e056fd; }
.modal-close { width:2rem; height:2rem; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:white; cursor:pointer; }
.modal-body { padding:1.5rem; } .modal-footer { display:flex; gap:1rem; padding:1.5rem; border-top:1px solid rgba(255,255,255,0.1); justify-content:flex-end; }
.fg { margin-bottom:1rem; } .fg label { display:block; color:rgba(255,255,255,0.6); font-size:0.8rem; margin-bottom:0.4rem; }
.finput { width:100%; padding:0.65rem 0.9rem; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:10px; color:white; font-size:0.9rem; outline:none; box-sizing:border-box; }
.finput:focus { border-color:#e056fd; }
.finput.sm { max-width:140px; padding:0.4rem 0.6rem; font-size:0.85rem;}
.fselect { width:100%; padding:0.65rem 0.9rem; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:10px; color:white; font-size:0.9rem; outline:none; }
.add-form-btn { display:flex; align-items:center; gap:0.4rem; padding:0.7rem 1.2rem; background:rgba(255,255,255,0.08); border:1px dashed rgba(255,255,255,0.2); border-radius:10px; color:white; cursor:pointer; justify-content:center; }
.add-form-btn:hover { background:rgba(224,86,253,0.15); border-color:#e056fd; color:#e056fd; }
.add-form-btn.wide { width:100%; }
.btn-primary { display:flex; align-items:center; gap:0.5rem; padding:0.7rem 1.3rem; border-radius:10px; background:linear-gradient(135deg,#e056fd,#686de0); color:white; font-weight:600; cursor:pointer; border:none; }
.btn-secondary { padding:0.7rem 1.3rem; border-radius:10px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:white; cursor:pointer; }
.btn-danger { display:flex; align-items:center; gap:0.4rem; padding:0.7rem 1.3rem; border-radius:10px; background:rgba(255,107,107,0.15); border:1px solid rgba(255,107,107,0.3); color:#ff6b6b; cursor:pointer; margin-right:auto; }

.flex-body { display:flex; gap:1.5rem; }
.vb-cover { width:120px; flex-shrink:0; border-radius:8px; overflow:hidden; }
.vb-cover img { width:100%; height:auto; display:block; }
.vb-details { flex:1; }
.vb-details h2 { margin:0 0 0.25rem; font-size:1.3rem; }
.author { color:rgba(255,255,255,0.6); margin:0 0 1rem; }
.status-badge { display:inline-block; padding:0.3rem 0.6rem; border-radius:6px; font-size:0.75rem; font-weight:600; }
.status-badge.wsh { background:rgba(255,255,255,0.1); color:white; }
.status-badge.rd { background:rgba(224,86,253,0.15); color:#e056fd; }
.status-badge.fin { background:rgba(16,185,129,0.15); color:#10b981; }
.vb-prog { margin-top:1rem; font-size:0.9rem; color:rgba(255,255,255,0.8); }
.rating-sel { display:flex; gap:0.3rem; }
.star-sel { font-size:1.5rem; color:rgba(255,255,255,0.1); cursor:pointer; transition:color 0.2s; }
.star-sel:hover, .star-sel.filled { color:#ffd93d; }

@media (max-width:768px) {
  .stats-bar { grid-template-columns:repeat(2,1fr); }
  .flex-body { flex-direction:column; align-items:center; text-align:center; }
  .vb-details { width:100%; }
  .rating-sel { justify-content:center; }
}
</style>
