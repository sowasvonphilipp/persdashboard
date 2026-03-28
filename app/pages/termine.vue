<template>
  <div class="termine-page">
    <div class="page-header">
      <div class="header-left">
        <button class="back-button" @click="navigateTo('/dashboard')">
          <UIcon name="i-heroicons-arrow-left" />
          <span>Zurück</span>
        </button>
        <div class="header-title">
          <h1>
            <UIcon name="i-heroicons-sparkles" class="header-icon sparkle" />
            Kalender Manager Pro
          </h1>
          <p class="subtitle" v-if="isAuthenticated">{{ allEvents.length }} Termine • 7 Tage</p>
        </div>
      </div>
      <div class="header-right">
        <button v-if="isAuthenticated" class="icon-button refresh-btn" @click="fetchEvents" :disabled="isLoading" title="Aktualisieren">
          <UIcon name="i-heroicons-refresh-cw" :class="{ spinning: isLoading }" />
        </button>
        <button v-if="isAuthenticated" class="signout-button" @click="handleSignOut">
          <UIcon name="i-heroicons-log-out" />
          <span>Abmelden</span>
        </button>
      </div>
    </div>

    <!-- Not Authenticated -->
    <div v-if="!isAuthenticated" class="auth-card">
      <UIcon name="i-heroicons-lock" class="auth-icon" />
      <h2>Google Calendar Zugriff erforderlich</h2>
      <p>Melde dich mit deinem Google-Konto an, um deinen Kalender zu verwalten.</p>
      <div v-if="authError" class="auth-error">
        <UIcon name="i-heroicons-alert-circle" />
        <p>{{ authError }}</p>
      </div>
      <button class="google-signin-btn" @click="signIn">
        <UIcon name="i-heroicons-log-in" />
        <span>Mit Google anmelden</span>
      </button>
      
      <!-- Troubleshooting Section -->
      <div v-if="authError" class="troubleshooting">
        <button class="troubleshooting-toggle" @click="showTroubleshooting = !showTroubleshooting">
          <UIcon name="i-heroicons-help-circle" />
          {{ showTroubleshooting ? 'Hilfe ausblenden' : 'Fehlerbehebung anzeigen' }}
        </button>
        
        <div v-if="showTroubleshooting" class="troubleshooting-content">
          <h3>Häufige Probleme und Lösungen:</h3>
          
          <div class="troubleshooting-item">
            <h4>1. "There was an error. Please try again later."</h4>
            <p>Dies bedeutet meist, dass die OAuth-Konfiguration unvollständig ist:</p>
            <ul>
              <li>Gehe zu <a href="https://console.cloud.google.com/apis/credentials" target="_blank">Google Cloud Console → Credentials</a></li>
              <li>Klicke auf deine OAuth Client ID</li>
              <li>Unter "Authorized JavaScript origins" füge hinzu:<br><code>{{ currentOrigin }}</code></li>
              <li>Klicke "Save" und warte 1-2 Minuten</li>
              <li>Leere den Browser-Cache (Strg+Shift+R)</li>
            </ul>
          </div>
          
          <div class="troubleshooting-item">
            <h4>2. Client ID prüfen</h4>
            <p>Aktuelle Client ID (aus .env):</p>
            <code class="client-id-display">{{ clientIdPreview }}</code>
            <p>Sollte enden mit: <code>.apps.googleusercontent.com</code></p>
          </div>
          
          <div class="troubleshooting-item">
            <h4>3. Google Calendar API aktiviert?</h4>
            <ul>
              <li>Gehe zu <a href="https://console.cloud.google.com/apis/library/calendar-json.googleapis.com" target="_blank">Google Calendar API</a></li>
              <li>Klicke "Enable" falls noch nicht aktiviert</li>
            </ul>
          </div>
          
          <div class="troubleshooting-item">
            <h4>4. Browser-Konsole überprüfen</h4>
            <p>Öffne die Entwicklertools (F12) und schaue in die Console-Tab für detaillierte Fehler.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Authenticated Content -->
    <div v-else class="authenticated-content">
      <!-- Search and Filters -->
      <div class="controls-bar">
        <div class="search-box">
          <UIcon name="i-heroicons-magnifying-glass" class="search-icon" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Termine durchsuchen..." 
            class="search-input"
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search">
            <UIcon name="i-heroicons-x-mark" />
          </button>
        </div>
        
        <div class="filter-buttons">
          <button 
            class="filter-btn" 
            :class="{ active: filterCategory === 'all' }"
            @click="filterCategory = 'all'"
            title="Alle"
          >
            <UIcon name="i-heroicons-grid-3x3" />
            <span class="badge">{{ allEvents.length }}</span>
          </button>
          <button 
            class="filter-btn" 
            :class="{ active: filterCategory === 'work' }"
            @click="filterCategory = 'work'"
            title="Arbeit"
          >
            <UIcon name="i-heroicons-briefcase" />
          </button>
          <button 
            class="filter-btn" 
            :class="{ active: filterCategory === 'personal' }"
            @click="filterCategory = 'personal'"
            title="Persönlich"
          >
            <UIcon name="i-heroicons-user" />
          </button>
          <button 
            class="filter-btn" 
            :class="{ active: filterCategory === 'meeting' }"
            @click="filterCategory = 'meeting'"
            title="Meetings"
          >
            <UIcon name="i-heroicons-users" />
          </button>
          <button 
            class="filter-btn" 
            :class="{ active: filterCategory === 'birthday' }"
            @click="filterCategory = 'birthday'"
            title="Geburtstage"
          >
            <UIcon name="i-heroicons-cake" />
          </button>
        </div>

        <button class="quick-add-btn" @click="() => { currentView = 'create'; resetForm(); }">
          <UIcon name="i-heroicons-plus" />
          <span>Schnell erstellen</span>
        </button>
      </div>

      <!-- View Tabs -->
      <div class="view-tabs">
        <button 
          class="tab-button" 
          :class="{ active: currentView === 'list' }"
          @click="currentView = 'list'"
        >
          <UIcon name="i-heroicons-list-bullet" />
          <span>Liste</span>
          <span class="tab-badge">{{ filteredEvents.length }}</span>
        </button>
        <button 
          class="tab-button" 
          :class="{ active: currentView === 'grid' }"
          @click="currentView = 'grid'"
        >
          <UIcon name="i-heroicons-calendar" />
          <span>Kalender</span>
        </button>
        <button 
          class="tab-button" 
          :class="{ active: currentView === 'timeline' }"
          @click="currentView = 'timeline'"
        >
          <UIcon name="i-heroicons-activity" />
          <span>Timeline</span>
        </button>
        <button 
          class="tab-button" 
          @click="navigateTo('/aufgaben')"
        >
          <UIcon name="i-heroicons-check-square" />
          <span>Aufgaben</span>
          <span class="tab-badge">{{ tasks.length }}</span>
        </button>
        <button 
          class="tab-button" 
          :class="{ active: currentView === 'analytics' }"
          @click="currentView = 'analytics'"
        >
          <UIcon name="i-heroicons-chart-bar" />
          <span>Statistiken</span>
        </button>
        <button 
          class="tab-button" 
          :class="{ active: currentView === 'create' }"
          @click="currentView = 'create'"
        >
          <UIcon name="i-heroicons-plus-circle" />
          <span>Erstellen</span>
        </button>
      </div>

      <!-- Error Message -->
      <div v-if="calendarError" class="error-card">
        <UIcon name="i-heroicons-alert-circle" class="error-icon" />
        <div>
          <h3>Fehler</h3>
          <p>{{ calendarError }}</p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-card">
        <UIcon name="i-heroicons-loader-2" class="loading-icon" />
        <p>Termine werden geladen...</p>
      </div>

      <!-- List View -->
      <div v-else-if="currentView === 'list'" class="calendar-content">
        <!-- Today's Events -->
        <div class="events-section">
          <div class="section-header">
            <h2>
              <UIcon name="i-heroicons-calendar-days" />
              Heute
              <span class="count-badge">{{ todayEvents.length }}</span>
            </h2>
            <div class="view-options">
              <button class="view-option-btn" :class="{ active: listViewType === 'cards' }" @click="listViewType = 'cards'" title="Karten">
                <UIcon name="i-heroicons-square" />
              </button>
              <button class="view-option-btn" :class="{ active: listViewType === 'compact' }" @click="listViewType = 'compact'" title="Kompakt">
                <UIcon name="i-heroicons-list-bullet" />
              </button>
            </div>
          </div>
          <div v-if="todayEvents.length === 0" class="no-events">
            <UIcon name="i-heroicons-check-circle" />
            <p>Keine Termine heute</p>
            <span class="emoji">🎉</span>
          </div>
          <div v-else class="events-list" :class="listViewType">
            <div v-for="event in todayEvents" :key="event.id" class="event-card" :class="getEventCategoryClass(event)" @click="navigateToEvent(event)">
              <div class="event-indicator" :style="{ background: getEventColor(event) }"></div>
              <div class="event-content">
                <div class="event-header">
                  <div class="event-icon" :style="{ background: getEventColor(event) + '20' }">
                    <UIcon :name="getEventIcon(event)" :style="{ color: getEventColor(event) }" />
                  </div>
                  <div class="event-time">
                    <UIcon name="i-heroicons-clock" />
                    <span>{{ formatEventTime(event) }}</span>
                  </div>
                  <div class="event-badges">
                    <span v-if="isEventSoon(event)" class="badge badge-warning">
                      <UIcon name="i-heroicons-zap" />
                      Bald
                    </span>
                    <span v-if="event.location" class="badge badge-info">
                      <UIcon name="i-heroicons-map-pin" />
                    </span>
                    <span v-if="getEventPriority(event) === 'high'" class="badge badge-danger">
                      <UIcon name="i-heroicons-alert-circle" />
                    </span>
                  </div>
                </div>
                <div class="event-details">
                  <h3>{{ event.summary || 'Kein Titel' }}</h3>
                  <div class="event-meta">
                    <p v-if="event.location" class="event-location">
                      <UIcon name="i-heroicons-map-pin" />
                      {{ event.location }}
                    </p>
                    <p v-if="event.description" class="event-description">
                      <UIcon name="i-heroicons-align-left" />
                      {{ event.description }}
                    </p>
                  </div>
                </div>
              </div>
              <div class="event-actions">
                <button class="action-btn" @click.stop="duplicateEvent(event)" title="Duplizieren">
                  <UIcon name="i-heroicons-clipboard-document" />
                </button>
                <button class="action-btn" @click.stop="startEditEvent(event)" title="Bearbeiten">
                  <UIcon name="i-heroicons-pencil" />
                </button>
                <button class="action-btn delete-btn" @click="confirmDeleteEvent(event)" title="Löschen">
                  <UIcon name="i-heroicons-trash" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Upcoming Events -->
        <div class="events-section">
          <div class="section-header">
            <h2>
              <UIcon name="i-heroicons-calendar" />
              Kommende Termine (7 Tage)
              <span class="count-badge">{{ upcomingEvents.length }}</span>
            </h2>
          </div>
          <div v-if="upcomingEvents.length === 0" class="no-events">
            <UIcon name="i-heroicons-inbox" />
            <p>Keine kommenden Termine</p>
            <span class="emoji">📅</span>
          </div>
          <div v-else class="events-by-day">
            <div v-for="day in groupedUpcomingEvents" :key="day.date" class="day-group">
              <div class="day-header">
                <div class="day-info">
                  <span class="day-name">{{ day.dayName }}</span>
                  <span class="day-date">{{ day.dateStr }}</span>
                </div>
                <span class="day-count">{{ day.events.length }} {{ day.events.length === 1 ? 'Termin' : 'Termine' }}</span>
              </div>
              <div class="events-list" :class="listViewType">
                <div v-for="event in day.events" :key="event.id" class="event-card" :class="getEventCategoryClass(event)" @click="navigateToEvent(event)">
                  <div class="event-indicator" :style="{ background: getEventColor(event) }"></div>
                  <div class="event-content">
                    <div class="event-header">
                      <div class="event-icon" :style="{ background: getEventColor(event) + '20' }">
                        <UIcon :name="getEventIcon(event)" :style="{ color: getEventColor(event) }" />
                      </div>
                      <div class="event-time">
                        <UIcon name="i-heroicons-clock" />
                        <span>{{ formatEventTime(event) }}</span>
                      </div>
                      <div class="event-badges">
                        <span v-if="event.location" class="badge badge-info">
                          <UIcon name="i-heroicons-map-pin" />
                        </span>
                        <span v-if="getEventPriority(event) === 'high'" class="badge badge-danger">
                          <UIcon name="i-heroicons-alert-circle" />
                        </span>
                      </div>
                    </div>
                    <div class="event-details">
                      <h3>{{ event.summary || 'Kein Titel' }}</h3>
                      <div class="event-meta">
                        <p v-if="event.location" class="event-location">
                          <UIcon name="i-heroicons-map-pin" />
                          {{ event.location }}
                        </p>
                        <p v-if="event.description" class="event-description">
                          <UIcon name="i-heroicons-align-left" />
                          {{ event.description }}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div class="event-actions">
                    <button class="action-btn" @click.stop="duplicateEvent(event)" title="Duplizieren">
                      <UIcon name="i-heroicons-clipboard-document" />
                    </button>
                    <button class="action-btn" @click.stop="startEditEvent(event)" title="Bearbeiten">
                      <UIcon name="i-heroicons-pencil" />
                    </button>
                    <button class="action-btn delete-btn" @click.stop="confirmDeleteEvent(event)" title="Löschen">
                      <UIcon name="i-heroicons-trash" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Grid/Calendar View -->
      <div v-else-if="currentView === 'grid'" class="grid-content">
        <div class="mini-calendar">
          <div class="calendar-header">
            <h2>
              <UIcon name="i-heroicons-calendar" />
              {{ currentMonth }} {{ currentYear }}
            </h2>
            <div class="calendar-nav">
              <button @click="previousWeek" class="nav-btn">
                <UIcon name="i-heroicons-chevron-left" />
              </button>
              <button @click="goToToday" class="nav-btn today-btn">
                Heute
              </button>
              <button @click="nextWeek" class="nav-btn">
                <UIcon name="i-heroicons-chevron-right" />
              </button>
            </div>
          </div>
          
          <div class="calendar-grid">
            <div class="calendar-weekdays">
              <div class="weekday" v-for="day in weekDays" :key="day">{{ day }}</div>
            </div>
            <div class="calendar-days">
              <div 
                v-for="day in calendarDays" 
                :key="day.dateStr"
                class="calendar-day"
                :class="{ 
                  'is-today': day.isToday,
                  'has-events': day.events.length > 0,
                  'is-past': day.isPast
                }"
                @click="selectDay(day)"
              >
                <div class="day-number">{{ day.dayNumber }}</div>
                <div v-if="day.events.length > 0" class="day-events">
                  <div 
                    v-for="event in day.events.slice(0, 3)" 
                    :key="event.id"
                    class="day-event"
                    :style="{ background: getEventColor(event) }"
                    :title="event.summary"
                  >
                    <UIcon :name="getEventIcon(event)" class="mini-icon" />
                    <span>{{ event.summary }}</span>
                  </div>
                  <div v-if="day.events.length > 3" class="more-events">
                    +{{ day.events.length - 3 }} mehr
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Selected Day Details -->
          <div v-if="selectedDay" class="selected-day-details">
            <div class="details-header">
              <h3>
                <UIcon name="i-heroicons-calendar-days" />
                {{ selectedDay.dayName }}, {{ selectedDay.dateStr }}
              </h3>
              <button @click="selectedDay = null" class="close-btn">
                <UIcon name="i-heroicons-x-mark" />
              </button>
            </div>
            <div v-if="selectedDay.events.length === 0" class="no-events">
              <UIcon name="i-heroicons-inbox" />
              <p>Keine Termine an diesem Tag</p>
            </div>
            <div v-else class="day-events-list">
              <div v-for="event in selectedDay.events" :key="event.id" class="event-item">
                <div class="event-indicator" :style="{ background: getEventColor(event) }"></div>
                <div class="event-info">
                  <div class="event-time-badge">
                    <UIcon name="i-heroicons-clock" />
                    {{ formatEventTime(event) }}
                  </div>
                  <h4>{{ event.summary }}</h4>
                  <p v-if="event.location">
                    <UIcon name="i-heroicons-map-pin" />
                    {{ event.location }}
                  </p>
                </div>
                <div class="event-quick-actions">
                  <button @click="startEditEvent(event)" class="quick-action-btn">
                    <UIcon name="i-heroicons-pencil" />
                  </button>
                  <button @click="confirmDeleteEvent(event)" class="quick-action-btn delete">
                    <UIcon name="i-heroicons-trash" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline View -->
      <div v-else-if="currentView === 'timeline'" class="timeline-content">
        <h2 class="section-title">
          <UIcon name="i-heroicons-activity" />
          Timeline Ansicht
        </h2>
        
        <div v-if="isLoading" class="loading-card">
          <UIcon name="i-heroicons-loader-2" class="loading-icon" />
          <p>Timeline wird geladen...</p>
        </div>
        
        <div v-else class="timeline-container">
          <div v-for="(dayGroup, index) in timelineEvents" :key="dayGroup.date" class="timeline-day">
            <div class="timeline-date-marker">
              <div class="timeline-dot"></div>
              <div class="timeline-date-label">
                <h3>{{ dayGroup.dayName }}</h3>
                <p>{{ dayGroup.dateStr }}</p>
              </div>
            </div>
            
            <div class="timeline-events">
              <div v-for="event in dayGroup.events" :key="event.id" class="timeline-event" :class="getEventCategoryClass(event)">
                <div class="timeline-event-time">
                  <UIcon name="i-heroicons-clock" />
                  <span>{{ formatEventTime(event) }}</span>
                </div>
                <div class="timeline-event-card" @click="navigateToEvent(event)">
                  <div class="timeline-event-header">
                    <div class="event-icon" :style="{ background: getEventColor(event) + '20' }">
                      <UIcon :name="getEventIcon(event)" :style="{ color: getEventColor(event) }" />
                    </div>
                    <h4>{{ event.summary }}</h4>
                    <div class="timeline-actions">
                      <button @click.stop="startEditEvent(event)" class="timeline-action-btn">
                        <UIcon name="i-heroicons-pencil" />
                      </button>
                      <button @click.stop="confirmDeleteEvent(event)" class="timeline-action-btn delete">
                        <UIcon name="i-heroicons-trash" />
                      </button>
                    </div>
                  </div>
                  <div v-if="event.location || event.description" class="timeline-event-details">
                    <p v-if="event.location" class="timeline-location">
                      <UIcon name="i-heroicons-map-pin" />
                      {{ event.location }}
                    </p>
                    <p v-if="event.description" class="timeline-description">
                      {{ event.description }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="timelineEvents.length === 0" class="no-events">
            <UIcon name="i-heroicons-calendar-x" />
            <p>Keine Events in der Timeline</p>
            <span class="emoji">📅</span>
          </div>
        </div>
      </div>

      <!-- Tasks View -->
      <div v-else-if="currentView === 'tasks'" class="tasks-content">
        <div class="tasks-header">
          <h2 class="section-title">
            <UIcon name="i-heroicons-check-square" />
            Aufgaben
          </h2>
          <button @click="addNewTask" class="add-task-btn">
            <UIcon name="i-heroicons-plus" />
            <span>Neue Aufgabe</span>
          </button>
        </div>
        
        <!-- Advanced Task Form -->
        <div v-if="showTaskInput" class="task-form-container">
          <div class="task-form">
            <h3 class="form-subtitle">
              <UIcon :name="editingTaskId ? 'i-heroicons-edit-3' : 'i-heroicons-plus-circle'" />
              {{ editingTaskId ? 'Aufgabe bearbeiten' : 'Neue Aufgabe erstellen' }}
            </h3>
            
            <div class="form-grid">
              <!-- Title -->
              <div class="form-group full-width">
                <label>
                  <UIcon name="i-heroicons-text" />
                  Titel *
                </label>
                <input 
                  v-model="taskForm.title" 
                  type="text" 
                  placeholder="Aufgabentitel..."
                  class="form-input"
                  required
                />
              </div>
              
              <!-- Description -->
              <div class="form-group full-width">
                <label>
                  <UIcon name="i-heroicons-align-left" />
                  Beschreibung
                </label>
                <textarea 
                  v-model="taskForm.description"
                  placeholder="Aufgabendetails..."
                  class="form-textarea"
                  rows="3"
                ></textarea>
              </div>
              
              <!-- Due Date -->
              <div class="form-group">
                <label>
                  <UIcon name="i-heroicons-calendar" />
                  Fälligkeitsdatum
                </label>
                <input 
                  v-model="taskForm.dueDate" 
                  type="date" 
                  class="form-input"
                />
              </div>
              
              <!-- Due Time -->
              <div class="form-group">
                <label>
                  <UIcon name="i-heroicons-clock" />
                  Uhrzeit
                </label>
                <input 
                  v-model="taskForm.dueTime" 
                  type="time" 
                  class="form-input"
                />
              </div>
              
              <!-- Priority -->
              <div class="form-group">
                <label>
                  <UIcon name="i-heroicons-flag" />
                  Priorität
                </label>
                <select v-model="taskForm.priority" class="form-select">
                  <option value="low">Niedrig</option>
                  <option value="medium">Mittel</option>
                  <option value="high">Hoch</option>
                  <option value="urgent">Dringend</option>
                </select>
              </div>
              
              <!-- Category -->
              <div class="form-group">
                <label>
                  <UIcon name="i-heroicons-folder" />
                  Kategorie
                </label>
                <select v-model="taskForm.category" class="form-select">
                  <option value="personal">Persönlich</option>
                  <option value="work">Arbeit</option>
                  <option value="shopping">Einkaufen</option>
                  <option value="health">Gesundheit</option>
                  <option value="finance">Finanzen</option>
                  <option value="other">Sonstiges</option>
                </select>
              </div>
              
              <!-- Tags -->
              <div class="form-group full-width">
                <label>
                  <UIcon name="i-heroicons-tags" />
                  Tags (durch Komma getrennt)
                </label>
                <input 
                  v-model="taskForm.tags" 
                  type="text" 
                  placeholder="z.B. wichtig, dringend, nachfragen"
                  class="form-input"
                />
              </div>
              
              <!-- Notes -->
              <div class="form-group full-width">
                <label>
                  <UIcon name="i-heroicons-sticky-note" />
                  Notizen
                </label>
                <textarea 
                  v-model="taskForm.notes"
                  placeholder="Zusätzliche Notizen..."
                  class="form-textarea"
                  rows="2"
                ></textarea>
              </div>
            </div>
            
            <div class="form-actions">
              <button @click="saveTask" class="btn btn-primary">
                <UIcon name="i-heroicons-check" />
                {{ editingTaskId ? 'Speichern' : 'Aufgabe erstellen' }}
              </button>
              <button @click="cancelTaskInput" class="btn btn-secondary">
                <UIcon name="i-heroicons-x-mark" />
                Abbrechen
              </button>
            </div>
          </div>
        </div>
        
        <!-- Tasks List -->
        <div class="tasks-container">
          <!-- Filter Options -->
          <div class="tasks-filters">
            <button 
              v-for="filter in taskFilters" 
              :key="filter.value"
              @click="currentTaskFilter = filter.value"
              :class="['filter-btn', { active: currentTaskFilter === filter.value }]"
            >
              <UIcon :name="filter.icon" />
              <span>{{ filter.label }}</span>
            </button>
          </div>
          
          <!-- Active Tasks -->
          <div class="tasks-section">
            <h3 class="tasks-section-title">
              <UIcon name="i-heroicons-circle-dashed" />
              Offen ({{ filteredActiveTasks.length }})
            </h3>
            <div v-if="filteredActiveTasks.length === 0" class="no-tasks">
              <UIcon name="i-heroicons-check-circle" />
              <p>Keine offenen Aufgaben</p>
            </div>
            <div v-else class="tasks-list">
              <div v-for="task in filteredActiveTasks" :key="task.id" class="task-item" :class="[`priority-${task.priority}`, { 'overdue': isTaskOverdue(task) }]">
                <button @click="toggleTask(task.id)" class="task-checkbox">
                  <UIcon v-if="task.completed" name="i-heroicons-check-circle" class="checked" />
                  <UIcon v-else name="i-heroicons-circle" class="unchecked" />
                </button>
                <div class="task-content">
                  <div class="task-main">
                    <h4 class="task-title" :class="{ completed: task.completed }">{{ task.title }}</h4>
                    <div class="task-badges">
                      <span class="task-badge priority" :class="`priority-${task.priority}`">
                        <UIcon name="i-heroicons-flag" />
                        {{ getPriorityLabel(task.priority) }}
                      </span>
                      <span class="task-badge category" :class="`category-${task.category}`">
                        <UIcon :name="getCategoryIcon(task.category)" />
                        {{ getCategoryLabel(task.category) }}
                      </span>
                      <span v-if="isTaskOverdue(task)" class="task-badge overdue">
                        <UIcon name="i-heroicons-alert-circle" />
                        Überfällig
                      </span>
                    </div>
                  </div>
                  <p v-if="task.description" class="task-description">{{ task.description }}</p>
                  <div class="task-meta">
                    <span v-if="task.dueDate" class="task-due">
                      <UIcon name="i-heroicons-calendar" />
                      {{ formatTaskDueDate(task.dueDate, task.dueTime) }}
                    </span>
                    <span class="task-date">
                      <UIcon name="i-heroicons-clock-3" />
                      Erstellt: {{ formatTaskDate(task.createdAt) }}
                    </span>
                  </div>
                  <div v-if="task.tags && task.tags.length > 0" class="task-tags">
                    <span v-for="tag in task.tags" :key="tag" class="task-tag">
                      <UIcon name="i-heroicons-tag" />
                      {{ tag }}
                    </span>
                  </div>
                </div>
                <div class="task-actions">
                  <button @click="startEditTask(task)" class="task-action-btn" title="Bearbeiten">
                    <UIcon name="i-heroicons-pencil" />
                  </button>
                  <button @click="deleteTask(task.id)" class="task-action-btn delete" title="Löschen">
                    <UIcon name="i-heroicons-trash" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Completed Tasks -->
          <div class="tasks-section">
            <h3 class="tasks-section-title">
              <UIcon name="i-heroicons-check-circle" />
              Erledigt ({{ filteredCompletedTasks.length }})
            </h3>
            <div v-if="filteredCompletedTasks.length === 0" class="no-tasks">
              <UIcon name="i-heroicons-inbox" />
              <p>Keine erledigten Aufgaben</p>
            </div>
            <div v-else class="tasks-list">
              <div v-for="task in filteredCompletedTasks" :key="task.id" class="task-item completed">
                <button @click="toggleTask(task.id)" class="task-checkbox">
                  <UIcon name="i-heroicons-check-circle" class="checked" />
                </button>
                <div class="task-content">
                  <div class="task-main">
                    <h4 class="task-title completed">{{ task.title }}</h4>
                  </div>
                  <p v-if="task.description" class="task-description completed">{{ task.description }}</p>
                  <div class="task-meta">
                    <span class="task-date">
                      <UIcon name="i-heroicons-check-circle" />
                      Erledigt: {{ formatTaskDate(task.completedAt) }}
                    </span>
                  </div>
                </div>
                <div class="task-actions">
                  <button @click="deleteTask(task.id)" class="task-action-btn delete" title="Löschen">
                    <UIcon name="i-heroicons-trash" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Analytics View -->
      <div v-else-if="currentView === 'analytics'" class="analytics-content">
        <h2 class="section-title">
          <UIcon name="i-heroicons-chart-bar" />
          Kalender Statistiken
        </h2>
        
        <div v-if="isLoadingStats" class="loading-card">
          <UIcon name="i-heroicons-loader-2" class="loading-icon" />
          <p>Statistiken werden berechnet...</p>
        </div>
        
        <div v-else-if="statistics" class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">
              <UIcon name="i-heroicons-calendar-check" />
            </div>
            <div class="stat-content">
              <h3>{{ statistics.totalEvents }}</h3>
              <p>Termine gesamt</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <UIcon name="i-heroicons-clock" />
            </div>
            <div class="stat-content">
              <h3>{{ statistics.totalHours }}h</h3>
              <p>Gesamtzeit</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <UIcon name="i-heroicons-timer" />
            </div>
            <div class="stat-content">
              <h3>{{ statistics.averageEventDuration }} min</h3>
              <p>Ø Dauer</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <UIcon name="i-heroicons-map-pin" />
            </div>
            <div class="stat-content">
              <h3>{{ statistics.eventsWithLocation }}</h3>
              <p>Mit Ort</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <UIcon name="i-heroicons-sunrise" />
            </div>
            <div class="stat-content">
              <h3>{{ statistics.allDayEvents }}</h3>
              <p>Ganztägig</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <UIcon name="i-heroicons-calendar-range" />
            </div>
            <div class="stat-content">
              <h3>{{ statistics.timedEvents }}</h3>
              <p>Zeitgebunden</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Create/Edit View -->
      <div v-else-if="currentView === 'create'" class="create-content">
        <div class="form-header">
          <h2 class="section-title">
            <UIcon :name="editingEvent ? 'i-heroicons-pencil' : 'i-heroicons-sparkles'" />
            {{ editingEvent ? 'Termin bearbeiten' : 'Neuer Termin' }}
          </h2>
          <button v-if="editingEvent" type="button" class="btn btn-ghost" @click="cancelEdit">
            <UIcon name="i-heroicons-x-mark" />
            Abbrechen
          </button>
        </div>
        
        <form @submit.prevent="handleSubmitEvent" class="event-form advanced">
          <!-- Basic Info -->
          <div class="form-section">
            <h3 class="form-section-title">
              <UIcon name="i-heroicons-info" />
              Grundinformationen
            </h3>
            
            <div class="form-group">
              <label for="summary">
                <UIcon name="i-heroicons-text" />
                Titel*
              </label>
              <input
                id="summary"
                v-model="eventForm.summary"
                type="text"
                placeholder="z.B. Team Meeting, Zahnarzttermin, Geburtstag..."
                required
                class="input-large"
              />
            </div>
            
            <div class="form-row-3">
              <div class="form-group">
                <label for="category">
                  <UIcon name="i-heroicons-tag" />
                  Kategorie*
                </label>
                <select id="category" v-model="eventForm.category" required class="select-fancy">
                  <option value="work">🔷 Arbeit</option>
                  <option value="personal">👤 Persönlich</option>
                  <option value="meeting">👥 Meeting</option>
                  <option value="birthday">🎂 Geburtstag</option>
                  <option value="event">🎉 Event</option>
                  <option value="reminder">🔔 Erinnerung</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="priority">
                  <UIcon name="i-heroicons-flag" />
                  Priorität
                </label>
                <select id="priority" v-model="eventForm.priority" class="select-fancy">
                  <option value="low">🟢 Niedrig</option>
                  <option value="normal">🟡 Normal</option>
                  <option value="high">🔴 Hoch</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="color">
                  <UIcon name="i-heroicons-palette" />
                  Farbe
                </label>
                <select id="color" v-model="eventForm.color" class="select-color">
                  <option value="#4facfe">🔵 Blau</option>
                  <option value="#00f2fe">💙 Cyan</option>
                  <option value="#43e97b">💚 Grün</option>
                  <option value="#fa709a">💖 Pink</option>
                  <option value="#fee140">💛 Gelb</option>
                  <option value="#ff6b6b">❤️ Rot</option>
                  <option value="#a29bfe">💜 Lila</option>
                </select>
              </div>
            </div>
          </div>
          
          <!-- Date & Time -->
          <div class="form-section">
            <h3 class="form-section-title">
              <UIcon name="i-heroicons-calendar" />
              Datum & Zeit
            </h3>
            
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="eventForm.isAllDay" />
                <span class="checkbox-custom"></span>
                <UIcon name="i-heroicons-sunrise" />
                Ganztägiger Termin
              </label>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="startDate">
                  <UIcon name="i-heroicons-calendar" />
                  Startdatum*
                </label>
                <input
                  id="startDate"
                  v-model="eventForm.startDate"
                  type="date"
                  required
                  class="input-date"
                />
              </div>
              
              <div class="form-group" v-if="!eventForm.isAllDay">
                <label for="startTime">
                  <UIcon name="i-heroicons-clock" />
                  Startzeit*
                </label>
                <input
                  id="startTime"
                  v-model="eventForm.startTime"
                  type="time"
                  :required="!eventForm.isAllDay"
                  class="input-time"
                />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="endDate">
                  <UIcon name="i-heroicons-calendar" />
                  Enddatum*
                </label>
                <input
                  id="endDate"
                  v-model="eventForm.endDate"
                  type="date"
                  required
                  class="input-date"
                />
              </div>
              
              <div class="form-group" v-if="!eventForm.isAllDay">
                <label for="endTime">
                  <UIcon name="i-heroicons-clock" />
                  Endzeit*
                </label>
                <input
                  id="endTime"
                  v-model="eventForm.endTime"
                  type="time"
                  :required="!eventForm.isAllDay"
                  class="input-time"
                />
              </div>
            </div>
            
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="eventForm.isRecurring" />
                <span class="checkbox-custom"></span>
                <UIcon name="i-heroicons-repeat" />
                Wiederkehrender Termin
              </label>
            </div>
            
            <div v-if="eventForm.isRecurring" class="form-group">
              <label for="recurrence">
                <UIcon name="i-heroicons-calendar-repeat" />
                Wiederholung
              </label>
              <select id="recurrence" v-model="eventForm.recurrence" class="select-fancy">
                <option value="daily">📅 Täglich</option>
                <option value="weekly">📆 Wöchentlich</option>
                <option value="monthly">📅 Monatlich</option>
                <option value="yearly">🎂 Jährlich</option>
              </select>
            </div>
          </div>
          
          <!-- Location & Details -->
          <div class="form-section">
            <h3 class="form-section-title">
              <UIcon name="i-heroicons-map-pin" />
              Ort & Details
            </h3>
            
            <div class="form-group">
              <label for="location">
                <UIcon name="i-heroicons-map-pin" />
                Ort / Adresse
              </label>
              <input
                id="location"
                v-model="eventForm.location"
                type="text"
                placeholder="z.B. Konferenzraum A, Hauptstraße 123..."
                class="input-large"
              />
            </div>
            
            <div class="form-group">
              <label for="videoLink">
                <UIcon name="i-heroicons-video" />
                Videokonferenz-Link
              </label>
              <input
                id="videoLink"
                v-model="eventForm.videoLink"
                type="url"
                placeholder="https://zoom.us/j/..."
                class="input-large"
              />
            </div>
            
            <div class="form-group">
              <label for="description">
                <UIcon name="i-heroicons-align-left" />
                Beschreibung
              </label>
              <textarea
                id="description"
                v-model="eventForm.description"
                rows="5"
                placeholder="Zusätzliche Informationen, Agenda, Notizen..."
                class="textarea-large"
              ></textarea>
            </div>
          </div>
          
          <!-- Advanced Options -->
          <div class="form-section">
            <h3 class="form-section-title">
              <UIcon name="i-heroicons-settings" />
              Erweiterte Optionen
            </h3>
            
            <div class="form-group">
              <label for="attendees">
                <UIcon name="i-heroicons-users" />
                Teilnehmer
              </label>
              <input
                id="attendees"
                v-model="eventForm.attendees"
                type="text"
                placeholder="E-Mails mit Komma trennen: max@example.com, anna@example.com"
                class="input-large"
              />
              <span class="form-hint">Teilnehmer erhalten eine Kalendereinladung</span>
            </div>
            
            <div class="form-group">
              <label>
                <UIcon name="i-heroicons-bell" />
                Erinnerungen
              </label>
              <div class="reminders-list">
                <div v-for="(reminder, index) in eventForm.reminders" :key="index" class="reminder-item">
                  <div class="custom-dropdown">
                    <button type="button" class="dropdown-trigger" @click="toggleReminderDropdown(index)">
                      <UIcon name="i-heroicons-bell" />
                      <span>{{ getReminderLabel(reminder) }}</span>
                      <UIcon name="i-heroicons-chevron-down" class="dropdown-arrow" />
                    </button>
                    <div v-if="openReminderDropdown === index" class="dropdown-menu">
                      <button type="button" @click="updateReminder(index, '5')" class="dropdown-item">
                        <UIcon name="i-heroicons-clock" />
                        5 Minuten vorher
                      </button>
                      <button type="button" @click="updateReminder(index, '15')" class="dropdown-item">
                        <UIcon name="i-heroicons-clock" />
                        15 Minuten vorher
                      </button>
                      <button type="button" @click="updateReminder(index, '30')" class="dropdown-item">
                        <UIcon name="i-heroicons-clock" />
                        30 Minuten vorher
                      </button>
                      <button type="button" @click="updateReminder(index, '60')" class="dropdown-item">
                        <UIcon name="i-heroicons-clock-3" />
                        1 Stunde vorher
                      </button>
                      <button type="button" @click="updateReminder(index, '120')" class="dropdown-item">
                        <UIcon name="i-heroicons-clock-4" />
                        2 Stunden vorher
                      </button>
                      <button type="button" @click="updateReminder(index, '1440')" class="dropdown-item">
                        <UIcon name="i-heroicons-calendar-days" />
                        1 Tag vorher
                      </button>
                      <button type="button" @click="updateReminder(index, '2880')" class="dropdown-item">
                        <UIcon name="i-heroicons-calendar-days" />
                        2 Tage vorher
                      </button>
                      <button type="button" @click="updateReminder(index, '10080')" class="dropdown-item">
                        <UIcon name="i-heroicons-calendar-range" />
                        1 Woche vorher
                      </button>
                    </div>
                  </div>
                  <button type="button" @click="removeReminder(index)" class="remove-reminder-btn">
                    <UIcon name="i-heroicons-trash" />
                  </button>
                </div>
                <button type="button" @click="addReminder" class="add-reminder-btn">
                  <UIcon name="i-heroicons-plus" />
                  <span>Erinnerung hinzufügen</span>
                </button>
              </div>
            </div>
            
            <div class="form-group">
              <label>
                <UIcon name="i-heroicons-eye" />
                Verfügbarkeit
              </label>
              <div class="custom-dropdown">
                <button type="button" class="dropdown-trigger" @click="toggleVisibilityDropdown">
                  <span>{{ eventForm.visibility === 'busy' ? '🔴 Beschäftigt' : '🟢 Frei' }}</span>
                  <UIcon name="i-heroicons-chevron-down" class="dropdown-arrow" />
                </button>
                <div v-if="showVisibilityDropdown" class="dropdown-menu">
                  <button type="button" @click="setVisibility('busy')" class="dropdown-item">
                    <span class="status-dot busy"></span>
                    Beschäftigt
                  </button>
                  <button type="button" @click="setVisibility('free')" class="dropdown-item">
                    <span class="status-dot free"></span>
                    Frei
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="formError" class="form-error">
            <UIcon name="i-heroicons-alert-circle" />
            <p>{{ formError }}</p>
          </div>
          
          <div class="form-actions sticky">
            <div class="actions-left">
              <button v-if="editingEvent" type="button" class="btn btn-danger-outline" @click="confirmDeleteEvent(editingEvent)">
                <UIcon name="i-heroicons-trash" />
                Löschen
              </button>
            </div>
            <div class="actions-right">
              <button type="button" class="btn btn-secondary" @click="resetForm">
                <UIcon name="i-heroicons-rotate-ccw" />
                Zurücksetzen
              </button>
              <button type="submit" class="btn btn-primary btn-large" :disabled="isSubmitting">
                <UIcon v-if="isSubmitting" name="i-heroicons-loader-2" class="spinning" />
                <UIcon v-else :name="editingEvent ? 'i-heroicons-arrow-down-tray' : 'i-heroicons-plus'" />
                {{ isSubmitting ? 'Wird gespeichert...' : (editingEvent ? 'Änderungen speichern' : 'Termin erstellen') }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="deleteConfirm" class="modal-overlay" @click="deleteConfirm = null">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <UIcon name="i-heroicons-trash" class="modal-icon" />
          <h3>Termin löschen?</h3>
        </div>
        <p class="modal-text">
          Möchtest du den Termin <strong>"{{ deleteConfirm.summary }}"</strong> wirklich löschen?
        </p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="deleteConfirm = null">
            Abbrechen
          </button>
          <button class="btn btn-danger" @click="handleDeleteEvent" :disabled="isDeleting">
            <UIcon v-if="isDeleting" name="i-heroicons-loader-2" class="spinning" />
            <UIcon v-else name="i-heroicons-trash" />
            {{ isDeleting ? 'Wird gelöscht...' : 'Löschen' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Google Auth Composable
const { 
  isAuthenticated, 
  authError, 
  signIn, 
  signOut, 
  restoreToken, 
  fetchCalendarEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getCalendarStatistics
} = useGoogleAuth();

const config = useRuntimeConfig();
const router = useRouter();

// View State
const currentView = ref('list');
const showTroubleshooting = ref(false);
const listViewType = ref('cards'); // 'cards' or 'compact'

// Search & Filter
const searchQuery = ref('');
const filterCategory = ref('all'); // 'all', 'work', 'personal', 'meeting', 'birthday'

// Grid Calendar State
const selectedDay = ref(null);
const currentMonth = ref('');
const currentYear = ref('');
const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

// Computed for troubleshooting
const currentOrigin = computed(() => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3000';
});

const clientIdPreview = computed(() => {
  const clientId = config.public.googleClientId;
  if (!clientId || clientId === 'your_client_id.apps.googleusercontent.com') {
    return '❌ Nicht konfiguriert';
  }
  return String(clientId);
});

// Events State
const allEvents = ref([]);
const calendarError = ref('');
const isLoading = ref(false);

// Statistics State
const statistics = ref(null);
const isLoadingStats = ref(false);

// Form State  
const eventForm = ref({
  summary: '',
  description: '',
  location: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  category: 'personal',
  priority: 'normal',
  color: '#4facfe',
  isAllDay: false,
  isRecurring: false,
  recurrence: 'weekly',
  videoLink: '',
  attendees: '',
  reminders: ['15'],
  visibility: 'busy'
});
const editingEvent = ref(null);
const isSubmitting = ref(false);
const formError = ref('');

// Delete State
const deleteConfirm = ref(null);
const isDeleting = ref(false);

// Dropdown State
const openReminderDropdown = ref(null);
const showVisibilityDropdown = ref(false);

// Tasks State
const tasks = ref([]);
const showTaskInput = ref(false);
const newTaskTitle = ref('');
const editingTaskId = ref(null);
const editTaskTitle = ref('');
const currentTaskFilter = ref('all');

// Task Form
const taskForm = ref({
  title: '',
  description: '',
  dueDate: '',
  dueTime: '',
  priority: 'medium',
  category: 'personal',
  tags: '',
  notes: '',
});

// Task Filters
const taskFilters = [
  { value: 'all', label: 'Alle', icon: 'i-heroicons-list-bullet' },
  { value: 'urgent', label: 'Dringend', icon: 'i-heroicons-alert-circle' },
  { value: 'high', label: 'Hoch', icon: 'i-heroicons-flag' },
  { value: 'today', label: 'Heute', icon: 'i-heroicons-calendar-check' },
  { value: 'overdue', label: 'Überfällig', icon: 'i-heroicons-clock-alert' },
];

// Handle Sign Out
const handleSignOut = () => {
  signOut();
  allEvents.value = [];
  statistics.value = null;
  currentView.value = 'list';
};

// Event Category & Color Helpers
const getEventCategory = (event) => {
  const summary = (event.summary || '').toLowerCase();
  const description = (event.description || '').toLowerCase();
  
  // Check for keywords
  if (summary.includes('meeting') || summary.includes('call') || description.includes('zoom') || description.includes('teams')) {
    return 'meeting';
  }
  if (summary.includes('geburtstag') || summary.includes('birthday')) {
    return 'birthday';
  }
  if (summary.includes('work') || summary.includes('arbeit') || summary.includes('projekt')) {
    return 'work';
  }
  
  // Check for color-coding (if we stored it)
  if (event.colorId) {
    const colorMap = {
      '1': 'work',
      '9': 'meeting',
      '4': 'birthday',
      '7': 'personal'
    };
    return colorMap[event.colorId] || 'personal';
  }
  
  return 'personal';
};

const getEventCategoryClass = (event) => {
  return `category-${getEventCategory(event)}`;
};

const getEventIcon = (event) => {
  const category = getEventCategory(event);
  const iconMap = {
    'work': 'i-heroicons-briefcase',
    'personal': 'i-heroicons-user',
    'meeting': 'i-heroicons-users',
    'birthday': 'i-heroicons-cake',
    'event': 'i-heroicons-party-popper',
    'reminder': 'i-heroicons-bell'
  };
  return iconMap[category] || 'i-heroicons-calendar';
};

const getEventColor = (event) => {
  const category = getEventCategory(event);
  const colorMap = {
    'work': '#4facfe',
    'personal': '#43e97b',
    'meeting': '#fa709a',
    'birthday': '#fee140',
    'event': '#a29bfe',
    'reminder': '#ff6b6b'
  };
  return colorMap[category] || '#4facfe';
};

const getEventPriority = (event) => {
  const summary = (event.summary || '').toLowerCase();
  if (summary.includes('wichtig') || summary.includes('urgent') || summary.includes('!!!')) {
    return 'high';
  }
  return 'normal';
};

const isEventSoon = (event) => {
  if (!event.start.dateTime) return false;
  const eventTime = new Date(event.start.dateTime);
  const now = new Date();
  const diffMinutes = (eventTime - now) / (1000 * 60);
  return diffMinutes > 0 && diffMinutes <= 60; // Within next hour
};

// Filtered Events
const filteredEvents = computed(() => {
  let filtered = allEvents.value;
  
  // Apply search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(event => {
      return (
        (event.summary || '').toLowerCase().includes(query) ||
        (event.description || '').toLowerCase().includes(query) ||
        (event.location || '').toLowerCase().includes(query)
      );
    });
  }
  
  // Apply category filter
  if (filterCategory.value !== 'all') {
    filtered = filtered.filter(event => getEventCategory(event) === filterCategory.value);
  }
  
  return filtered;
});

