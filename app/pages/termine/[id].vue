<template>
  <div class="event-detail-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <button class="back-button" @click="navigateTo('/termine')">
          <UIcon name="i-lucide-arrow-left" />
          <span>Zurück zu Terminen</span>
        </button>
      </div>
      <div class="header-right">
        <button v-if="event" class="icon-button edit-btn" @click="editEvent" title="Bearbeiten">
          <UIcon name="i-lucide-pencil" />
        </button>
        <button v-if="event" class="icon-button delete-btn" @click="showDeleteConfirm = true" title="Löschen">
          <UIcon name="i-lucide-trash-2" />
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-card">
      <UIcon name="i-lucide-loader-2" class="loading-icon" />
      <p>Termin wird geladen...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-card">
      <UIcon name="i-lucide-alert-circle" class="error-icon" />
      <div>
        <h3>Fehler</h3>
        <p>{{ error }}</p>
      </div>
      <button class="btn btn-primary" @click="navigateTo('/termine')">
        Zurück zu Terminen
      </button>
    </div>

    <!-- Event Details -->
    <div v-else-if="event" class="event-details">
      <!-- Main Card -->
      <div class="detail-card main-card" :style="{ borderLeftColor: getEventColor() }">
        <div class="event-header">
          <div class="event-category-badge" :class="`category-${getEventCategory()}`">
            <UIcon :name="getEventIcon()" />
            <span>{{ getCategoryLabel() }}</span>
          </div>
          <h1 class="event-title">
            {{ event.summary || 'Ohne Titel' }}
          </h1>
          <p v-if="event.description" class="event-description">
            {{ event.description }}
          </p>
        </div>

        <!-- Key Information Grid -->
        <div class="info-grid">
          <!-- Date & Time -->
          <div class="info-item">
            <div class="info-icon">
              <UIcon name="i-lucide-calendar-clock" />
            </div>
            <div class="info-content">
              <label>Datum & Zeit</label>
              <div v-if="event.start.dateTime">
                <p class="primary-text">{{ formatDateTime(event.start.dateTime) }}</p>
                <p v-if="event.end.dateTime" class="secondary-text">
                  bis {{ formatTime(event.end.dateTime) }}
                  <span class="duration-badge">{{ calculateDuration() }}</span>
                </p>
              </div>
              <div v-else>
                <p class="primary-text">{{ formatDate(event.start.date) }}</p>
                <p class="secondary-text">Ganztägig</p>
              </div>
            </div>
          </div>

          <!-- Location -->
          <div v-if="event.location" class="info-item">
            <div class="info-icon">
              <UIcon name="i-lucide-map-pin" />
            </div>
            <div class="info-content">
              <label>Ort</label>
              <p class="primary-text">{{ event.location }}</p>
              <a 
                v-if="hasValidLocation" 
                :href="getGoogleMapsLink()" 
                target="_blank" 
                class="info-link"
              >
                <UIcon name="i-lucide-external-link" />
                In Google Maps öffnen
              </a>
            </div>
          </div>

          <!-- Status -->
          <div class="info-item">
            <div class="info-icon">
              <UIcon :name="getStatusIcon()" />
            </div>
            <div class="info-content">
              <label>Status</label>
              <p class="primary-text">{{ getStatusLabel() }}</p>
              <p v-if="isUpcoming" class="time-until">
                <UIcon name="i-lucide-clock" />
                {{ getTimeUntil() }}
              </p>
            </div>
          </div>

          <!-- Creator -->
          <div v-if="event.creator" class="info-item">
            <div class="info-icon">
              <UIcon name="i-lucide-user-circle" />
            </div>
            <div class="info-content">
              <label>Organisator</label>
              <p class="primary-text">{{ event.creator.displayName || event.creator.email }}</p>
              <a v-if="event.creator.email" :href="`mailto:${event.creator.email}`" class="info-link">
                <UIcon name="i-lucide-mail" />
                {{ event.creator.email }}
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Attendees Card -->
      <div v-if="event.attendees && event.attendees.length > 0" class="detail-card">
        <h2 class="card-title">
          <UIcon name="i-lucide-users" />
          Teilnehmer ({{ event.attendees.length }})
        </h2>
        <div class="attendees-list">
          <div 
            v-for="attendee in event.attendees" 
            :key="attendee.email" 
            class="attendee-item"
          >
            <div class="attendee-avatar">
              {{ getInitials(attendee.displayName || attendee.email) }}
            </div>
            <div class="attendee-info">
              <p class="attendee-name">{{ attendee.displayName || attendee.email }}</p>
              <p class="attendee-email">{{ attendee.email }}</p>
            </div>
            <div class="attendee-status" :class="getAttendeeStatusClass(attendee)">
              <UIcon :name="getAttendeeStatusIcon(attendee)" />
              <span>{{ getAttendeeStatusLabel(attendee) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Meeting Links -->
      <div v-if="hasConferenceData || hasMeetingLinks" class="detail-card">
        <h2 class="card-title">
          <UIcon name="i-lucide-video" />
          Meeting-Links
        </h2>
        <div class="meeting-links">
          <!-- Conference Data (Google Meet) -->
          <div v-if="event.conferenceData" class="meeting-link-item">
            <div class="meeting-icon">
              <UIcon name="i-lucide-video" />
            </div>
            <div class="meeting-info">
              <p class="meeting-platform">Google Meet</p>
              <a 
                :href="event.conferenceData.entryPoints[0].uri" 
                target="_blank" 
                class="meeting-link"
              >
                <UIcon name="i-lucide-external-link" />
                Meeting beitreten
              </a>
            </div>
          </div>
          
          <!-- Links from description -->
          <div 
            v-for="(link, index) in getMeetingLinksFromDescription()" 
            :key="index" 
            class="meeting-link-item"
          >
            <div class="meeting-icon">
              <UIcon :name="link.icon" />
            </div>
            <div class="meeting-info">
              <p class="meeting-platform">{{ link.platform }}</p>
              <a :href="link.url" target="_blank" class="meeting-link">
                <UIcon name="i-lucide-external-link" />
                Meeting beitreten
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Reminders -->
      <div v-if="event.reminders && (event.reminders.overrides || event.reminders.useDefault)" class="detail-card">
        <h2 class="card-title">
          <UIcon name="i-lucide-bell" />
          Erinnerungen
        </h2>
        <div class="reminders-list">
          <div 
            v-for="(reminder, index) in getReminders()" 
            :key="index" 
            class="reminder-item"
          >
            <UIcon name="i-lucide-bell-ring" />
            <span>{{ reminder }}</span>
          </div>
        </div>
      </div>

      <!-- Additional Details -->
      <div class="detail-card">
        <h2 class="card-title">
          <UIcon name="i-lucide-info" />
          Weitere Details
        </h2>
        <div class="details-list">
          <div class="detail-row">
            <label>Erstellt</label>
            <span>{{ formatDateTime(event.created) }}</span>
          </div>
          <div class="detail-row">
            <label>Zuletzt aktualisiert</label>
            <span>{{ formatDateTime(event.updated) }}</span>
          </div>
          <div class="detail-row">
            <label>Sichtbarkeit</label>
            <span>{{ getVisibilityLabel() }}</span>
          </div>
          <div v-if="event.recurrence" class="detail-row">
            <label>Wiederholung</label>
            <span>
              <UIcon name="i-lucide-repeat" />
              {{ getRecurrenceLabel() }}
            </span>
          </div>
          <div class="detail-row">
            <label>Event ID</label>
            <span class="monospace">{{ event.id }}</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="detail-actions">
        <button class="action-btn primary" @click="editEvent">
          <UIcon name="i-lucide-pencil" />
          Bearbeiten
        </button>
        <a 
          v-if="event.htmlLink" 
          :href="event.htmlLink" 
          target="_blank" 
          class="action-btn secondary"
        >
          <UIcon name="i-lucide-external-link" />
          In Google Calendar öffnen
        </a>
        <button class="action-btn danger" @click="showDeleteConfirm = true">
          <UIcon name="i-lucide-trash-2" />
          Löschen
        </button>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click="showDeleteConfirm = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <UIcon name="i-lucide-alert-triangle" class="modal-icon warning" />
          <h3>Termin löschen?</h3>
        </div>
        <p>Möchtest du diesen Termin wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showDeleteConfirm = false">
            Abbrechen
          </button>
          <button class="btn btn-danger" @click="handleDelete">
            <UIcon name="i-lucide-trash-2" />
            Termin löschen
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute();
const router = useRouter();
const eventId = route.params.id;

// Google Auth
const { isAuthenticated, restoreToken, fetchCalendarEvents, deleteEvent: deleteEventApi } = useGoogleAuth();

// State
const event = ref(null);
const isLoading = ref(true);
const error = ref('');
const showDeleteConfirm = ref(false);

// Fetch event details
const fetchEventDetails = async () => {
  if (!isAuthenticated.value) {
    error.value = 'Nicht authentifiziert. Bitte melde dich an.';
    isLoading.value = false;
    return;
  }

  try {
    isLoading.value = true;
    error.value = '';
    
    // Fetch events from the last month to ensure we get the event
    const now = new Date();
    const pastDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const futureDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    
    const events = await fetchCalendarEvents(pastDate.toISOString(), futureDate.toISOString());
    const foundEvent = events.find(e => e.id === eventId);
    
    if (!foundEvent) {
      error.value = 'Termin nicht gefunden.';
    } else {
      event.value = foundEvent;
    }
  } catch (err) {
    console.error('Fehler beim Laden des Termins:', err);
    error.value = 'Fehler beim Laden des Termins.';
  } finally {
    isLoading.value = false;
  }
};

// Event category and styling
const getEventCategory = () => {
  if (!event.value) return 'personal';
  const summary = (event.value.summary || '').toLowerCase();
  const description = (event.value.description || '').toLowerCase();
  
  if (summary.includes('meeting') || summary.includes('call') || description.includes('zoom') || description.includes('teams')) {
    return 'meeting';
  }
  if (summary.includes('geburtstag') || summary.includes('birthday')) {
    return 'birthday';
  }
  if (summary.includes('work') || summary.includes('arbeit') || summary.includes('projekt')) {
    return 'work';
  }
  
  return 'personal';
};

const getEventIcon = () => {
  const category = getEventCategory();
  const iconMap = {
    'work': 'i-lucide-briefcase',
    'personal': 'i-lucide-user',
    'meeting': 'i-lucide-users',
    'birthday': 'i-lucide-cake',
  };
  return iconMap[category] || 'i-lucide-calendar';
};

const getEventColor = () => {
  const category = getEventCategory();
  const colorMap = {
    'work': '#4facfe',
    'personal': '#43e97b',
    'meeting': '#fa709a',
    'birthday': '#fee140',
  };
  return colorMap[category] || '#4facfe';
};

const getCategoryLabel = () => {
  const category = getEventCategory();
  const labelMap = {
    'work': 'Arbeit',
    'personal': 'Persönlich',
    'meeting': 'Meeting',
    'birthday': 'Geburtstag',
  };
  return labelMap[category] || 'Persönlich';
};

// Date formatting
const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return '';
  const date = new Date(dateTimeString);
  return date.toLocaleString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatTime = (dateTimeString) => {
  if (!dateTimeString) return '';
  const date = new Date(dateTimeString);
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
};

const calculateDuration = () => {
  if (!event.value?.start.dateTime || !event.value?.end.dateTime) return '';
  const start = new Date(event.value.start.dateTime);
  const end = new Date(event.value.end.dateTime);
  const durationMs = end - start;
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}min`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}min`;
  }
};

