<template>
  <div class="aufgaben-page">
    <div class="page-header">
      <div class="header-left">
        <button class="back-button" @click="navigateTo('/dashboard')">
          <UIcon name="i-lucide-arrow-left" />
          <span>Zurück</span>
        </button>
        <div class="header-title">
          <h1>
            <UIcon name="i-lucide-check-square" class="header-icon" />
            Aufgaben Manager
          </h1>
          <p class="subtitle" v-if="isAuthenticated">{{ incompleteTasks.length }} offen • {{ completedTasks.length }} erledigt</p>
        </div>
      </div>
      <div class="header-right">
        <button v-if="isAuthenticated" class="icon-button refresh-btn" @click="loadTasks" :disabled="isLoading" title="Aktualisieren">
          <UIcon name="i-lucide-refresh-cw" :class="{ spinning: isLoading }" />
        </button>
        <button v-if="isAuthenticated" class="signout-button" @click="handleSignOut">
          <UIcon name="i-lucide-log-out" />
          <span>Abmelden</span>
        </button>
      </div>
    </div>

    <!-- Not Authenticated -->
    <div v-if="!isAuthenticated" class="auth-card">
      <UIcon name="i-lucide-lock" class="auth-icon" />
      <h2>Google Tasks Zugriff erforderlich</h2>
      <p>Melde dich mit deinem Google-Konto an, um deine Aufgaben zu verwalten.</p>
      <button class="google-signin-btn" @click="signIn">
        <UIcon name="i-lucide-log-in" />
        <span>Mit Google anmelden</span>
      </button>
    </div>

    <!-- Authenticated Content -->
    <div v-else class="authenticated-content">
      <!-- Quick Actions -->
      <div class="quick-actions">
        <button class="action-card" @click="showCreateTask = true">
          <UIcon name="i-lucide-plus-circle" />
          <span>Neue Aufgabe</span>
        </button>
        <button class="action-card" @click="showCreateList = true">
          <UIcon name="i-lucide-folder-plus" />
          <span>Neue Liste</span>
        </button>
        <button class="action-card" :class="{ active: showCompleted }" @click="showCompleted = !showCompleted">
          <UIcon name="i-lucide-check-check" />
          <span>{{ showCompleted ? 'Erledigte ausblenden' : 'Erledigte anzeigen' }}</span>
        </button>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="error-card">
        <UIcon name="i-lucide-alert-circle" class="error-icon" />
        <div>
          <h3>Fehler</h3>
          <p>{{ error }}</p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-card">
        <UIcon name="i-lucide-loader-2" class="loading-icon" />
        <p>Aufgaben werden geladen...</p>
      </div>

      <!-- Task Lists -->
      <div v-else class="task-lists-container">
        <!-- Filter Tabs -->
        <div class="filter-tabs">
          <button 
            class="tab-btn" 
            :class="{ active: currentFilter === 'all' }"
            @click="currentFilter = 'all'"
          >
            <UIcon name="i-lucide-list" />
            Alle ({{ allTasks.length }})
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: currentFilter === 'today' }"
            @click="currentFilter = 'today'"
          >
            <UIcon name="i-lucide-calendar-days" />
            Heute ({{ todayTasks.length }})
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: currentFilter === 'week' }"
            @click="currentFilter = 'week'"
          >
            <UIcon name="i-lucide-calendar-range" />
            Diese Woche ({{ weekTasks.length }})
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: currentFilter === 'overdue' }"
            @click="currentFilter = 'overdue'"
          >
            <UIcon name="i-lucide-alert-triangle" />
            Überfällig ({{ overdueTasks.length }})
          </button>
        </div>

        <!-- Tasks by List -->
        <div v-if="filteredTasks.length === 0" class="no-tasks">
          <UIcon name="i-lucide-check-circle-2" />
          <h3>Keine Aufgaben gefunden</h3>
          <p>Erstelle eine neue Aufgabe, um loszulegen!</p>
        </div>

        <div v-else class="lists-grid">
          <div v-for="list in taskLists" :key="list.id" class="task-list-card">
            <div class="list-header">
              <div class="list-title">
                <UIcon name="i-lucide-folder" />
                <h2>{{ list.title }}</h2>
                <span class="task-count">{{ getListTasks(list.id).length }}</span>
              </div>
              <div class="list-actions">
                <button class="icon-btn" @click="selectedList = list.id; showCreateTask = true" title="Aufgabe hinzufügen">
                  <UIcon name="i-lucide-plus" />
                </button>
                <button class="icon-btn delete-btn" @click="confirmDeleteList(list)" title="Liste löschen">
                  <UIcon name="i-lucide-trash-2" />
                </button>
              </div>
            </div>

            <div class="tasks-list">
              <div 
                v-for="task in getListTasks(list.id)" 
                :key="task.id" 
                class="task-item"
                :class="{ completed: task.status === 'completed', overdue: isOverdue(task) }"
              >
                <button 
                  class="task-checkbox" 
                  @click="toggleTaskComplete(task)"
                  :class="{ checked: task.status === 'completed' }"
                >
                  <UIcon v-if="task.status === 'completed'" name="i-lucide-check" />
                </button>
                
                <div class="task-content" @click="viewTaskDetail(task)">
                  <div class="task-header-row">
                    <h3 class="task-title">
                      <UIcon v-if="isTaskImportant(task)" name="i-lucide-star" class="star-icon" />
                      {{ task.title }}
                    </h3>
                    <div class="task-badges">
                      <span v-if="hasSubtasks(task)" class="badge subtasks-badge">
                        <UIcon name="i-lucide-list-tree" />
                        {{ getSubtasksCount(task) }}
                      </span>
                      <span v-if="task.links && task.links.length > 0" class="badge links-badge">
                        <UIcon name="i-lucide-link" />
                        {{ task.links.length }}
                      </span>
                    </div>
                  </div>
                  <p v-if="task.notes" class="task-notes">{{ getTaskNotesPreview(task.notes) }}</p>
                  <div v-if="task.due || (task.links && task.links.length > 0)" class="task-meta">
                    <span v-if="task.due" class="task-due" :class="{ overdue: isOverdue(task) }">
                      <UIcon name="i-lucide-calendar" />
                      {{ formatDueDate(task.due) }}
                    </span>
                  </div>
                </div>

                <div class="task-actions">
                  <button class="icon-btn" @click="editTask(task)" title="Bearbeiten">
                    <UIcon name="i-lucide-pencil" />
                  </button>
                  <button class="icon-btn delete-btn" @click="confirmDeleteTask(task)" title="Löschen">
                    <UIcon name="i-lucide-trash-2" />
                  </button>
                </div>
              </div>

              <div v-if="getListTasks(list.id).length === 0" class="empty-list">
                <UIcon name="i-lucide-inbox" />
                <p>Keine Aufgaben in dieser Liste</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Task Modal -->
    <div v-if="showCreateTask" class="modal-overlay" @click="closeTaskModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>
            <UIcon :name="editingTask ? 'i-lucide-pencil' : 'i-lucide-plus-circle'" />
            {{ editingTask ? 'Aufgabe bearbeiten' : 'Neue Aufgabe' }}
          </h3>
          <button class="close-btn" @click="closeTaskModal">
            <UIcon name="i-lucide-x" />
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Titel *</label>
            <input 
              v-model="taskForm.title" 
              type="text" 
              placeholder="Was möchtest du erledigen?"
              class="form-input"
              @keyup.enter="saveTask"
            />
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="taskForm.important" />
              <UIcon name="i-lucide-star" />
              Als wichtig markieren
            </label>
          </div>

          <div class="form-group">
            <label>Detaillierte Notizen</label>
            <textarea 
              v-model="taskForm.notes" 
              placeholder="Füge Details, Beschreibungen oder Anmerkungen hinzu..."
              class="form-textarea"
              rows="4"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Fälligkeitsdatum</label>
              <input 
                v-model="taskForm.due" 
                type="datetime-local" 
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label>Wiederholung</label>
              <select v-model="taskForm.repeat" class="form-select">
                <option value="">Keine Wiederholung</option>
                <option value="daily">Täglich</option>
                <option value="weekly">Wöchentlich</option>
                <option value="monthly">Monatlich</option>
                <option value="yearly">Jährlich</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Liste</label>
            <select v-model="taskForm.listId" class="form-select">
              <option v-for="list in taskLists" :key="list.id" :value="list.id">
                {{ list.title }}
              </option>
            </select>
          </div>

          <!-- Links/Attachments Section -->
          <div class="form-section">
            <label class="section-label">
              <UIcon name="i-lucide-link" />
              Links & Anhänge
            </label>
            
            <div class="links-list">
              <div 
                v-for="(link, index) in taskForm.links" 
                :key="index" 
                class="link-item"
              >
                <UIcon name="i-lucide-link" class="link-icon" />
                <div class="link-info">
                  <span class="link-description">{{ link.description || link.link }}</span>
                  <span class="link-url">{{ link.link }}</span>
                </div>
                <button 
                  type="button" 
                  class="icon-btn-small delete-btn" 
                  @click="removeLink(index)"
                  title="Link entfernen"
                >
                  <UIcon name="i-lucide-x" />
                </button>
              </div>
            </div>

            <div class="add-link-form">
              <input 
                v-model="newLinkUrl" 
                type="url" 
                placeholder="URL (https://...)"
                class="form-input"
              />
              <input 
                v-model="newLinkDescription" 
                type="text" 
                placeholder="Beschreibung (optional)"
                class="form-input"
              />
              <button 
                type="button" 
                class="btn-add-link" 
                @click="addLink"
                :disabled="!newLinkUrl"
              >
                <UIcon name="i-lucide-plus" />
                Link hinzufügen
              </button>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeTaskModal">
            Abbrechen
          </button>
          <button class="btn btn-primary" @click="saveTask" :disabled="!taskForm.title">
            <UIcon name="i-lucide-save" />
            {{ editingTask ? 'Speichern' : 'Erstellen' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Create List Modal -->
    <div v-if="showCreateList" class="modal-overlay" @click="showCreateList = false">
      <div class="modal-content small" @click.stop>
        <div class="modal-header">
          <h3>
            <UIcon name="i-lucide-folder-plus" />
            Neue Liste erstellen
          </h3>
          <button class="close-btn" @click="showCreateList = false">
            <UIcon name="i-lucide-x" />
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Listen-Name *</label>
            <input 
              v-model="newListName" 
              type="text" 
              placeholder="z.B. Arbeit, Privat, Einkaufen..."
              class="form-input"
              @keyup.enter="createList"
            />
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showCreateList = false">
            Abbrechen
          </button>
          <button class="btn btn-primary" @click="createList" :disabled="!newListName">
            <UIcon name="i-lucide-plus" />
            Erstellen
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click="showDeleteConfirm = false">
      <div class="modal-content small" @click.stop>
        <div class="modal-header danger">
          <UIcon name="i-lucide-alert-triangle" class="modal-icon" />
          <h3>{{ deleteTarget?.type === 'list' ? 'Liste löschen?' : 'Aufgabe löschen?' }}</h3>
        </div>
        <p class="modal-text">
          Möchtest du {{ deleteTarget?.type === 'list' ? 'die Liste' : 'die Aufgabe' }} 
          <strong>"{{ deleteTarget?.item?.title }}"</strong> wirklich löschen?
          {{ deleteTarget?.type === 'list' ? ' Alle Aufgaben in dieser Liste werden ebenfalls gelöscht.' : '' }}
        </p>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showDeleteConfirm = false">
            Abbrechen
          </button>
          <button class="btn btn-danger" @click="handleDelete">
            <UIcon name="i-lucide-trash-2" />
            Löschen
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const router = useRouter();

const {
  isAuthenticated,
  signIn: tasksSignIn,
  signOut: tasksSignOut,
  restoreToken,
  fetchTaskLists,
  fetchAllTasks,
  createTask,
  updateTask,
  completeTask,
  uncompleteTask,
  deleteTask,
  createTaskList,
  deleteTaskList
} = useGoogleTasks();

// State
const taskLists = ref([]);
const allTasks = ref([]);
const isLoading = ref(false);
const error = ref(null);
const showCompleted = ref(false);
const currentFilter = ref('all');

// Modals
const showCreateTask = ref(false);
const showCreateList = ref(false);
const showDeleteConfirm = ref(false);
const deleteTarget = ref(null);

// Forms
const selectedList = ref(null);
const editingTask = ref(null);
const taskForm = ref({
  title: '',
  notes: '',
  due: '',
  listId: '',
  links: [],
  important: false,
  repeat: ''
});
const newListName = ref('');
const newLinkUrl = ref('');
const newLinkDescription = ref('');

// Computed
const incompleteTasks = computed(() => 
  allTasks.value.filter(t => t.status !== 'completed')
);

const completedTasks = computed(() => 
  allTasks.value.filter(t => t.status === 'completed')
);

const displayTasks = computed(() => 
  showCompleted.value ? allTasks.value : incompleteTasks.value
);

const todayTasks = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return displayTasks.value.filter(task => {
    if (!task.due) return false;
    const dueDate = new Date(task.due);
    return dueDate >= today && dueDate < tomorrow;
  });
});