// Computed
const todayEvents = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return filteredEvents.value.filter(event => {
    const eventDate = new Date(event.start.dateTime || event.start.date);
    return eventDate >= today && eventDate < tomorrow;
  });
});

const upcomingEvents = computed(() => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  return filteredEvents.value.filter(event => {
    const eventDate = new Date(event.start.dateTime || event.start.date);
    return eventDate >= tomorrow;
  });
});

const groupedUpcomingEvents = computed(() => {
  const groups = {};
  
  upcomingEvents.value.forEach(event => {
    const eventDate = new Date(event.start.dateTime || event.start.date);
    const dateKey = eventDate.toDateString();
    
    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: eventDate,
        dayName: formatDayName(eventDate),
        dateStr: formatDateString(eventDate),
        events: []
      };
    }
    
    groups[dateKey].events.push(event);
  });
  
  return Object.values(groups).sort((a, b) => a.date - b.date);
});

// Calendar Grid
const calendarDays = computed(() => {
  const today = new Date();
  const days = [];
  
  // Get 7 days starting from today
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    date.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    
    const dayEvents = allEvents.value.filter(event => {
      const eventDate = new Date(event.start.dateTime || event.start.date);
      return eventDate >= date && eventDate < nextDay;
    });
    
    days.push({
      date: date,
      dateStr: formatDateString(date),
      dayName: formatDayName(date),
      dayNumber: date.getDate(),
      isToday: i === 0,
      isPast: false,
      events: dayEvents
    });
  }
  
  // Update current month and year
  currentMonth.value = today.toLocaleDateString('de-DE', { month: 'long' });
  currentYear.value = today.getFullYear();
  
  return days;
});