// Status
const getStatusIcon = () => {
  if (!event.value) return 'i-lucide-info';
  
  const now = new Date();
  const start = new Date(event.value.start.dateTime || event.value.start.date);
  const end = new Date(event.value.end.dateTime || event.value.end.date);
  
  if (end < now) return 'i-lucide-check-circle';
  if (start <= now && end >= now) return 'i-lucide-play-circle';
  return 'i-lucide-clock';
};

const getStatusLabel = () => {
  if (!event.value) return '';
  
  const now = new Date();
  const start = new Date(event.value.start.dateTime || event.value.start.date);
  const end = new Date(event.value.end.dateTime || event.value.end.date);
  
  if (end < now) return 'Vergangen';
  if (start <= now && end >= now) return 'Läuft gerade';
  return 'Bevorstehend';
};

const isUpcoming = computed(() => {
  if (!event.value) return false;
  const now = new Date();
  const start = new Date(event.value.start.dateTime || event.value.start.date);
  return start > now;
});

const getTimeUntil = () => {
  if (!event.value) return '';
  const now = new Date();
  const start = new Date(event.value.start.dateTime || event.value.start.date);
  const diffMs = start - now;
  
  if (diffMs < 0) return '';
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `In ${days} Tag${days > 1 ? 'en' : ''} und ${hours}h`;
  } else if (hours > 0) {
    return `In ${hours}h ${minutes}min`;
  } else {
    return `In ${minutes}min`;
  }
};