const weekTasks = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  return displayTasks.value.filter(task => {
    if (!task.due) return false;
    const dueDate = new Date(task.due);
    return dueDate >= today && dueDate <= nextWeek;
  });
});

const overdueTasks = computed(() => {
  const now = new Date();
  return incompleteTasks.value.filter(task => {
    if (!task.due) return false;
    return new Date(task.due) < now;
  });
});

const filteredTasks = computed(() => {
  switch (currentFilter.value) {
    case 'today':
      return todayTasks.value;
    case 'week':
      return weekTasks.value;
    case 'overdue':
      return overdueTasks.value;
    default:
      return displayTasks.value;
  }
});

// Methods
const signIn = async () => {
  try {
    await tasksSignIn();
    await loadTasks();
  } catch (err) {
    console.error('Sign in error:', err);
    error.value = 'Fehler beim Anmelden';
  }
};

const handleSignOut = () => {
  tasksSignOut();
  router.push('/dashboard');
};

const loadTasks = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    const [lists, tasks] = await Promise.all([
      fetchTaskLists(),
      fetchAllTasks(showCompleted.value)
    ]);
    
    taskLists.value = lists;
    allTasks.value = tasks;
    
    if (lists.length > 0 && !selectedList.value) {
      selectedList.value = lists[0].id;
    }
  } catch (err) {
    console.error('Load tasks error:', err);
    error.value = 'Fehler beim Laden der Aufgaben';
  } finally {
    isLoading.value = false;
  }
};

