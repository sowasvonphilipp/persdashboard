<template>
  <div class="todo-container">
    <div class="top-bar">
      <button class="back-btn" @click="goBack"><UIcon name="i-heroicons-arrow-left" /> {{ activeListId ? 'Zurück zu Listen' : 'Dashboard' }}</button>
      <button v-if="!activeListId" class="add-btn" @click="showAddList = true"><UIcon name="i-heroicons-plus" /> Neue Liste</button>
      <button v-if="activeListId" class="add-btn" @click="showAddTodo = true"><UIcon name="i-heroicons-plus" /> Neues Todo</button>
    </div>

    <!-- LISTS OVERVIEW -->
    <div v-if="!activeListId">
      <h1 class="page-title"><UIcon name="i-heroicons-list-bullet" class="title-icon" />Todo Listen</h1>
      <p class="page-subtitle">Verwalte deine Projekte und Phasen</p>

      <div class="lists-grid">
        <!-- Default all tasks list -->
        <div class="list-card default-list" @click="openAllTasks">
          <div class="lc-icon">📋</div>
          <div class="lc-content">
            <h3>Alle offenen Todos</h3>
            <p>{{ activeTodos.length }} Todos insgesamt</p>
          </div>
        </div>

        <!-- Custom Lists -->
        <div v-for="l in rawLists" :key="l.id" class="list-card" @click="activeListId = l.id">
          <div class="lc-icon">{{ l.emoji || '📌' }}</div>
          <div class="lc-content">
            <h3>{{ l.name }}</h3>
            <p v-if="l.startDate && l.endDate">{{ formatDate(l.startDate) }} - {{ formatDate(l.endDate) }}</p>
            <div class="lc-progress-bar"><div class="lc-progress-fill" :style="{ width: getListProgress(l.id) + '%' }"></div></div>
            <span class="lc-stats">{{ getListActiveTodos(l.id).length }} offene Todos</span>
          </div>
          <button class="list-del" @click.stop="deleteList(l.id)"><UIcon name="i-heroicons-trash" /></button>
        </div>
      </div>
      
      <div v-if="rawLists.length === 0" class="empty">
        <UIcon name="i-heroicons-rectangle-stack" />
        <p>Noch keine Listen. Klicke auf "Neue Liste"!</p>
      </div>
    </div>

    <!-- TASKS VIEW (For a specific list or All) -->
    <div v-else>
      <h1 class="page-title"><span class="title-emoji">{{ currentListObj ? currentListObj.emoji : '📋' }}</span> {{ currentListObj ? currentListObj.name : 'Alle Todos' }}</h1>
      <p v-if="currentListObj && currentListObj.startDate" class="page-subtitle">{{ formatDate(currentListObj.startDate) }} bis {{ formatDate(currentListObj.endDate) }}</p>
      <p v-else class="page-subtitle">Übersicht deiner Aufgaben</p>

      <!-- Filters -->
      <div class="filters">
        <div class="filter-group">
          <button class="filter-btn" :class="{ active: filterPrio === 'all' }" @click="filterPrio = 'all'">Alle Prio</button>
          <button class="filter-btn prio-high" :class="{ active: filterPrio === 'high' }" @click="filterPrio = 'high'">🔴 Hoch</button>
          <button class="filter-btn prio-mid" :class="{ active: filterPrio === 'medium' }" @click="filterPrio = 'medium'">🟡 Mittel</button>
          <button class="filter-btn prio-low" :class="{ active: filterPrio === 'low' }" @click="filterPrio = 'low'">🟢 Niedrig</button>
        </div>
        <div class="view-toggle">
          <button :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'"><UIcon name="i-heroicons-list-bullet" /> Liste</button>
          <button :class="{ active: viewMode === 'week' }" @click="viewMode = 'week'"><UIcon name="i-heroicons-calendar-days" /> Wochenansicht</button>
        </div>
      </div>

      <!-- LIST VIEW -->
      <div v-if="viewMode === 'list'" class="todo-list">
        <div v-if="overdueTodosList.length" class="todo-group">
          <h3 class="group-title overdue">🔴 Überfällig ({{ overdueTodosList.length }})</h3>
          <div v-for="t in overdueTodosList" :key="t.id" class="todo-item overdue" :class="{ done: t.done }">
            <div class="todo-check" @click="toggleTodo(t.id)"><UIcon v-if="t.done" name="i-heroicons-check" /></div>
            <div class="todo-body">
              <span class="todo-title">{{ t.title }}</span>
              <div class="todo-meta">
                <span v-if="activeListId === 'all'" class="todo-cat">{{ getListName(t.listId) }}</span>
                <span class="todo-prio" :class="t.priority">{{ t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🟢' }}</span>
                <span class="todo-due">{{ formatDue(t.dueDate) }}</span>
              </div>
            </div>
            <button class="todo-del" @click="deleteTodo(t.id)"><UIcon name="i-heroicons-trash" /></button>
          </div>
        </div>

        <div v-if="todayTodosList.length" class="todo-group">
          <h3 class="group-title today">📅 Heute fällig ({{ todayTodosList.length }})</h3>
          <div v-for="t in todayTodosList" :key="t.id" class="todo-item today" :class="{ done: t.done }">
            <div class="todo-check" @click="toggleTodo(t.id)"><UIcon v-if="t.done" name="i-heroicons-check" /></div>
            <div class="todo-body">
              <span class="todo-title">{{ t.title }}</span>
              <div class="todo-meta">
                <span v-if="activeListId === 'all'" class="todo-cat">{{ getListName(t.listId) }}</span>
                <span class="todo-prio" :class="t.priority">{{ t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🟢' }}</span>
                <span v-if="t.note" class="todo-note-icon" :title="t.note">📝</span>
              </div>
            </div>
            <button class="todo-del" @click="deleteTodo(t.id)"><UIcon name="i-heroicons-trash" /></button>
          </div>
        </div>

        <div v-if="upcomingTodosList.length" class="todo-group">
          <h3 class="group-title upcoming">📋 Kommend ({{ upcomingTodosList.length }})</h3>
          <div v-for="t in upcomingTodosList" :key="t.id" class="todo-item" :class="{ done: t.done }">
            <div class="todo-check" @click="toggleTodo(t.id)"><UIcon v-if="t.done" name="i-heroicons-check" /></div>
            <div class="todo-body">
              <span class="todo-title">{{ t.title }}</span>
              <div class="todo-meta">
                <span v-if="activeListId === 'all'" class="todo-cat">{{ getListName(t.listId) }}</span>
                <span class="todo-prio">{{ t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🟢' }}</span>
                <span class="todo-due">{{ formatDue(t.dueDate) }}</span>
              </div>
            </div>
            <button class="todo-del" @click="deleteTodo(t.id)"><UIcon name="i-heroicons-trash" /></button>
          </div>
        </div>

        <div v-if="recentlyDoneList.length" class="todo-group">
          <h3 class="group-title done-title">✅ Erledigt (Kürzlich)</h3>
          <div v-for="t in recentlyDoneList" :key="t.id" class="todo-item done">
            <div class="todo-check checked" @click="toggleTodo(t.id)"><UIcon name="i-heroicons-check" /></div>
            <div class="todo-body"><span class="todo-title">{{ t.title }}</span></div>
            <button class="todo-del" @click="deleteTodo(t.id)"><UIcon name="i-heroicons-trash" /></button>
          </div>
        </div>

        <div v-if="filteredViewTodos.length === 0" class="empty">
          <UIcon name="i-heroicons-inbox" /><p>Keine Todos gefunden</p>
        </div>
      </div>

      <!-- WEEK VIEW -->
      <div v-if="viewMode === 'week'" class="week-view">
        <div v-for="day in next14Days" :key="day.key" class="week-day" :class="{ today: day.isToday }">
          <div class="week-day-header">
            <span class="wdh-name">{{ day.dayName }}</span>
            <span class="wdh-date">{{ day.label }}</span>
            <span class="wdh-count" v-if="getTodosForDayInView(day.key).length">{{ getTodosForDayInView(day.key).length }}</span>
          </div>
          <div v-for="t in getTodosForDayInView(day.key)" :key="t.id" class="week-todo" :class="{ done: t.done }" @click="toggleTodo(t.id)">
            <span class="wt-prio">{{ t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🟢' }}</span>
            <span class="wt-title">{{ t.title }}</span>
          </div>
          <div v-if="getTodosForDayInView(day.key).length === 0" class="week-empty">—</div>
        </div>
      </div>
    </div>

    <!-- MODAL: ADD LIST -->
    <div v-if="showAddList" class="modal-overlay" @click="showAddList = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header"><h3><UIcon name="i-heroicons-folder-plus" class="mi" /> Neue Liste erstellen</h3><button class="modal-close" @click="showAddList = false"><UIcon name="i-heroicons-x-mark" /></button></div>
        <div class="modal-body">
          <div class="fg"><label>Listenname</label><input v-model="newList.name" type="text" placeholder="z.B. Ferien, Projekt X..." class="finput" /></div>
          <div class="fg2">
            <div class="fg"><label>Von</label><input v-model="newList.startDate" type="date" class="finput" /></div>
            <div class="fg"><label>Bis</label><input v-model="newList.endDate" type="date" class="finput" /></div>
          </div>
          <div class="fg">
            <label>Emoji</label>
            <div class="opt-row">
              <button v-for="e in ['📌','🚀','🏖️','📚','💼','🎯','💪','🎓']" :key="e" class="opt-btn" :class="{ sel: newList.emoji === e }" @click="newList.emoji = e">{{ e }}</button>
            </div>
          </div>
        </div>
        <div class="modal-footer"><button class="btn-secondary" @click="showAddList = false">Abbrechen</button><button class="btn-primary" @click="addList" :disabled="!newList.name.trim()"><UIcon name="i-heroicons-check" /> Speichern</button></div>
      </div>
    </div>

    <!-- MODAL: ADD TODO -->
    <div v-if="showAddTodo" class="modal-overlay" @click="showAddTodo = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header"><h3><UIcon name="i-heroicons-plus-circle" class="mi" /> Neues Todo</h3><button class="modal-close" @click="showAddTodo = false"><UIcon name="i-heroicons-x-mark" /></button></div>
        <div class="modal-body">
          <div class="fg"><label>Titel</label><input v-model="newTodo.title" type="text" placeholder="Was muss erledigt werden?" class="finput" @keyup.enter="addTodo" /></div>
          <div class="fg"><label>Notiz (optional)</label><input v-model="newTodo.note" type="text" placeholder="Details..." class="finput" /></div>
          <div class="fg"><label>Fällig am</label><input v-model="newTodo.dueDate" type="date" class="finput" /></div>
          
          <div class="fg" v-if="activeListId === 'all'">
            <label>Liste</label>
            <select v-model="newTodo.listId" class="finput">
              <option value="default">Standard Liste</option>
              <option v-for="l in rawLists" :key="l.id" :value="l.id">{{ l.emoji }} {{ l.name }}</option>
            </select>
          </div>

          <div class="fg">
            <label>Priorität</label>
            <div class="opt-row">
              <button class="opt-btn" :class="{ sel: newTodo.priority === 'high' }" @click="newTodo.priority = 'high'">🔴 Hoch</button>
              <button class="opt-btn" :class="{ sel: newTodo.priority === 'medium' }" @click="newTodo.priority = 'medium'">🟡 Mittel</button>
              <button class="opt-btn" :class="{ sel: newTodo.priority === 'low' }" @click="newTodo.priority = 'low'">🟢 Niedrig</button>
            </div>
          </div>
        </div>
        <div class="modal-footer"><button class="btn-secondary" @click="showAddTodo = false">Abbrechen</button><button class="btn-primary" @click="addTodo" :disabled="!newTodo.title.trim()"><UIcon name="i-heroicons-check" /> Hinzufügen</button></div>
      </div>
    </div>

  </div>
</template>

<script setup>
const router = useRouter();

// State
const rawLists = ref([]);
const rawTodos = ref([]);
const activeListId = ref(null); // null = Lists View, 'all' = All Tasks, 'id' = Specific List
const viewMode = ref('list');
const filterPrio = ref('all');

const showAddList = ref(false);
const showAddTodo = ref(false);

const newList = ref({ name: '', startDate: '', endDate: '', emoji: '📌' });
const newTodo = ref({ title: '', note: '', dueDate: new Date().toISOString().split('T')[0], priority: 'medium', listId: 'default' });

const todayStr = computed(() => new Date().toISOString().split('T')[0]);

// Derived Data
const activeTodos = computed(() => rawTodos.value.filter(t => !t.done));

const currentListObj = computed(() => {
  if (!activeListId.value || activeListId.value === 'all') return null;
  return rawLists.value.find(l => l.id === activeListId.value);
});

// Getter functions
const formatDate = (ds) => {
  if (!ds) return '';
  return new Date(ds).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
};
const getListName = (lid) => {
  if (lid === 'default') return 'Standard';
  const l = rawLists.value.find(x => x.id === lid);
  return l ? l.name : 'Gelöschte Liste';
};

const getListActiveTodos = (lid) => rawTodos.value.filter(t => t.listId === lid && !t.done);
const getListProgress = (lid) => {
  const all = rawTodos.value.filter(t => t.listId === lid);
  if (all.length === 0) return 0;
  const done = all.filter(t => t.done);
  return (done.length / all.length) * 100;
};

// Viewing active list logic
const filteredViewTodos = computed(() => {
  let list = rawTodos.value;
  if (activeListId.value !== 'all') {
    list = list.filter(t => t.listId === activeListId.value);
  }
  if (filterPrio.value !== 'all') {
    list = list.filter(t => t.priority === filterPrio.value);
  }
  return list;
});

const activeViewTodos = computed(() => filteredViewTodos.value.filter(t => !t.done));
const overdueTodosList = computed(() => activeViewTodos.value.filter(t => t.dueDate < todayStr.value).sort((a,b) => a.dueDate.localeCompare(b.dueDate)));
const todayTodosList = computed(() => activeViewTodos.value.filter(t => t.dueDate === todayStr.value).sort((a, b) => a.done - b.done));
const upcomingTodosList = computed(() => activeViewTodos.value.filter(t => t.dueDate > todayStr.value).sort((a,b) => a.dueDate.localeCompare(b.dueDate)));
const recentlyDoneList = computed(() => filteredViewTodos.value.filter(t => t.done).slice(0, 10));

const formatDue = (d) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(d + 'T00:00:00'); 
  const diff = Math.round((due - today) / 86400000);
  if (diff < 0) return `${Math.abs(diff)}d überfällig`;
  if (diff === 0) return 'Heute';
  if (diff === 1) return 'Morgen';
  return `in ${diff} Tagen`;
};

// Week View logic
const next14Days = computed(() => {
  const days = [];
  const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  for (let i = 0; i < 14; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    days.push({ key, dayName: dayNames[d.getDay()], label: `${d.getDate()}.${d.getMonth() + 1}`, isToday: i === 0 });
  }
  return days;
});
const getTodosForDayInView = (key) => activeViewTodos.value.filter(t => t.dueDate === key);

// Actions
const goBack = () => {
  if (activeListId.value) activeListId.value = null;
  else navigateTo('/dashboard');
};

const openAllTasks = () => {
  activeListId.value = 'all';
};

const addList = () => {
  if (!newList.value.name.trim()) return;
  rawLists.value.push({ id: Date.now().toString(), ...JSON.parse(JSON.stringify(newList.value)) });
  save();
  showAddList.value = false;
  newList.value = { name: '', startDate: '', endDate: '', emoji: '📌' };
};

const deleteList = (id) => {
  rawLists.value = rawLists.value.filter(l => l.id !== id);
  rawTodos.value = rawTodos.value.filter(t => t.listId !== id);
  save();
};

const addTodo = () => {
  if (!newTodo.value.title.trim()) return;
  const targetId = activeListId.value && activeListId.value !== 'all' ? activeListId.value : newTodo.value.listId;
  rawTodos.value.push({
    id: Date.now().toString(),
    title: newTodo.value.title,
    note: newTodo.value.note,
    dueDate: newTodo.value.dueDate,
    priority: newTodo.value.priority,
    listId: targetId,
    done: false,
    doneDate: null
  });
  save();
  showAddTodo.value = false;
  newTodo.value = { title: '', note: '', dueDate: todayStr.value, priority: 'medium', listId: 'default' };
};

const toggleTodo = (id) => {
  const t = rawTodos.value.find(x => x.id === id);
  if (t) { t.done = !t.done; t.doneDate = t.done ? todayStr.value : null; save(); }
};

const deleteTodo = (id) => {
  rawTodos.value = rawTodos.value.filter(t => t.id !== id);
  save();
};

const save = () => {
  localStorage.setItem('todo_lists_v2', JSON.stringify(rawLists.value));
  localStorage.setItem('todo_items_v2', JSON.stringify(rawTodos.value));
};

const loadAndMigrate = () => {
  // Try loading V2
  const lv2 = localStorage.getItem('todo_lists_v2');
  const tv2 = localStorage.getItem('todo_items_v2');
  if (lv2 || tv2) {
    if (lv2) rawLists.value = JSON.parse(lv2);
    if (tv2) rawTodos.value = JSON.parse(tv2);
    return;
  }
  
  // Migrate V1
  const old = localStorage.getItem('todo_list');
  if (old) {
    const oldTodos = JSON.parse(old);
    rawTodos.value = oldTodos.map(t => ({
      ...t,
      listId: 'default'
    }));
    save();
  }
};

onMounted(loadAndMigrate);
</script>

<style scoped>
.todo-container { min-height:100vh; background:linear-gradient(135deg,#0f0f1e 0%,#1a1a2e 50%,#16213e 100%); padding:2rem; color:white; }
.top-bar { display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; }
.back-btn,.add-btn { display:inline-flex; align-items:center; gap:0.5rem; padding:0.6rem 1.2rem; border-radius:12px; cursor:pointer; transition:all 0.2s; font-size:0.9rem; border:none; }
.back-btn { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color:rgba(255,255,255,0.8); }
.back-btn:hover { background:rgba(255,255,255,0.12); color:white; }
.add-btn { background:linear-gradient(135deg,#4facfe,#00f2fe); color:white; font-weight:600; }
.add-btn:hover { box-shadow:0 8px 25px rgba(79,172,254,0.4); }
.page-title { display:flex; align-items:center; gap:0.75rem; font-size:2.2rem; font-weight:700; margin:0 0 0.5rem; background:linear-gradient(135deg,#fff,#4facfe); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
.title-icon { width:2.5rem; height:2.5rem; }
.title-emoji { font-size:2.2rem; }
.page-subtitle { color:rgba(255,255,255,0.5); margin:0 0 2rem; }

/* LISTS GRID */
.lists-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(250px, 1fr)); gap:1.25rem; }
.list-card { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:1.5rem; cursor:pointer; transition:all 0.2s; position:relative; }
.list-card:hover { transform:translateY(-3px); border-color:#4facfe; background:rgba(255,255,255,0.06); }
.list-card.default-list { background:radial-gradient(circle at top right, rgba(79,172,254,0.1), transparent), rgba(255,255,255,0.04); border-color:rgba(79,172,254,0.3); }
.lc-icon { font-size:2rem; margin-bottom:1rem; }
.lc-content h3 { margin:0 0 0.3rem; font-size:1.1rem; }
.lc-content p { margin:0; font-size:0.8rem; color:rgba(255,255,255,0.5); }
.lc-progress-bar { height:6px; background:rgba(255,255,255,0.1); border-radius:4px; margin:0.8rem 0; overflow:hidden; }
.lc-progress-fill { height:100%; background:linear-gradient(90deg,#4facfe,#00f2fe); transition:width 0.4s; }
.lc-stats { font-size:0.75rem; color:#4facfe; font-weight:600; }
.list-del { position:absolute; top:1rem; right:1rem; background:rgba(255,107,107,0.1); border:none; color:#ff6b6b; padding:0.4rem; border-radius:8px; cursor:pointer; opacity:0; transition:all 0.2s; }
.list-card:hover .list-del { opacity:1; }
.list-del:hover { background:#ff6b6b; color:white; }

/* FILTERS */
.filters { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem; }
.filter-group { display:flex; gap:0.4rem; flex-wrap:wrap; }
.filter-btn { padding:0.4rem 0.8rem; border-radius:20px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.6); cursor:pointer; font-size:0.8rem; transition:all 0.2s; }
.filter-btn.active { background:rgba(79,172,254,0.15); border-color:#4facfe; color:#4facfe; }

.view-toggle { display:flex; gap:0.4rem; background:rgba(255,255,255,0.04); border-radius:12px; padding:4px; }
.view-toggle button { display:flex; align-items:center; justify-content:center; gap:0.4rem; padding:0.6rem 1rem; border-radius:10px; background:none; border:none; color:rgba(255,255,255,0.5); cursor:pointer; font-size:0.85rem; transition:all 0.2s; }
.view-toggle button.active { background:rgba(79,172,254,0.2); color:#4facfe; }

/* TASKS LIST */
.todo-group { margin-bottom:1.5rem; }
.group-title { font-size:0.9rem; font-weight:600; margin:0 0 0.5rem; color:rgba(255,255,255,0.7); }
.group-title.overdue { color:#ff6b6b; }
.group-title.today { color:#4facfe; }

.todo-item { display:flex; align-items:center; gap:0.75rem; padding:0.75rem 1rem; background:rgba(255,255,255,0.04); border-radius:12px; margin-bottom:0.4rem; border-left:3px solid rgba(255,255,255,0.1); transition:all 0.2s; }
.todo-item.overdue { border-left-color:#ff6b6b; }
.todo-item.today { border-left-color:#4facfe; }
.todo-item.done { opacity:0.5; }
.todo-item.done .todo-title { text-decoration:line-through; }

.todo-check { width:24px; height:24px; border-radius:6px; border:2px solid rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; transition:all 0.2s; }
.todo-check:hover { border-color:#4facfe; }
.todo-check.checked,.todo-item.done .todo-check { background:#10b981; border-color:#10b981; }
.todo-check svg { width:14px; height:14px; }

.todo-body { flex:1; min-width:0; }
.todo-title { font-size:0.9rem; display:block; }
.todo-meta { display:flex; gap:0.5rem; align-items:center; margin-top:0.2rem; font-size:0.75rem; color:rgba(255,255,255,0.4); }
.todo-cat { background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:6px; font-size:0.65rem; color:white; }
.todo-due { color:#a29bfe; }
.todo-del { background:none; border:none; color:rgba(255,255,255,0.15); cursor:pointer; padding:4px; }
.todo-del:hover { color:#ff6b6b; }

/* Week View */
.week-view { display:grid; grid-template-columns:repeat(7,1fr); gap:0.5rem; }
.week-day { background:rgba(255,255,255,0.03); border-radius:12px; padding:0.75rem 0.5rem; min-height:120px; border:1px solid rgba(255,255,255,0.06); }
.week-day.today { border-color:#4facfe; background:rgba(79,172,254,0.05); }
.week-day-header { text-align:center; margin-bottom:0.5rem; padding-bottom:0.4rem; border-bottom:1px solid rgba(255,255,255,0.06); }
.wdh-name { display:block; font-size:0.7rem; color:rgba(255,255,255,0.4); text-transform:uppercase; }
.wdh-date { display:block; font-size:0.85rem; font-weight:600; }
.wdh-count { display:inline-block; background:rgba(79,172,254,0.2); color:#4facfe; font-size:0.65rem; padding:1px 6px; border-radius:10px; margin-top:2px; }
.week-todo { padding:0.3rem 0.4rem; background:rgba(255,255,255,0.04); border-radius:6px; margin-bottom:0.3rem; font-size:0.7rem; cursor:pointer; display:flex; gap:0.3rem; align-items:center; }
.week-todo.done { opacity:0.4; text-decoration:line-through; }
.wt-prio { font-size:0.55rem; }
.wt-title { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.week-empty { text-align:center; color:rgba(255,255,255,0.15); font-size:0.75rem; }

.empty { display:flex; flex-direction:column; align-items:center; gap:0.5rem; padding:3rem; color:rgba(255,255,255,0.3); }
.empty svg { width:3rem; height:3rem; }

/* Modal */
.modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:1000; padding:1rem; }
.modal-content { background:#1a1a2e; border-radius:16px; max-width:550px; width:100%; max-height:90vh; overflow-y:auto; border:1px solid rgba(79,172,254,0.2); }
.modal-header { display:flex; justify-content:space-between; align-items:center; padding:1.5rem; border-bottom:1px solid rgba(255,255,255,0.1); }
.modal-header h3 { display:flex; align-items:center; gap:0.5rem; margin:0; font-size:1.1rem; }
.mi { width:1.25rem; height:1.25rem; color:#4facfe; }
.modal-close { width:2rem; height:2rem; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:white; cursor:pointer; }
.modal-body { padding:1.5rem; }
.modal-footer { display:flex; gap:1rem; padding:1.5rem; border-top:1px solid rgba(255,255,255,0.1); justify-content:flex-end; }
.fg { margin-bottom:1rem; }
.fg2 { display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; }
.fg label { display:block; color:rgba(255,255,255,0.6); font-size:0.8rem; margin-bottom:0.4rem; }
.finput { width:100%; padding:0.7rem 1rem; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:10px; color:white; font-size:0.9rem; outline:none; box-sizing:border-box; }
.finput:focus { border-color:#4facfe; }
.finput::placeholder { color:rgba(255,255,255,0.3); }
option { background:#1a1a2e; }
.opt-row { display:flex; gap:0.4rem; flex-wrap:wrap; }
.opt-btn { padding:0.4rem 0.75rem; border-radius:8px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.6); cursor:pointer; font-size:0.8rem; transition:all 0.2s; }
.opt-btn.sel { background:rgba(79,172,254,0.15); border-color:#4facfe; color:#4facfe; }
.btn-primary { display:flex; align-items:center; gap:0.5rem; padding:0.7rem 1.3rem; border-radius:10px; background:linear-gradient(135deg,#4facfe,#00f2fe); color:white; font-weight:600; cursor:pointer; border:none; }
.btn-primary:disabled { opacity:0.4; cursor:not-allowed; }
.btn-secondary { padding:0.7rem 1.3rem; border-radius:10px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:white; cursor:pointer; }
.btn-danger { background:rgba(255,107,107,0.1); color:#ff6b6b; border:1px solid rgba(255,107,107,0.3); padding:0.7rem 1.3rem; border-radius:10px; cursor:pointer;}

@media (max-width:768px) {
  .filters { flex-direction:column; align-items:stretch; }
  .view-toggle { justify-content:center; }
  .week-view { grid-template-columns:repeat(2,1fr); }
  .page-title { font-size:1.6rem; }
}
</style>