// Location
const hasValidLocation = computed(() => {
  return event.value?.location && event.value.location.trim().length > 0;
});

const getGoogleMapsLink = () => {
  if (!hasValidLocation.value) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.value.location)}`;
};

// Attendees
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getAttendeeStatusClass = (attendee) => {
  const status = attendee.responseStatus || 'needsAction';
  return `status-${status}`;
};

const getAttendeeStatusIcon = (attendee) => {
  const status = attendee.responseStatus || 'needsAction';
  const iconMap = {
    'accepted': 'i-lucide-check-circle',
    'declined': 'i-lucide-x-circle',
    'tentative': 'i-lucide-help-circle',
    'needsAction': 'i-lucide-clock'
  };
  return iconMap[status] || 'i-lucide-help-circle';
};

const getAttendeeStatusLabel = (attendee) => {
  const status = attendee.responseStatus || 'needsAction';
  const labelMap = {
    'accepted': 'Zugesagt',
    'declined': 'Abgesagt',
    'tentative': 'Vielleicht',
    'needsAction': 'Ausstehend'
  };
  return labelMap[status] || 'Unbekannt';
};

// Meeting links
const hasConferenceData = computed(() => {
  return event.value?.conferenceData?.entryPoints?.length > 0;
});

const hasMeetingLinks = computed(() => {
  return getMeetingLinksFromDescription().length > 0;
});

const getMeetingLinksFromDescription = () => {
  if (!event.value?.description) return [];
  
  const links = [];
  const description = event.value.description;
  
  // Zoom
  const zoomMatch = description.match(/(https?:\/\/[^\s]*zoom\.us[^\s]*)/gi);
  if (zoomMatch) {
    zoomMatch.forEach(url => {
      links.push({ platform: 'Zoom', url, icon: 'i-lucide-video' });
    });
  }
  
  // Teams
  const teamsMatch = description.match(/(https?:\/\/[^\s]*teams\.microsoft\.com[^\s]*)/gi);
  if (teamsMatch) {
    teamsMatch.forEach(url => {
      links.push({ platform: 'Microsoft Teams', url, icon: 'i-lucide-users' });
    });
  }
  
  // Webex
  const webexMatch = description.match(/(https?:\/\/[^\s]*webex\.com[^\s]*)/gi);
  if (webexMatch) {
    webexMatch.forEach(url => {
      links.push({ platform: 'Webex', url, icon: 'i-lucide-video' });
    });
  }
  
  return links;
};

// Reminders
const getReminders = () => {
  if (!event.value?.reminders) return [];
  
  if (event.value.reminders.useDefault) {
    return ['Standard-Erinnerungen'];
  }
  
  if (event.value.reminders.overrides) {
    return event.value.reminders.overrides.map(reminder => {
      const minutes = reminder.minutes;
      if (minutes < 60) {
        return `${minutes} Minute${minutes > 1 ? 'n' : ''} vorher`;
      } else if (minutes < 1440) {
        const hours = Math.floor(minutes / 60);
        return `${hours} Stunde${hours > 1 ? 'n' : ''} vorher`;
      } else {
        const days = Math.floor(minutes / 1440);
        return `${days} Tag${days > 1 ? 'e' : ''} vorher`;
      }
    });
  }
  
  return [];
};

// Visibility
const getVisibilityLabel = () => {
  const visibility = event.value?.visibility || 'default';
  const labelMap = {
    'default': 'Standard',
    'public': 'Öffentlich',
    'private': 'Privat',
    'confidential': 'Vertraulich'
  };
  return labelMap[visibility] || 'Standard';
};

// Recurrence
const getRecurrenceLabel = () => {
  if (!event.value?.recurrence) return '';
  const rule = event.value.recurrence[0];
  
  if (rule.includes('DAILY')) return 'Täglich';
  if (rule.includes('WEEKLY')) return 'Wöchentlich';
  if (rule.includes('MONTHLY')) return 'Monatlich';
  if (rule.includes('YEARLY')) return 'Jährlich';
  
  return 'Benutzerdefiniert';
};

// Actions
const editEvent = () => {
  navigateTo(`/termine?edit=${eventId}`);
};

const handleDelete = async () => {
  try {
    await deleteEventApi(eventId);
    showDeleteConfirm.value = false;
    navigateTo('/termine');
  } catch (err) {
    console.error('Fehler beim Löschen:', err);
    error.value = 'Fehler beim Löschen des Termins';
  }
};

// Lifecycle
onMounted(async () => {
  await restoreToken();
  
  if (!isAuthenticated.value) {
    error.value = 'Nicht authentifiziert. Bitte melde dich an.';
    isLoading.value = false;
    return;
  }
  
  await fetchEventDetails();
});
</script>

<style scoped>
.event-detail-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 50%, #16213e 100%);
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(79, 172, 254, 0.1);
}

.header-left,
.header-right {
  display: flex;
  gap: 1rem;
  align-items: center;
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
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-button:hover {
  background: rgba(79, 172, 254, 0.2);
  border-color: rgba(79, 172, 254, 0.4);
  transform: translateX(-3px);
}

.icon-button {
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.icon-button:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.loading-card,
.error-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  background: rgba(26, 26, 46, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(79, 172, 254, 0.1);
  text-align: center;
  max-width: 600px;
  margin: 2rem auto;
}

.loading-icon {
  width: 3rem;
  height: 3rem;
  color: #4facfe;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

.error-icon {
  width: 3rem;
  height: 3rem;
  color: #ef4444;
}

.error-card h3 {
  color: white;
  font-size: 1.5rem;
  margin: 0;
}

.error-card p,
.loading-card p {
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.event-details {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-card {
  background: rgba(26, 26, 46, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid rgba(79, 172, 254, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.main-card {
  border-left: 4px solid #4facfe;
}

.event-header {
  margin-bottom: 2rem;
}

.event-category-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 1rem;
}

.category-work {
  background: rgba(79, 172, 254, 0.15);
  color: #4facfe;
  border: 1px solid rgba(79, 172, 254, 0.3);
}

.category-personal {
  background: rgba(67, 233, 123, 0.15);
  color: #43e97b;
  border: 1px solid rgba(67, 233, 123, 0.3);
}

.category-meeting {
  background: rgba(250, 112, 154, 0.15);
  color: #fa709a;
  border: 1px solid rgba(250, 112, 154, 0.3);
}

.category-birthday {
  background: rgba(254, 225, 64, 0.15);
  color: #fee140;
  border: 1px solid rgba(254, 225, 64, 0.3);
}

.event-title {
  color: white;
  font-size: 2rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
}

.event-description {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.1rem;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.info-item {
  display: flex;
  gap: 1rem;
}

.info-icon {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(79, 172, 254, 0.1);
  border-radius: 12px;
  color: #4facfe;
  flex-shrink: 0;
}

.info-icon svg {
  width: 1.5rem;
  height: 1.5rem;
}

.info-content {
  flex: 1;
}

.info-content label {
  display: block;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.primary-text {
  color: white;
  font-size: 1rem;
  font-weight: 500;
  margin: 0 0 0.25rem 0;
}

.secondary-text {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.duration-badge {
  padding: 0.25rem 0.5rem;
  background: rgba(79, 172, 254, 0.15);
  border-radius: 6px;
  color: #4facfe;
  font-size: 0.8rem;
  font-weight: 500;
}

.time-until {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  color: #43e97b;
  font-size: 0.9rem;
  font-weight: 500;
}

.info-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  color: #4facfe;
  font-size: 0.9rem;
  text-decoration: none;
  transition: all 0.2s ease;
}

.info-link:hover {
  color: #00f2fe;
  gap: 0.75rem;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
}

.card-title svg {
  width: 1.5rem;
  height: 1.5rem;
  color: #4facfe;
}

.attendees-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.attendee-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(79, 172, 254, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(79, 172, 254, 0.1);
}

.attendee-avatar {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 50%;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  flex-shrink: 0;
}

.attendee-info {
  flex: 1;
}

.attendee-name {
  color: white;
  font-weight: 500;
  margin: 0 0 0.25rem 0;
}

.attendee-email {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  margin: 0;
}

.attendee-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  flex-shrink: 0;
}

.status-accepted {
  background: rgba(67, 233, 123, 0.15);
  color: #43e97b;
  border: 1px solid rgba(67, 233, 123, 0.3);
}

.status-declined {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.status-tentative {
  background: rgba(254, 225, 64, 0.15);
  color: #fee140;
  border: 1px solid rgba(254, 225, 64, 0.3);
}

.status-needsAction {
  background: rgba(162, 155, 254, 0.15);
  color: #a29bfe;
  border: 1px solid rgba(162, 155, 254, 0.3);
}

.meeting-links,
.reminders-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.meeting-link-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(79, 172, 254, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(79, 172, 254, 0.1);
}

.meeting-icon {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(79, 172, 254, 0.15);
  border-radius: 12px;
  color: #4facfe;
  flex-shrink: 0;
}

.meeting-icon svg {
  width: 1.5rem;
  height: 1.5rem;
}

.meeting-info {
  flex: 1;
}

.meeting-platform {
  color: white;
  font-weight: 500;
  margin: 0 0 0.5rem 0;
}

.meeting-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #4facfe;
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.meeting-link:hover {
  color: #00f2fe;
  gap: 0.75rem;
}

.reminder-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(79, 172, 254, 0.05);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
}

.reminder-item svg {
  color: #4facfe;
  width: 1.25rem;
  height: 1.25rem;
}

.details-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
}

.detail-row span {
  color: white;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.monospace {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem !important;
  color: rgba(255, 255, 255, 0.7) !important;
}

.detail-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  border: none;
}

.action-btn.primary {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(79, 172, 254, 0.4);
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
}

.action-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.action-btn.danger {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.action-btn.danger:hover {
  background: rgba(239, 68, 68, 0.25);
  transform: translateY(-2px);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: #1a1a2e;
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  border: 1px solid rgba(79, 172, 254, 0.2);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.modal-icon {
  width: 3rem;
  height: 3rem;
}

.modal-icon.warning {
  color: #fbbf24;
}

.modal-header h3 {
  color: white;
  font-size: 1.5rem;
  margin: 0;
}

.modal-content > p {
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  margin: 0 0 2rem 0;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-danger {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.btn-danger:hover {
  background: rgba(239, 68, 68, 0.25);
}

.btn-primary {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(79, 172, 254, 0.4);
}

@media (max-width: 768px) {
  .event-detail-page {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .header-right {
    justify-content: flex-end;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .event-title {
    font-size: 1.5rem;
  }

  .detail-actions {
    flex-direction: column;
  }

  .action-btn {
    justify-content: center;
  }
}
</style>