const getListTasks = (listId) => {
  return filteredTasks.value.filter(task => task.listId === listId);
};

const toggleTaskComplete = async (task) => {
  try {
    if (task.status === 'completed') {
      await uncompleteTask(task.listId, task.id);
    } else {
      await completeTask(task.listId, task.id);
    }
    await loadTasks();
  } catch (err) {
    console.error('Toggle task error:', err);
    error.value = 'Fehler beim Aktualisieren der Aufgabe';
  }
};

const editTask = (task) => {
  editingTask.value = task;
  
  // Parse notes to extract important flag and repeat info
  let notes = task.notes || '';
  const important = notes.includes('⭐ WICHTIG');
  notes = notes.replace('⭐ WICHTIG\n', '');
  
  let repeat = '';
  if (notes.includes('[REPEAT:')) {
    const repeatMatch = notes.match(/\[REPEAT:(\w+)\]/);
    if (repeatMatch) {
      repeat = repeatMatch[1];
      notes = notes.replace(/\[REPEAT:\w+\]\n/, '');
    }
  }
  
  taskForm.value = {
    title: task.title,
    notes: notes,
    due: task.due ? new Date(task.due).toISOString().slice(0, 16) : '',
    listId: task.listId,
    links: task.links || [],
    important: important,
    repeat: repeat
  };
  showCreateTask.value = true;
};

