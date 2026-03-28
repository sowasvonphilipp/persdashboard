<template>
  <div class="task-detail-page">
    <div class="page-header">
      <button class="back-button" @click="navigateTo('/aufgaben')">
        <UIcon name="i-heroicons-arrow-left" />
        <span>Zurück</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-card">
      <UIcon name="i-heroicons-loader-2" class="loading-icon" />
      <p>Wird geladen...</p>
    </div>

    <!-- Task Details  -->
    <div v-else-if="task" class="task-detail-content">
      <div class="detail-header">
        <div class="header-actions">
          <button 
            class="icon-btn star-btn" 
            :class="{ active: isImportant }"
            @click="toggleImportant"
            title="Als wichtig markieren"
          >
            <UIcon :name="isImportant ? 'i-heroicons-star' : 'i-heroicons-star'" />
          </button>
          <button class="icon-btn" @click="showEditor = true">
            <UIcon name="i-heroicons-pencil" />
          </button>
          <button class="icon-btn delete-btn" @click="confirmDelete">
            <UIcon name="i-heroicons-trash" />
          </button>
        </div>
        <h1>{{ task.title }}</h1>
        <p v-if="task.notes" class="task-description">{{ task.notes }}</p>
      </div>

      <!-- Main Info -->
      <div class="detail-sections">
        <div class="detail-section" v-if="task.due">
          <UIcon name="i-heroicons-calendar" />
          <span>Fällig am {{ formatDate(task.due) }}</span>
        </div>

        <div class="detail-section" v-if="task.links && task.links.length > 0">
          <UIcon name="i-heroicons-link" />
          <div class="links-list">
            <a 
              v-for="link in task.links" 
              :key="link.link" 
              :href="link.link" 
              target="_blank"
              class="task-link"
            >
              {{ link.description || link.link }}
              <UIcon name="i-heroicons-external-link" />
            </a>
          </div>
        </div>
      </div>

      <!-- Subtasks -->
      <div class="subtasks-section">
        <div class="section-header">
          <h3>
            <UIcon name="i-heroicons-list-tree" />
            Teilaufgaben
          </h3>
          <button class="btn-add-subtask" @click="showSubtaskInput = true">
            <UIcon name="i-heroicons-plus" />
            Hinzufügen
          </button>
        </div>

        <div v-if="showSubtaskInput" class="subtask-input">
          <input 
            v-model="newSubtaskTitle"
            placeholder="Teilaufgabe eingeben..."
            @keyup.enter="addSubtask"
            @keyup.esc="showSubtaskInput = false"
          />
          <button @click="addSubtask">
            <UIcon name="i-heroicons-check" />
          </button>
          <button @click="showSubtaskInput = false">
            <UIcon name="i-heroicons-x-mark" />
          </button>
        </div>

        <div class="subtasks-list">
          <div 
            v-for="subtask in subtasks" 
            :key="subtask.id"
            class="subtask-item"
            :class="{ completed: subtask.status === 'completed' }"
          >
            <button 
              class="subtask-checkbox"
              :class="{ checked: subtask.status === 'completed' }"
              @click="toggleSubtask(subtask)"
            >
              <UIcon v-if="subtask.status === 'completed'" name="i-heroicons-check" />
            </button>
            <span>{{ subtask.title }}</span>
            <button class="icon-btn-small delete-btn" @click="deleteSubtask(subtask)">
              <UIcon name="i-heroicons-trash" />
            </button>
          </div>
          <div v-if="subtasks.length === 0" class="no-subtasks">
            <UIcon name="i-heroicons-inbox" />
            <p>Keine Teilaufgaben</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute();
const router = useRouter();
const taskId = route.query.id;
const listId = route.query.list;

const {
  fetchTasks,
  updateTask,
  createTask,
  completeTask,
  uncompleteTask,
  deleteTask
} = useGoogleTasks();

const task = ref(null);
const subtasks = ref([]);
const isLoading = ref(true);
const showSubtaskInput = ref(false);
const newSubtaskTitle = ref('');
const showEditor = ref(false);

const isImportant = computed(() => {
  return task.value?.notes?.includes('⭐ WICHTIG') || false;
});