// Calendar Navigation
const previousWeek = () => {
  // Would need to implement date shifting logic
  console.log('Previous week');
};

const nextWeek = () => {
  // Would need to implement date shifting logic
  console.log('Next week');
};

const goToToday = () => {
  selectedDay.value = null;
  fetchEvents();
};

const selectDay = (day) => {
  selectedDay.value = day;
};

// Helper Functions
const formatEventTime = (event) => {
  if (event.start.dateTime) {
    const start = new Date(event.start.dateTime);
    const end = new Date(event.end.dateTime);
    return `${start.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return 'Ganztägig';
  }
};

const formatDayName = (date) => {
  const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  return days[date.getDay()];
};

const formatDateString = (date) => {
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
};

const resetForm = () => {
  const now = new Date();
  const later = new Date(now.getTime() + 60 * 60 * 1000);
  
  eventForm.value = {
    summary: '',
    description: '',
    location: '',
    startDate: now.toISOString().split('T')[0],
    startTime: now.toTimeString().slice(0, 5),
    endDate: later.toISOString().split('T')[0],
    endTime: later.toTimeString().slice(0, 5),
    category: 'personal',
    priority: 'normal',
    color: '#4facfe',
    isAllDay: false,
    isRecurring: false,
    recurrence: 'weekly',
    videoLink: '',
    attendees: '',
    reminders: ['15'],
    visibility: 'busy'
  };
  editingEvent.value = null;
  formError.value = '';
};

// Duplicate Event
const duplicateEvent = (event) => {
  const start = new Date(event.start.dateTime || event.start.date);
  const end = new Date(event.end.dateTime || event.end.date);
  
  eventForm.value = {
    summary: `${event.summary} (Kopie)`,
    description: event.description || '',
    location: event.location || '',
    startDate: start.toISOString().split('T')[0],
    startTime: start.toTimeString().slice(0, 5),
    endDate: end.toISOString().split('T')[0],
    endTime: end.toTimeString().slice(0, 5),
    category: 'personal',
    priority: 'normal',
    color: '#4facfe',
    isAllDay: !event.start.dateTime,
    isRecurring: false,
    recurrence: 'weekly',
    videoLink: '',
    attendees: '',
    reminders: ['15'],
    visibility: 'busy'
  };
  
  editingEvent.value = null;
  currentView.value = 'create';
};

// Fetch Calendar Events
const fetchEvents = async () => {
  if (!isAuthenticated.value) {
    return;
  }

  try {
    isLoading.value = true;
    calendarError.value = '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekLater = new Date(today);
    weekLater.setDate(weekLater.getDate() + 7);
    
    const timeMin = today.toISOString();
    const timeMax = weekLater.toISOString();
    
    const events = await fetchCalendarEvents(timeMin, timeMax);
    allEvents.value = events;
  } catch (error) {
    console.error('Fehler beim Abrufen der Kalenderdaten:', error);
    
    if (error.status === 401 || error.status === 403) {
      calendarError.value = 'Authentifizierung abgelaufen. Bitte erneut anmelden.';
    } else if (error.status === 404) {
      calendarError.value = 'Kalender nicht gefunden';
    } else {
      calendarError.value = 'Kalenderdaten nicht verfügbar';
    }
  } finally {
    isLoading.value = false;
  }
};

// Fetch Statistics
const fetchStatistics = async () => {
  if (!isAuthenticated.value) {
    return;
  }

  try {
    isLoadingStats.value = true;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekLater = new Date(today);
    weekLater.setDate(weekLater.getDate() + 7);
    
    const timeMin = today.toISOString();
    const timeMax = weekLater.toISOString();
    
    const stats = await getCalendarStatistics(timeMin, timeMax);
    statistics.value = stats;
  } catch (error) {
    console.error('Fehler beim Abrufen der Statistiken:', error);
  } finally {
    isLoadingStats.value = false;
  }
};

// Event Management Functions
const startEditEvent = (event) => {
  editingEvent.value = event;
  
  const startDate = new Date(event.start.dateTime || event.start.date);
  const endDate = new Date(event.end.dateTime || event.end.date);
  
  eventForm.value = {
    summary: event.summary || '',
    description: event.description || '',
    location: event.location || '',
    startDate: startDate.toISOString().split('T')[0],
    startTime: event.start.dateTime ? startDate.toTimeString().slice(0, 5) : '',
    endDate: endDate.toISOString().split('T')[0],
    endTime: event.end.dateTime ? endDate.toTimeString().slice(0, 5) : '',
    category: getEventCategory(event),
    priority: getEventPriority(event),
    color: getEventColor(event),
    isAllDay: !event.start.dateTime,
    isRecurring: false,
    recurrence: 'weekly',
    videoLink: '',
    attendees: '',
    reminders: ['15'],
    visibility: 'busy'
  };
  
  currentView.value = 'create';
};

const cancelEdit = () => {
  resetForm();
  currentView.value = 'list';
};

const handleSubmitEvent = async () => {
  try {
    isSubmitting.value = true;
    formError.value = '';
    
    // Validate form
    if (!eventForm.value.summary) {
      formError.value = 'Bitte gib einen Titel ein';
      return;
    }
    
    if (!eventForm.value.startDate || !eventForm.value.endDate) {
      formError.value = 'Bitte fülle alle Pflichtfelder aus';
      return;
    }
    
    if (!eventForm.value.isAllDay && (!eventForm.value.startTime || !eventForm.value.endTime)) {
      formError.value = 'Bitte gib Start- und Endzeit an';
      return;
    }
    
    // Create event data
    const eventData = {
      summary: eventForm.value.summary,
      description: eventForm.value.description || '',
      location: eventForm.value.location || '',
    };
    
    // Add date/time based on isAllDay
    if (eventForm.value.isAllDay) {
      eventData.start = {
        date: eventForm.value.startDate,
        timeZone: 'Europe/Berlin'
      };
      eventData.end = {
        date: eventForm.value.endDate,
        timeZone: 'Europe/Berlin'
      };
    } else {
      const startDateTime = `${eventForm.value.startDate}T${eventForm.value.startTime}:00`;
      const endDateTime = `${eventForm.value.endDate}T${eventForm.value.endTime}:00`;
      
      eventData.start = {
        dateTime: startDateTime,
        timeZone: 'Europe/Berlin'
      };
      eventData.end = {
        dateTime: endDateTime,
        timeZone: 'Europe/Berlin'
      };
    }
    
    // Add extended description with metadata
    let extendedDescription = eventForm.value.description || '';
    
    if (eventForm.value.videoLink) {
      extendedDescription += `\n\n🎥 Videokonferenz: ${eventForm.value.videoLink}`;
    }
    
    if (eventForm.value.category) {
      extendedDescription += `\n\n📁 Kategorie: ${eventForm.value.category}`;
    }
    
    if (eventForm.value.priority !== 'normal') {
      extendedDescription += `\n🚩 Priorität: ${eventForm.value.priority}`;
    }
    
    eventData.description = extendedDescription.trim();
    
    // Add attendees if provided
    if (eventForm.value.attendees) {
      const emails = eventForm.value.attendees.split(',').map(e => e.trim()).filter(e => e);
      eventData.attendees = emails.map(email => ({ email }));
    }
    
    // Add reminders
    if (eventForm.value.reminders && eventForm.value.reminders.length > 0 && eventForm.value.reminders[0] !== 'none') {
      eventData.reminders = {
        useDefault: false,
        overrides: eventForm.value.reminders.map(minutes => ({
          method: 'popup',
          minutes: parseInt(minutes)
        }))
      };
    }
    
    // Add recurrence if enabled
    if (eventForm.value.isRecurring) {
      const recurrenceMap = {
        'daily': 'RRULE:FREQ=DAILY',
        'weekly': 'RRULE:FREQ=WEEKLY',
        'monthly': 'RRULE:FREQ=MONTHLY',
        'yearly': 'RRULE:FREQ=YEARLY'
      };
      eventData.recurrence = [recurrenceMap[eventForm.value.recurrence]];
    }
    
    // Set transparency based on visibility
    eventData.transparency = eventForm.value.visibility === 'free' ? 'transparent' : 'opaque';
    
    if (editingEvent.value) {
      // Update existing event
      await updateEvent(editingEvent.value.id, eventData);
    } else {
      // Create new event
      await createEvent(eventData);
    }
    
    // Refresh events and reset form
    await fetchEvents();
    resetForm();
    currentView.value = 'list';
  } catch (error) {
    console.error('Fehler beim Speichern des Termins:', error);
    formError.value = 'Fehler beim Speichern. Bitte versuche es erneut.';
  } finally {
    isSubmitting.value = false;
  }
};

const confirmDeleteEvent = (event) => {
  deleteConfirm.value = event;
};

const handleDeleteEvent = async () => {
  if (!deleteConfirm.value) return;
  
  try {
    isDeleting.value = true;
    await deleteEvent(deleteConfirm.value.id);
    await fetchEvents();
    deleteConfirm.value = null;
  } catch (error) {
    console.error('Fehler beim Löschen des Termins:', error);
    formError.value = 'Fehler beim Löschen. Bitte versuche es erneut.';
  } finally {
    isDeleting.value = false;
  }
};

// Navigation
const navigateToEvent = (event) => {
  console.log('🔗 Navigating to event:', event.id, event.summary);
  router.push(`/termine/${event.id}`);
};

// Dropdown Management Functions
const toggleReminderDropdown = (index) => {
  if (openReminderDropdown.value === index) {
    openReminderDropdown.value = null;
  } else {
    openReminderDropdown.value = index;
    showVisibilityDropdown.value = false;
  }
};

const updateReminder = (index, value) => {
  eventForm.value.reminders[index] = value;
  openReminderDropdown.value = null;
};

const removeReminder = (index) => {
  eventForm.value.reminders.splice(index, 1);
};

const addReminder = () => {
  eventForm.value.reminders.push('15');
};

const toggleVisibilityDropdown = () => {
  showVisibilityDropdown.value = !showVisibilityDropdown.value;
  openReminderDropdown.value = null;
};

const setVisibility = (value) => {
  eventForm.value.visibility = value;
  showVisibilityDropdown.value = false;
};

const getReminderLabel = (minutes) => {
  const labels = {
    '5': '5 Minuten',
    '15': '15 Minuten',
    '30': '30 Minuten',
    '60': '1 Stunde',
    '120': '2 Stunden',
    '1440': '1 Tag',
    '2880': '2 Tage',
    '10080': '1 Woche'
  };
  return labels[minutes] || `${minutes} Minuten`;
};

// Task Management Functions
const addNewTask = () => {
  showTaskInput.value = true;
  editingTaskId.value = null;
  taskForm.value = {
    title: '',
    description: '',
    dueDate: '',
    dueTime: '',
    priority: 'medium',
    category: 'personal',
    tags: '',
    notes: '',
  };
};

const saveTask = () => {
  if (!taskForm.value.title.trim()) return;
  
  const tagsArray = taskForm.value.tags
    ? taskForm.value.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    : [];
  
  if (editingTaskId.value) {
    // Update existing task
    const task = tasks.value.find(t => t.id === editingTaskId.value);
    if (task) {
      task.title = taskForm.value.title.trim();
      task.description = taskForm.value.description.trim();
      task.dueDate = taskForm.value.dueDate;
      task.dueTime = taskForm.value.dueTime;
      task.priority = taskForm.value.priority;
      task.category = taskForm.value.category;
      task.tags = tagsArray;
      task.notes = taskForm.value.notes.trim();
      task.updatedAt = new Date();
    }
  } else {
    // Create new task
    tasks.value.push({
      id: Date.now(),
      title: taskForm.value.title.trim(),
      description: taskForm.value.description.trim(),
      dueDate: taskForm.value.dueDate,
      dueTime: taskForm.value.dueTime,
      priority: taskForm.value.priority,
      category: taskForm.value.category,
      tags: tagsArray,
      notes: taskForm.value.notes.trim(),
      completed: false,
      createdAt: new Date(),
      completedAt: null,
      updatedAt: null,
    });
  }
  
  showTaskInput.value = false;
  editingTaskId.value = null;
};

const createTask = () => {
  if (newTaskTitle.value.trim()) {
    tasks.value.push({
      id: Date.now(),
      title: newTaskTitle.value.trim(),
      description: '',
      dueDate: '',
      dueTime: '',
      priority: 'medium',
      category: 'personal',
      tags: [],
      notes: '',
      completed: false,
      createdAt: new Date(),
      completedAt: null,
      updatedAt: null,
    });
    showTaskInput.value = false;
    newTaskTitle.value = '';
  }
};

const cancelTaskInput = () => {
  showTaskInput.value = false;
  newTaskTitle.value = '';
  editingTaskId.value = null;
};

const toggleTask = (taskId) => {
  const task = tasks.value.find(t => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date() : null;
  }
};

const startEditTask = (task) => {
  editingTaskId.value = task.id;
  taskForm.value = {
    title: task.title,
    description: task.description || '',
    dueDate: task.dueDate || '',
    dueTime: task.dueTime || '',
    priority: task.priority || 'medium',
    category: task.category || 'personal',
    tags: task.tags ? task.tags.join(', ') : '',
    notes: task.notes || '',
  };
  showTaskInput.value = true;
};

const saveTaskEdit = (taskId) => {
  const task = tasks.value.find(t => t.id === taskId);
  if (task && editTaskTitle.value.trim()) {
    task.title = editTaskTitle.value.trim();
  }
  editingTaskId.value = null;
  editTaskTitle.value = '';
};

const deleteTask = (taskId) => {
  if (confirm('Möchten Sie diese Aufgabe wirklich löschen?')) {
    tasks.value = tasks.value.filter(t => t.id !== taskId);
  }
};

const formatTaskDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('de-DE', { 
    day: '2-digit', 
    month: 'short',
    year: 'numeric'
  });
};

const formatTaskDueDate = (date, time) => {
  if (!date) return '';
  const dueDate = new Date(date);
  let formatted = dueDate.toLocaleDateString('de-DE', { 
    day: '2-digit', 
    month: 'short',
    year: 'numeric'
  });
  if (time) {
    formatted += ` um ${time}`;
  }
  return formatted;
};

const isTaskOverdue = (task) => {
  if (!task.dueDate || task.completed) return false;
  const now = new Date();
  const dueDate = new Date(task.dueDate);
  if (task.dueTime) {
    const [hours, minutes] = task.dueTime.split(':');
    dueDate.setHours(parseInt(hours), parseInt(minutes));
  }
  return dueDate < now;
};

const getPriorityLabel = (priority) => {
  const labels = {
    low: 'Niedrig',
    medium: 'Mittel',
    high: 'Hoch',
    urgent: 'Dringend'
  };
  return labels[priority] || priority;
};

const getCategoryLabel = (category) => {
  const labels = {
    personal: 'Persönlich',
    work: 'Arbeit',
    shopping: 'Einkaufen',
    health: 'Gesundheit',
    finance: 'Finanzen',
    other: 'Sonstiges'
  };
  return labels[category] || category;
};

const getCategoryIcon = (category) => {
  const icons = {
    personal: 'i-heroicons-user',
    work: 'i-heroicons-briefcase',
    shopping: 'i-heroicons-shopping-cart',
    health: 'i-heroicons-heart-pulse',
    finance: 'i-heroicons-wallet',
    other: 'i-heroicons-folder'
  };
  return icons[category] || 'i-heroicons-folder';
};

// Computed for Tasks
const activeTasks = computed(() => {
  return tasks.value.filter(task => !task.completed).sort((a, b) => {
    // Sort by priority first (urgent > high > medium > low)
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then by due date (earlier first)
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    
    // Finally by creation date (newer first)
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
});

const completedTasks = computed(() => {
  return tasks.value.filter(task => task.completed).sort((a, b) => {
    return new Date(b.completedAt) - new Date(a.completedAt);
  });
});

const filteredActiveTasks = computed(() => {
  let filtered = activeTasks.value;
  
  if (currentTaskFilter.value === 'urgent') {
    filtered = filtered.filter(task => task.priority === 'urgent');
  } else if (currentTaskFilter.value === 'high') {
    filtered = filtered.filter(task => task.priority === 'high');
  } else if (currentTaskFilter.value === 'today') {
    const today = new Date().toISOString().split('T')[0];
    filtered = filtered.filter(task => task.dueDate === today);
  } else if (currentTaskFilter.value === 'overdue') {
    filtered = filtered.filter(task => isTaskOverdue(task));
  }
  
  return filtered;
});

const filteredCompletedTasks = computed(() => {
  return completedTasks.value;
});

// Computed for Timeline View
const timelineEvents = computed(() => {
  const events = filteredEvents.value;
  const grouped = {};
  
  events.forEach(event => {
    const date = new Date(event.start.dateTime || event.start.date);
    const dateKey = date.toISOString().split('T')[0];
    
    if (!grouped[dateKey]) {
      grouped[dateKey] = {
        date: dateKey,
        dateStr: formatDateString(date),
        dayName: formatDayName(date),
        events: []
      };
    }
    
    grouped[dateKey].events.push(event);
  });
  
  // Sort events within each day by time
  Object.values(grouped).forEach(day => {
    day.events.sort((a, b) => {
      const timeA = new Date(a.start.dateTime || a.start.date);
      const timeB = new Date(b.start.dateTime || b.start.date);
      return timeA - timeB;
    });
  });
  
  return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
});

// Watch for view changes
watch(currentView, (newView) => {
  if (newView === 'analytics') {
    fetchStatistics();
  } else if (newView === 'create' && !editingEvent.value) {
    // Set default date/time for new events
    const now = new Date();
    const later = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour later
    
    eventForm.value.startDate = now.toISOString().split('T')[0];
    eventForm.value.startTime = now.toTimeString().slice(0, 5);
    eventForm.value.endDate = later.toISOString().split('T')[0];
    eventForm.value.endTime = later.toTimeString().slice(0, 5);
  }
});

// Lifecycle
onMounted(() => {
  // Log diagnostic information
  console.group('🔍 Google Calendar OAuth Diagnostics');
  console.log('Current Origin:', window.location.origin);
  console.log('Current URL:', window.location.href);
  console.log('Client ID configured:', !!config.public.googleClientId && config.public.googleClientId !== 'your_client_id.apps.googleusercontent.com');
  console.log('Client ID:', config.public.googleClientId);
  console.groupEnd();
  
  restoreToken();
  
  // Watch for authentication changes
  watch(isAuthenticated, (authenticated) => {
    if (authenticated) {
      fetchEvents();
    } else {
      allEvents.value = [];
      statistics.value = null;
    }
  }, { immediate: true });
});
</script>

<style scoped>
/* Base Styles */
.termine-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 50%, #16213e 100%);
  padding: 2rem;
  position: relative;
  overflow-x: hidden;
}

/* Animations */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.spinning {
  animation: spin 1s linear infinite;
}

/* Page Header */
.page-header {
  margin-bottom: 2rem;
  animation: slideDown 0.6s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-title {
  flex: 1;
}

.header-title h1 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ffffff 0%, #4facfe 50%, #00f2fe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.25rem;
}

.subtitle {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.95rem;
  margin: 0;
}

.header-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: #4facfe;
}

.sparkle {
  animation: pulse 2s ease-in-out infinite;
}

.icon-button {
  padding: 0.75rem;
  background: rgba(79, 172, 254, 0.1);
  border: 1px solid rgba(79, 172, 254, 0.3);
  border-radius: 12px;
  color: #4facfe;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-button:hover:not(:disabled) {
  background: rgba(79, 172, 254, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.2);
}

.icon-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon-button svg {
  width: 1.25rem;
  height: 1.25rem;
}

.refresh-btn svg.spinning {
  animation: spin 1s linear infinite;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: rgba(79, 172, 254, 0.1);
  border: 1px solid rgba(79, 172, 254, 0.3);
  border-radius: 12px;
  color: #4facfe;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-button:hover {
  background: rgba(79, 172, 254, 0.2);
  transform: translateX(-5px);
}

.signout-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  color: #fca5a5;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.signout-button:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}

/* Auth Card */
.auth-card {
  background: rgba(26, 26, 46, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 3rem 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(79, 172, 254, 0.3);
  text-align: center;
  animation: fadeIn 0.5s ease;
}

.auth-icon {
  width: 4rem;
  height: 4rem;
  color: #4facfe;
  margin: 0 auto 1.5rem;
}

.auth-card h2 {
  font-size: 1.75rem;
  color: #ffffff;
  margin-bottom: 1rem;
}

.auth-card p {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 2rem;
  font-size: 1.05rem;
}

.auth-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #fca5a5;
  margin-bottom: 1.5rem;
}

.auth-error svg {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.auth-error p {
  margin: 0;
  font-size: 0.95rem;
}

.google-signin-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, rgba(79, 172, 254, 0.15) 0%, rgba(0, 242, 254, 0.15) 100%);
  border: 2px solid rgba(79, 172, 254, 0.3);
  border-radius: 12px;
  color: #4facfe;
  font-size: 1.05rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.google-signin-btn:hover {
  background: linear-gradient(135deg, rgba(79, 172, 254, 0.25) 0%, rgba(0, 242, 254, 0.25) 100%);
  border-color: rgba(79, 172, 254, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(79, 172, 254, 0.3);
}

.google-signin-btn svg {
  width: 1.5rem;
  height: 1.5rem;
}

/* Controls Bar - Search and Filters */
.controls-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  animation: slideDown 0.7s ease;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.4);
  width: 1.25rem;
  height: 1.25rem;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.875rem 3rem 0.875rem 3rem;
  background: rgba(26, 26, 46, 0.6);
  border: 1px solid rgba(79, 172, 254, 0.2);
  border-radius: 12px;
  color: #ffffff;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: rgba(79, 172, 254, 0.5);
  background: rgba(26, 26, 46, 0.8);
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.15);
}

.clear-search {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.clear-search:hover {
  color: #ffffff;
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-btn {
  position: relative;
  padding: 0.75rem 1rem;
  background: rgba(26, 26, 46, 0.6);
  border: 1px solid rgba(79, 172, 254, 0.2);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-btn:hover {
  background: rgba(79, 172, 254, 0.1);
  border-color: rgba(79, 172, 254, 0.4);
  color: #4facfe;
}

.filter-btn.active {
  background: linear-gradient(135deg, rgba(79, 172, 254, 0.2) 0%, rgba(0, 242, 254, 0.2) 100%);
  border-color: rgba(79, 172, 254, 0.5);
  color: #4facfe;
}

.filter-btn svg {
  width: 1.125rem;
  height: 1.125rem;
}

.filter-btn .badge {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  padding: 0.125rem 0.5rem;
  background: #4facfe;
  color: #0f0f1e;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 10px;
  min-width: 1.25rem;
  text-align: center;
}

.quick-add-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border: none;
  border-radius: 12px;
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.quick-add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(79, 172, 254, 0.4);
}

.quick-add-btn svg {
  width: 1.25rem;
  height: 1.25rem;
}

/* View Tabs */
.view-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 0.5rem;
  background: rgba(26, 26, 46, 0.5);
  border-radius: 16px;
  border: 1px solid rgba(79, 172, 254, 0.2);
  animation: slideDown 0.8s ease;
}

.tab-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: transparent;
  border: none;
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.tab-button:hover {
  background: rgba(79, 172, 254, 0.1);
  color: #4facfe;
}

.tab-button.active {
  background: linear-gradient(135deg, rgba(79, 172, 254, 0.2) 0%, rgba(0, 242, 254, 0.2) 100%);
  color: #4facfe;
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.2);
}

.tab-button svg {
  width: 1.25rem;
  height: 1.25rem;
}

.tab-badge {
  padding: 0.125rem 0.5rem;
  background: rgba(79, 172, 254, 0.3);
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 1.5rem;
  text-align: center;
}

.tab-button.active .tab-badge {
  background: #4facfe;
  color: #0f0f1e;
}

/* Events Section */
.events-section {
  margin-bottom: 2rem;
  animation: slideUp 0.6s ease;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  color: #ffffff;
}

.section-header h2 svg {
  width: 1.75rem;
  height: 1.75rem;
  color: #4facfe;
}

.count-badge {
  padding: 0.25rem 0.75rem;
  background: rgba(79, 172, 254, 0.2);
  color: #4facfe;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 10px;
  margin-left: 0.5rem;
}

.view-options {
  display: flex;
  gap: 0.5rem;
}

.view-option-btn {
  padding: 0.5rem;
  background: rgba(26, 26, 46, 0.6);
  border: 1px solid rgba(79, 172, 254, 0.2);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-option-btn:hover {
  background: rgba(79, 172, 254, 0.1);
  color: #4facfe;
}

.view-option-btn.active {
  background: rgba(79, 172, 254, 0.2);
  border-color: rgba(79, 172, 254, 0.4);
  color: #4facfe;
}

.view-option-btn svg {
  width: 1rem;
  height: 1rem;
}

/* No Events State */
.no-events {
  text-align: center;
  padding: 3rem 2rem;
  background: rgba(26, 26, 46, 0.4);
  border-radius: 16px;
  border: 1px dashed rgba(79, 172, 254, 0.3);
}

.no-events svg {
  width: 3rem;
  height: 3rem;
  color: rgba(79, 172, 254, 0.5);
  margin-bottom: 1rem;
}

.no-events p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.05rem;
  margin: 0;
}

.no-events .emoji {
  font-size: 2rem;
  display: block;
  margin-top: 0.5rem;
}

/* Event Cards */
.events-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.events-list.compact .event-card {
  padding: 0.75rem 1rem;
}

.events-list.compact .event-details h3 {
  font-size: 1rem;
}

.events-list.compact .event-meta {
  font-size: 0.85rem;
}

.event-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: rgba(26, 26, 46, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(79, 172, 254, 0.2);
  transition: all 0.3s ease;
  overflow: hidden;
  cursor: pointer;
}

.event-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.event-card:hover {
  transform: translateX(8px);
  border-color: rgba(79, 172, 254, 0.4);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.event-card:hover::before {
  opacity: 1;
}

.event-indicator {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #4facfe;
  border-radius: 16px 0 0 16px;
}

.event-content {
  flex: 1;
  min-width: 0;
  padding-left: 0.5rem;
}

.event-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.event-icon {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(79, 172, 254, 0.15);
  border-radius: 10px;
  flex-shrink: 0;
}

.event-icon svg {
  width: 1.25rem;
  height: 1.25rem;
}

.event-time {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  font-weight: 500;
}

.event-time svg {
  width: 1rem;
  height: 1rem;
}

.event-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-left: auto;
}

.badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
}

.badge svg {
  width: 0.875rem;
  height: 0.875rem;
}

.badge-warning {
  background: rgba(254, 225, 64, 0.2);
  color: #fee140;
}

.badge-info {
  background: rgba(79, 172, 254, 0.2);
  color: #4facfe;
}

.badge-danger {
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
}

.event-details h3 {
  font-size: 1.125rem;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

.event-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.event-location,
.event-description {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  margin: 0;
}

.event-location svg,
.event-description svg {
  width: 0.9rem;
  height: 0.9rem;
  flex-shrink: 0;
  color: rgba(79, 172, 254, 0.7);
}

.event-description {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.event-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.action-btn {
  padding: 0.625rem;
  background: rgba(79, 172, 254, 0.1);
  border: 1px solid rgba(79, 172, 254, 0.2);
  border-radius: 10px;
  color: #4facfe;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: rgba(79, 172, 254, 0.2);
  border-color: rgba(79, 172, 254, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(79, 172, 254, 0.2);
}

.action-btn svg {
  width: 1.125rem;
  height: 1.125rem;
}

.action-btn.delete-btn {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.action-btn.delete-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.2);
}

/* Category Colors */
.category-work { border-left-color: #4facfe; }
.category-work .event-indicator { background: #4facfe; }

.category-personal { border-left-color: #43e97b; }
.category-personal .event-indicator { background: #43e97b; }

.category-meeting { border-left-color: #fa709a; }
.category-meeting .event-indicator { background: #fa709a; }

.category-birthday { border-left-color: #fee140; }
.category-birthday .event-indicator { background: #fee140; }

/* Day Groups */
.events-by-day {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.day-group {
  animation: slideUp 0.5s ease;
}

.day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid rgba(79, 172, 254, 0.2);
}

.day-info {
  display: flex;
  align-items: baseline;
  gap: 1rem;
}

.day-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #4facfe;
}

.day-date {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.6);
}

.day-count {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  padding: 0.25rem 0.75rem;
  background: rgba(79, 172, 254, 0.1);
  border-radius: 8px;
}

/* Grid/Calendar View */
.grid-content {
  animation: fadeIn 0.5s ease;
}

.mini-calendar {
  background: rgba(26, 26, 46, 0.6);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 2rem;
  border: 1px solid rgba(79, 172, 254, 0.2);
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.calendar-header h2 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  color: #ffffff;
}

.calendar-header h2 svg {
  width: 1.75rem;
  height: 1.75rem;
  color: #4facfe;
}

.calendar-nav {
  display: flex;
  gap: 0.5rem;
}

.nav-btn {
  padding: 0.75rem 1rem;
  background: rgba(79, 172, 254, 0.1);
  border: 1px solid rgba(79, 172, 254, 0.2);
  border-radius: 10px;
  color: #4facfe;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-btn:hover {
  background: rgba(79, 172, 254, 0.2);
  border-color: rgba(79, 172, 254, 0.4);
}

.nav-btn svg {
  width: 1.125rem;
  height: 1.125rem;
}

.today-btn {
  padding: 0.75rem 1.5rem;
  font-weight: 500;
}

.calendar-grid {
  margin-bottom: 2rem;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.weekday {
  text-align: center;
  padding: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
}

.calendar-day {
  aspect-ratio: 1;
  padding: 0.75rem;
  background: rgba(26, 26, 46, 0.4);
  border: 1px solid rgba(79, 172, 254, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.calendar-day:hover {
  background: rgba(79, 172, 254, 0.1);
  border-color: rgba(79, 172, 254, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.calendar-day.is-today {
  background: rgba(79, 172, 254, 0.15);
  border-color: rgba(79, 172, 254, 0.4);
}

.calendar-day.has-events {
  border-color: rgba(79, 172, 254, 0.3);
}

.calendar-day.is-past {
  opacity: 0.5;
}

.day-number {
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

.day-events {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 60px;
  overflow: hidden;
}

.day-event {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: rgba(79, 172, 254, 0.3);
  border-radius: 6px;
  font-size: 0.75rem;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mini-icon {
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
}

.more-events {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.25rem;
  text-align: center;
}

/* Selected Day Details */
.selected-day-details {
  margin-top: 2rem;
  padding: 1.5rem;
  background: rgba(15, 15, 30, 0.6);
  border-radius: 16px;
  border: 1px solid rgba(79, 172, 254, 0.3);
  animation: slideUp 0.4s ease;
}

.details-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.details-header h3 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  color: #4facfe;
}

.details-header h3 svg {
  width: 1.5rem;
  height: 1.5rem;
}

.close-btn {
  padding: 0.5rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: #fca5a5;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
}

.close-btn svg {
  width: 1.125rem;
  height: 1.125rem;
}

.day-events-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(26, 26, 46, 0.5);
  border-radius: 12px;
  border: 1px solid rgba(79, 172, 254, 0.2);
  transition: all 0.3s ease;
}

.event-item:hover {
  background: rgba(26, 26, 46, 0.7);
  border-color: rgba(79, 172, 254, 0.4);
}

.event-info {
  flex: 1;
}

.event-time-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: rgba(79, 172, 254, 0.2);
  border-radius: 8px;
  color: #4facfe;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.event-time-badge svg {
  width: 0.875rem;
  height: 0.875rem;
}

.event-info h4 {
  font-size: 1.05rem;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
}

.event-info p {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.event-info svg {
  width: 0.9rem;
  height: 0.9rem;
}

.event-quick-actions {
  display: flex;
  gap: 0.5rem;
}

.quick-action-btn {
  padding: 0.5rem;
  background: rgba(79, 172, 254, 0.1);
  border: 1px solid rgba(79, 172, 254, 0.2);
  border-radius: 8px;
  color: #4facfe;
  cursor: pointer;
  transition: all 0.3s ease;
}

.quick-action-btn:hover {
  background: rgba(79, 172, 254, 0.2);
  border-color: rgba(79, 172, 254, 0.4);
}

.quick-action-btn svg {
  width: 1rem;
  height: 1rem;
}

.quick-action-btn.delete {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.quick-action-btn.delete:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
}

/* Form Styles */
.create-content,
.analytics-content {
  animation: fadeIn 0.5s ease;
}

.form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.75rem;
  color: #ffffff;
  margin: 0;
}

.section-title svg {
  width: 2rem;
  height: 2rem;
  color: #4facfe;
}

.event-form {
  background: rgba(26, 26, 46, 0.6);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 2rem;
  border: 1px solid rgba(79, 172, 254, 0.2);
}

.event-form.advanced {
  max-width: 1000px;
  margin: 0 auto;
}

.form-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(79, 172, 254, 0.1);
}

.form-section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.form-section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.125rem;
  color: #4facfe;
  margin: 0 0 1.5rem 0;
  font-weight: 600;
}

.form-section-title svg {
  width: 1.25rem;
  height: 1.25rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.form-group label svg {
  width: 1rem;
  height: 1rem;
  color: rgba(79, 172, 254, 0.7);
}

.form-group input[type="text"],
.form-group input[type="date"],
.form-group input[type="time"],
.form-group input[type="url"],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.875rem 1rem;
  background: rgba(15, 15, 30, 0.6);
  border: 1px solid rgba(79, 172, 254, 0.2);
  border-radius: 10px;
  color: #ffffff;
  font-size: 0.95rem;
  font-family: inherit;
  transition: all 0.3s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: rgba(79, 172, 254, 0.5);
  background: rgba(15, 15, 30, 0.8);
  box-shadow: 0 0 0 3px rgba(79, 172, 254, 0.1);
}

.input-large {
  font-size: 1.05rem !important;
  padding: 1rem 1.25rem !important;
}

.textarea-large {
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
  line-height: 1.6;
}

.select-fancy,
.select-color {
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234facfe' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  padding-right: 3rem;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.form-hint {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-row-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

@media (max-width: 768px) {
  .form-row,
  .form-row-3 {
    grid-template-columns: 1fr;
  }
}

/* Checkbox Styles */
.checkbox-group {
  margin: 1rem 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(15, 15, 30, 0.4);
  border: 1px solid rgba(79, 172, 254, 0.2);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  font-weight: 500;
}

.checkbox-label:hover {
  background: rgba(15, 15, 30, 0.6);
  border-color: rgba(79, 172, 254, 0.4);
}

.checkbox-label input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.checkbox-custom {
  position: relative;
  width: 1.25rem;
  height: 1.25rem;
  background: rgba(15, 15, 30, 0.8);
  border: 2px solid rgba(79, 172, 254, 0.3);
  border-radius: 6px;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0);
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 700;
  transition: transform 0.2s ease;
}

input[type="checkbox"]:checked + .checkbox-custom {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border-color: #4facfe;
}

input[type="checkbox"]:checked + .checkbox-custom::after {
  transform: translate(-50%, -50%) scale(1);
}

.checkbox-label svg {
  width: 1.125rem;
  height: 1.125rem;
  color: rgba(79, 172, 254, 0.7);
}

/* Form Actions */
.form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(79, 172, 254, 0.2);
  flex-wrap: wrap;
}

.form-actions.sticky {
  position: sticky;
  bottom: 0;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(20px);
  margin: 2rem -2rem -2rem;
  padding: 1.5rem 2rem;
  border-radius: 0 0 20px 20px;
  border-top: 1px solid rgba(79, 172, 254, 0.3);
}

.actions-left,
.actions-right {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.actions-right {
  margin-left: auto;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.5rem;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  white-space: nowrap;
}

.btn svg {
  width: 1.125rem;
  height: 1.125rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 172, 254, 0.4);
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1rem;
}

.btn-secondary {
  background: rgba(79, 172, 254, 0.1);
  border: 1px solid rgba(79, 172, 254, 0.3);
  color: #4facfe;
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(79, 172, 254, 0.2);
  border-color: rgba(79, 172, 254, 0.5);
}

.btn-ghost {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
}

.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
}

.btn-danger-outline {
  background: transparent;
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.btn-danger-outline:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.5);
}

.btn-danger {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}

.btn-danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.6);
}

/* Form Error */
.form-error {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  color: #fca5a5;
  margin: 1.5rem 0;
  animation: slideDown 0.3s ease;
}

.form-error svg {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.form-error p {
  margin: 0;
  font-size: 0.95rem;
}

/* Loading & Error States */
.loading-card,
.error-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  background: rgba(26, 26, 46, 0.6);
  border-radius: 16px;
  border: 1px solid rgba(79, 172, 254, 0.2);
  margin-bottom: 2rem;
}

.loading-icon {
  width: 2rem;
  height: 2rem;
  color: #4facfe;
  animation: spin 1s linear infinite;
}

.error-card {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.05);
}

.error-icon {
  width: 2rem;
  height: 2rem;
  color: #fca5a5;
  flex-shrink: 0;
}

.error-card h3 {
  font-size: 1.125rem;
  color: #fca5a5;
  margin: 0 0 0.5rem 0;
}

.error-card p {
  color: rgba(252, 165, 165, 0.8);
  margin: 0;
}

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: rgba(26, 26, 46, 0.6);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(79, 172, 254, 0.2);
  transition: all 0.3s ease;
  animation: slideUp 0.5s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  border-color: rgba(79, 172, 254, 0.4);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.stat-icon {
  width: 3.5rem;
  height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(79, 172, 254, 0.2) 0%, rgba(0, 242, 254, 0.2) 100%);
  border-radius: 14px;
  flex-shrink: 0;
}

.stat-icon svg {
  width: 1.75rem;
  height: 1.75rem;
  color: #4facfe;
}

.stat-content h3 {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ffffff 0%, #4facfe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 0.25rem 0;
}

.stat-content p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  margin: 0;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  border: 1px solid rgba(79, 172, 254, 0.3);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s ease;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(79, 172, 254, 0.2);
}

.modal-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: #fca5a5;
}

.modal-header h3 {
  font-size: 1.5rem;
  color: #ffffff;
  margin: 0;
}

.modal-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
}

.modal-text strong {
  color: #4facfe;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

/* Troubleshooting */
.troubleshooting {
  margin-top: 2rem;
  text-align: left;
}

.troubleshooting-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.troubleshooting-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.troubleshooting-toggle svg {
  width: 1.25rem;
  height: 1.25rem;
}

.troubleshooting-content {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: rgba(15, 15, 30, 0.6);
  border: 1px solid rgba(79, 172, 254, 0.2);
  border-radius: 12px;
  animation: slideDown 0.3s ease;
}

.troubleshooting-content h3 {
  color: #4facfe;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.troubleshooting-item {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(79, 172, 254, 0.1);
}

.troubleshooting-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.troubleshooting-item h4 {
  color: #ffffff;
  font-size: 1rem;
  margin-bottom: 0.75rem;
}

.troubleshooting-item p {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

.troubleshooting-item ul {
  margin: 0.75rem 0;
  padding-left: 1.5rem;
}

.troubleshooting-item li {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

.troubleshooting-item code {
  background: rgba(79, 172, 254, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  color: #4facfe;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.troubleshooting-item a {
  color: #4facfe;
  text-decoration: none;
  transition: color 0.3s ease;
}

.troubleshooting-item a:hover {
  color: #00f2fe;
  text-decoration: underline;
}

.client-id-display {
  display: block;
  margin: 0.5rem 0;
  padding: 0.75rem;
  background: rgba(15, 15, 30, 0.8);
  border-radius: 8px;
  word-break: break-all;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .controls-bar {
    flex-direction: column;
  }
  
  .search-box {
    width: 100%;
  }
  
  .filter-buttons {
    width: 100%;
    justify-content: space-between;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .termine-page {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-left,
  .header-right {
    width: 100%;
  }
  
  .header-title h1 {
    font-size: 1.75rem;
  }
  
  .view-tabs {
    flex-direction: column;
  }
  
  .calendar-days {
    grid-template-columns: repeat(7, 1fr);
  }
  
  .calendar-day {
    aspect-ratio: 1;
  }
  
  .day-event {
    font-size: 0.7rem;
  }
  
  .day-number {
    font-size: 0.875rem;
  }
  
  .event-card {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .event-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .event-form {
    padding: 1.5rem;
  }
  
  .form-actions.sticky {
    margin: 1.5rem -1.5rem -1.5rem;
    padding: 1rem 1.5rem;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}

/* Custom Dropdown Styles */
.custom-dropdown {
  position: relative;
  width: 100%;
}

.dropdown-trigger {
  width: 100%;
  padding: 0.875rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  font-size: 1rem;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-align: left;
}

.dropdown-trigger:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.dropdown-trigger:focus {
  outline: none;
  border-color: #4facfe;
  box-shadow: 0 0 0 3px rgba(79, 172, 254, 0.1);
}

.dropdown-trigger span {
  flex: 1;
}

.dropdown-arrow {
  transition: transform 0.3s ease;
  opacity: 0.7;
}

.dropdown-trigger:hover .dropdown-arrow {
  opacity: 1;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  background: rgba(26, 32, 44, 0.98);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  animation: dropdownSlideIn 0.2s ease;
}

@keyframes dropdownSlideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  width: 100%;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  border-radius: 12px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-align: left;
  font-size: 0.95rem;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.dropdown-item svg {
  opacity: 0.7;
}

.dropdown-item:hover svg {
  opacity: 1;
}

/* Reminders List Styles */
.reminders-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.reminder-item {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.reminder-item .custom-dropdown {
  flex: 1;
}

.remove-reminder-btn {
  padding: 0.875rem;
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid rgba(239, 68, 68, 0.2);
  border-radius: 12px;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.remove-reminder-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  transform: translateY(-2px);
}

.add-reminder-btn {
  width: 100%;
  padding: 0.875rem 1rem;
  background: rgba(79, 172, 254, 0.1);
  border: 2px dashed rgba(79, 172, 254, 0.3);
  border-radius: 12px;
  color: #4facfe;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
}

.add-reminder-btn:hover {
  background: rgba(79, 172, 254, 0.2);
  border-color: rgba(79, 172, 254, 0.5);
  transform: translateY(-2px);
}

/* Status Dot */
.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 0.5rem;
}

.status-dot.busy {
  background: #ef4444;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
}

.status-dot.free {
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
}

/* Timeline View Styles */
.timeline-content {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.timeline-container {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.timeline-day {
  position: relative;
}

.timeline-date-marker {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  position: relative;
}

.timeline-dot {
  width: 16px;
  height: 16px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(79, 172, 254, 0.2);
  flex-shrink: 0;
  z-index: 2;
}

.timeline-date-label h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.timeline-date-label p {
  font-size: 0.875rem;
  opacity: 0.7;
  margin: 0.25rem 0 0 0;
}

.timeline-events {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-left: 2rem;
  border-left: 2px solid rgba(255, 255, 255, 0.1);
  margin-left: 7px;
}

.timeline-event {
  display: flex;
  gap: 1.5rem;
  animation: fadeInUp 0.5s ease;
}

.timeline-event-time {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  height: fit-content;
  color: #4facfe;
}

.timeline-event-card {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  cursor: pointer;
}

.timeline-event-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateX(8px);
}

.timeline-event-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.timeline-event-header h4 {
  flex: 1;
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.timeline-actions {
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.timeline-event-card:hover .timeline-actions {
  opacity: 1;
}

.timeline-action-btn {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.timeline-action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.timeline-action-btn.delete {
  color: #ef4444;
}

.timeline-action-btn.delete:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
}

.timeline-event-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.timeline-location,
.timeline-description {
  display: flex;
  align-items: start;
  gap: 0.5rem;
  font-size: 0.9rem;
  opacity: 0.8;
  margin: 0;
}

.timeline-location svg {
  margin-top: 2px;
  flex-shrink: 0;
}

/* Tasks View Styles */
.tasks-content {
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

.tasks-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.add-task-btn {
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);
}

.add-task-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 172, 254, 0.4);
}

.task-input-container {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  animation: fadeInDown 0.3s ease;
}

.task-input {
  width: 100%;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 1rem;
  color: #fff;
  margin-bottom: 1rem;
}

.task-input:focus {
  outline: none;
  border-color: #4facfe;
  box-shadow: 0 0 0 3px rgba(79, 172, 254, 0.1);
}

.task-input-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.tasks-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.tasks-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
}

.tasks-section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.no-tasks {
  text-align: center;
  padding: 3rem 1rem;
  opacity: 0.5;
}

.no-tasks svg {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-tasks p {
  margin: 0;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  transition: all 0.3s ease;
  animation: fadeInUp 0.3s ease;
}

.task-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateX(4px);
}

.task-checkbox {
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: #fff;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.task-checkbox svg {
  font-size: 1.5rem;
}

.task-checkbox .unchecked {
  opacity: 0.3;
  transition: all 0.2s ease;
}

.task-checkbox:hover .unchecked {
  opacity: 0.6;
  color: #4facfe;
}

.task-checkbox .checked {
  color: #10b981;
}

.task-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.task-content span {
  font-size: 1rem;
  transition: all 0.3s ease;
}

.task-content span.completed {
  text-decoration: line-through;
  opacity: 0.5;
}

.task-edit-input {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(79, 172, 254, 0.3);
  border-radius: 8px;
  font-size: 1rem;
  color: #fff;
  font-family: inherit;
}

.task-edit-input:focus {
  outline: none;
  border-color: #4facfe;
}

.task-meta {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.task-date {
  font-size: 0.8rem;
  opacity: 0.5;
}

.task-actions {
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.task-item:hover .task-actions {
  opacity: 1;
}

.task-action-btn {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.task-action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.task-action-btn.delete {
  color: #ef4444;
}

.task-action-btn.delete:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
}

.task-item.completed {
  opacity: 0.7;
}

/* Task Form */
.task-form-container {
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  animation: fadeInDown 0.3s ease;
}

.task-form {
  max-width: 100%;
}

.form-subtitle {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* Task Filters */
.tasks-filters {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0.625rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #fff;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.filter-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.filter-btn.active {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border-color: #4facfe;
  box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);
}

/* Task Item Enhancements */
.task-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.task-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  transition: all 0.3s ease;
}

.task-title.completed {
  text-decoration: line-through;
  opacity: 0.5;
}

.task-description {
  font-size: 0.875rem;
  opacity: 0.7;
  margin: 0.5rem 0 0 0;
  line-height: 1.5;
}

.task-description.completed {
  text-decoration: line-through;
  opacity: 0.4;
}

.task-badges {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.task-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.task-badge svg {
  font-size: 0.875rem;
}

.task-badge.priority {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.task-badge.priority.priority-low {
  background: rgba(100, 116, 139, 0.1);
  border-color: rgba(100, 116, 139, 0.3);
  color: #94a3b8;
}

.task-badge.priority.priority-medium {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
  color: #60a5fa;
}

.task-badge.priority.priority-high {
  background: rgba(251, 146, 60, 0.1);
  border-color: rgba(251, 146, 60, 0.3);
  color: #fb923c;
}

.task-badge.priority.priority-urgent {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
  animation: pulse 2s ease-in-out infinite;
}

.task-badge.category {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: #a78bfa;
}

.task-badge.overdue {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.task-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.task-due,
.task-date {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8rem;
  opacity: 0.6;
}

.task-due svg,
.task-date svg {
  font-size: 0.875rem;
}

.task-tags {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}

.task-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.625rem;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  font-size: 0.75rem;
  color: #a78bfa;
}

.task-tag svg {
  font-size: 0.75rem;
}

.task-item.overdue {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.05);
}

.task-item.priority-urgent {
  border-left: 3px solid #ef4444;
}

.task-item.priority-high {
  border-left: 3px solid #fb923c;
}

.task-item.priority-medium {
  border-left: 3px solid #60a5fa;
}

.task-item.priority-low {
  border-left: 3px solid #94a3b8;
}

/* Pulse animation for urgent tasks */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Tab Badge */
.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: rgba(79, 172, 254, 0.2);
  border: 1px solid rgba(79, 172, 254, 0.3);
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #4facfe;
  margin-left: 0.5rem;
}
</style>