const viewTaskDetail = (task) => {
  navigateTo(`/aufgaben-detail?id=${task.id}&list=${task.listId}`);
};

const closeTaskModal = () => {
  showCreateTask.value = false;
  editingTask.value = null;
  taskForm.value = {
    title: '',
    notes: '',
    due: '',
    listId: selectedList.value || (taskLists.value[0]?.id || ''),
    links: [],
    important: false,
    repeat: ''
  };
  newLinkUrl.value = '';
  newLinkDescription.value = '';
};

const saveTask = async () => {
  if (!taskForm.value.title) return;

  try {
    // Build notes with special markers
    let notes = taskForm.value.notes || '';
    if (taskForm.value.important) {
      notes = '⭐ WICHTIG\n' + notes;
    }
    if (taskForm.value.repeat) {
      notes = notes + (notes ? '\n' : '') + `[REPEAT:${taskForm.value.repeat}]`;
    }
    
    const taskData = {
      title: taskForm.value.title,
      notes: notes || undefined,
      due: taskForm.value.due ? new Date(taskForm.value.due).toISOString() : undefined,
      links: taskForm.value.links.length > 0 ? taskForm.value.links : undefined
    };

    if (editingTask.value) {
      await updateTask(editingTask.value.listId, editingTask.value.id, taskData);
    } else {
      await createTask(taskForm.value.listId || selectedList.value, taskData);
    }

    await loadTasks();
    closeTaskModal();
  } catch (err) {
    console.error('Save task error:', err);
    error.value = 'Fehler beim Speichern der Aufgabe';
  }
};