const loadTask = async () => {
  try {
    isLoading.value = true;
    const tasks = await fetchTasks(listId, true);
    task.value = tasks.find(t => t.id === taskId);
    
    // Load subtasks
    subtasks.value = tasks.filter(t => t.parent === taskId);
  } catch (err) {
    console.error('Error loading task:', err);
  } finally {
    isLoading.value = false;
  }
};

const toggleImportant = async () => {
  const notes = task.value.notes || '';
  let newNotes;
  
  if (isImportant.value) {
    newNotes = notes.replace('⭐ WICHTIG\n', '');
  } else {
    newNotes = '⭐ WICHTIG\n' + notes;
  }
  
  await updateTask(listId, taskId, { notes: newNotes });
  await loadTask();
};

const addSubtask = async () => {
  if (!newSubtaskTitle.value.trim()) return;
  
  try {
    await createTask(listId, {
      title: newSubtaskTitle.value,
      parent: taskId
    });
    newSubtaskTitle.value = '';
    showSubtaskInput.value = false;
    await loadTask();
  } catch (err) {
    console.error('Error adding subtask:', err);
  }
};

const toggleSubtask = async (subtask) => {
  try {
    if (subtask.status === 'completed') {
      await uncompleteTask(listId, subtask.id);
    } else {
      await completeTask(listId, subtask.id);
    }
    await loadTask();
  } catch (err) {
    console.error('Error toggling subtask:', err);
  }
};

const deleteSubtask = async (subtask) => {
  try {
    await deleteTask(listId, subtask.id);
    await loadTask();
  } catch (err) {
    console.error('Error deleting subtask:', err);
  }
};

const confirmDelete = () => {
  if (confirm('Möchtest du diese Aufgabe wirklich löschen?')) {
    deleteTask(listId, taskId);
    navigateTo('/aufgaben');
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

onMounted(() => {
  if (!taskId || !listId) {
    navigateTo('/aufgaben');
    return;
  }
  loadTask();
});
</script>

<style scoped>
.task-detail-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 50%, #16213e 100%);
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: rgba(79, 172, 254, 0.1);
  border: 1px solid rgba(79, 172, 254, 0.2);
  border-radius: 12px;
  color: #4facfe;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-button:hover {
  background: rgba(79, 172, 254, 0.2);
  transform: translateX(-3px);
}

.task-detail-content {
  max-width: 900px;
  margin: 0 auto;
  background: rgba(26, 26, 46, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid rgba(79, 172, 254, 0.1);
}

.detail-header {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  justify-content: flex-end;
}

.star-btn {
  color: rgba(255, 255, 255, 0.4) !important;
}

.star-btn.active {
  color: #fbbf24 !important;
}

.detail-header h1 {
  color: white;
  font-size: 2rem;
  margin: 0 0 1rem 0;
}

.task-description {
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  white-space: pre-wrap;
}

.detail-sections {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.detail-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(79, 172, 254, 0.05);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.subtasks-section {
  margin-top: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  margin: 0;
}

.btn-add-subtask {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(79, 172, 254, 0.15);
  border: 1px solid rgba(79, 172, 254, 0.3);
  border-radius: 8px;
  color: #4facfe;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-add-subtask:hover {
  background: rgba(79, 172, 254, 0.25);
}

.subtask-input {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.subtask-input input {
  flex: 1;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
}

.subtasks-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.subtask-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.subtask-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.subtask-item.completed span {
  text-decoration: line-through;
  opacity: 0.5;
}

.subtask-checkbox {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.subtask-checkbox.checked {
  background: #43e97b;
  border-color: #43e97b;
}

.no-subtasks {
  text-align: center;
  padding: 2rem;
  color: rgba(255, 255, 255, 0.5);
}

.icon-btn, .icon-btn-small {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-btn-small {
  width: 28px;
  height: 28px;
  margin-left: auto;
}

.icon-btn:hover, .icon-btn-small:hover {
  background: rgba(255, 255, 255, 0.1);
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.loading-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.7);
}

.loading-icon {
  width: 3rem;
  height: 3rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}
</style>