const createList = async () => {
  if (!newListName.value) return;

  try {
    await createTaskList(newListName.value);
    await loadTasks();
    newListName.value = '';
    showCreateList.value = false;
  } catch (err) {
    console.error('Create list error:', err);
    error.value = 'Fehler beim Erstellen der Liste';
  }
};

const confirmDeleteTask = (task) => {
  deleteTarget.value = { type: 'task', item: task };
  showDeleteConfirm.value = true;
};

const confirmDeleteList = (list) => {
  deleteTarget.value = { type: 'list', item: list };
  showDeleteConfirm.value = true;
};

const handleDelete = async () => {
  try {
    if (deleteTarget.value.type === 'task') {
      await deleteTask(deleteTarget.value.item.listId, deleteTarget.value.item.id);
    } else {
      await deleteTaskList(deleteTarget.value.item.id);
    }
    await loadTasks();
    showDeleteConfirm.value = false;
    deleteTarget.value = null;
  } catch (err) {
    console.error('Delete error:', err);
    error.value = 'Fehler beim Löschen';
  }
};

const isOverdue = (task) => {
  if (!task.due || task.status === 'completed') return false;
  return new Date(task.due) < new Date();
};

const formatDueDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((date - now) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Heute';
  if (diffDays === 1) return 'Morgen';
  if (diffDays === -1) return 'Gestern';
  if (diffDays < 0) return `Überfällig (${Math.abs(diffDays)} Tage)`;
  if (diffDays < 7) return `In ${diffDays} Tagen`;
  
  return date.toLocaleDateString('de-DE', { 
    day: 'numeric', 
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

// Helper functions
const isTaskImportant = (task) => {
  return task.notes?.includes('⭐ WICHTIG') || false;
};

const getTaskNotesPreview = (notes) => {
  if (!notes) return '';
  let cleanNotes = notes.replace('⭐ WICHTIG\n', '').replace(/\[REPEAT:\w+\]\n?/, '');
  return cleanNotes.length > 60 ? cleanNotes.substring(0, 60) + '...' : cleanNotes;
};

const hasSubtasks = (task) => {
  return allTasks.value.some(t => t.parent === task.id);
};

const getSubtasksCount = (task) => {
  return allTasks.value.filter(t => t.parent === task.id).length;
};

const addLink = () => {
  if (!newLinkUrl.value) return;
  
  taskForm.value.links.push({
    link: newLinkUrl.value,
    description: newLinkDescription.value || newLinkUrl.value,
    type: 'url'
  });
  
  newLinkUrl.value = '';
  newLinkDescription.value = '';
};

const removeLink = (index) => {
  taskForm.value.links.splice(index, 1);
};

// Lifecycle
onMounted(async () => {
  await restoreToken();
  if (isAuthenticated.value) {
    await loadTasks();
  }
});

watch(showCompleted, async () => {
  if (isAuthenticated.value) {
    await loadTasks();
  }
});
</script>

<style scoped>
.aufgaben-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
  color: #fff;
  padding: 2rem;
}

.page-header {
  max-width: 1600px;
  margin: 0 auto 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-button {
  padding: 0.875rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.header-title h1 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 700;
}

.header-icon {
  font-size: 2rem;
  color: #4facfe;
}

.subtitle {
  margin: 0;
  font-size: 1rem;
  opacity: 0.7;
}

.header-right {
  display: flex;
  gap: 0.75rem;
}

.icon-button,
.signout-button {
  padding: 0.875rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.icon-button:hover,
.signout-button:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.auth-card {
  max-width: 600px;
  margin: 4rem auto;
  text-align: center;
  padding: 3rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
}

.auth-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  color: #4facfe;
}

.google-signin-btn {
  margin-top: 2rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);
}

.google-signin-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 172, 254, 0.4);
}

.authenticated-content {
  max-width: 1600px;
  margin: 0 auto;
}

.quick-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.action-card {
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
}

.action-card:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.action-card.active {
  background: rgba(79, 172, 254, 0.2);
  border-color: rgba(79, 172, 254, 0.4);
}

.error-card {
  padding: 1.5rem;
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.error-icon {
  font-size: 2rem;
  color: #ef4444;
}

.loading-card {
  text-align: center;
  padding: 3rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
}

.loading-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  animation: spin 1s linear infinite;
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 0.75rem 1.25rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.tab-btn.active {
  background: rgba(79, 172, 254, 0.2);
  border-color: rgba(79, 172, 254, 0.4);
  color: #4facfe;
}

.no-tasks {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
}

.no-tasks svg {
  font-size: 4rem;
  margin-bottom: 1rem;
  color: #4facfe;
}

.lists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.task-list-card {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.task-list-card:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-4px);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.list-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.list-title h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.task-count {
  padding: 0.25rem 0.75rem;
  background: rgba(79, 172, 254, 0.2);
  border-radius: 12px;
  font-size: 0.875rem;
  color: #4facfe;
  font-weight: 600;
}

.list-actions {
  display: flex;
  gap: 0.5rem;
}

.icon-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.1);
}

.icon-btn.delete-btn {
  color: #ef4444;
}

.icon-btn.delete-btn:hover {
  background: rgba(239, 68, 68, 0.1);
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.task-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.task-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
}

.task-item.completed {
  opacity: 0.6;
}

.task-item.overdue {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.05);
}

.task-checkbox {
  width: 24px;
  height: 24px;
  min-width: 24px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.task-checkbox:hover {
  border-color: #4facfe;
}

.task-checkbox.checked {
  background: #4facfe;
  border-color: #4facfe;
}

.task-content {
  flex: 1;
  cursor: pointer;
}

.task-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.task-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
}

.star-icon {
  color: #fbbf24;
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.task-badges {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.subtasks-badge {
  background: rgba(79, 172, 254, 0.15);
  color: #4facfe;
  border: 1px solid rgba(79, 172, 254, 0.3);
}

.links-badge {
  background: rgba(162, 155, 254, 0.15);
  color: #a29bfe;
  border: 1px solid rgba(162, 155, 254, 0.3);
}

.task-item.completed .task-title {
  text-decoration: line-through;
}

.task-notes {
  margin: 0.5rem 0 0 0;
  font-size: 0.875rem;
  opacity: 0.7;
  line-height: 1.4;
}

.task-meta {
  margin-top: 0.5rem;
  display: flex;
  gap: 0.75rem;
}

.task-due {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  background: rgba(79, 172, 254, 0.1);
  border-radius: 6px;
  font-size: 0.8rem;
  color: #4facfe;
}

.task-due.overdue {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.task-actions {
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.task-item:hover .task-actions {
  opacity: 1;
}

.empty-list {
  text-align: center;
  padding: 2rem;
  opacity: 0.5;
}

.empty-list svg {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.modal-content {
  background: #1a202c;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 0;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content.small {
  max-width: 400px;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.modal-header.danger {
  background: rgba(239, 68, 68, 0.1);
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.modal-body {
  padding: 1.5rem;
}

.modal-text {
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
  padding: 0 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.9rem;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #fff;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.2s ease;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #4facfe;
  background: rgba(255, 255, 255, 0.08);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 2px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn {
  padding: 0.875rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  font-size: 1rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
  box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 172, 254, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  color: #fff;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #fff;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
}

.btn-danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
}

.btn-danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.section-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #4facfe;
  font-size: 0.95rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.checkbox-label:hover {
  background: rgba(255, 255, 255, 0.05);
}

.checkbox-label input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.links-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.link-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.link-item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.link-item-url {
  color: #4facfe;
  font-size: 0.875rem;
  text-decoration: none;
  word-break: break-all;
}

.link-item-url:hover {
  text-decoration: underline;
}

.link-item-desc {
  font-size: 0.8rem;
  opacity: 0.7;
}

.icon-btn-small {
  width: 28px;
  height: 28px;
  min-width: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-btn-small:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
}

.add-link-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  margin-top: 0.75rem;
}

.add-link-form input {
  padding: 0.625rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #fff;
  font-size: 0.875rem;
}

.add-link-form input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.add-link-form input:focus {
  outline: none;
  border-color: #4facfe;
  background: rgba(255, 255, 255, 0.08);
}

.btn-add-link {
  padding: 0.625rem 1rem;
  background: rgba(79, 172, 254, 0.15);
  border: 1px solid rgba(79, 172, 254, 0.3);
  border-radius: 6px;
  color: #4facfe;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
}

.btn-add-link:hover {
  background: rgba(79, 172, 254, 0.25);
  border-color: rgba(79, 172, 254, 0.5);
}

@media (max-width: 768px) {
  .aufgaben-page {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .lists-grid {
    grid-template-columns: 1fr;
  }

  .modal-content {
    max-width: 100%;
    margin: 1rem;
  }
}
</style>
