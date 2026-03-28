<template>
  <div class="dashboard-container">
    <div class="greeting">
      <h1>
        <UIcon :name="greetingsIcon.icon" class="greeting-icon" />
        {{ greetingMessage }}, Philipp!
      </h1>
    </div>
    
    <div class="quick-stats">
      <!-- Weather Card -->
      <div class="stat-card weather-card" @click="navigateTo('/wetter')">
        <div class="card-icon-wrapper">
          <UIcon :name="weatherIcon" class="card-icon" />
        </div>
        <div class="card-content">
          <h3 class="card-title">Wetter</h3>
          <div class="card-info">
            <div class="info-main">{{ weatherTemp }}°C</div>
            <div class="info-sub">{{ weatherDescription }}</div>
            <div class="info-location">Leopoldshafen</div>
          </div>
          <div v-if="weatherError" class="card-error">
            <UIcon name="i-heroicons-alert-circle" class="error-icon" />
            <p>{{ weatherError }}</p>
          </div>
        </div>
        <div class="card-arrow">
          <UIcon name="i-heroicons-arrow-right" />
        </div>
      </div>

      <!-- Appointments Card -->
      <div class="stat-card calendar-card" @click="handleCalendarClick">
        <div class="card-icon-wrapper">
          <UIcon name="i-heroicons-calendar-days" class="card-icon" />
        </div>
        <div class="card-content">
          <h3 class="card-title">Termine Heute</h3>
          <div v-if="authError" class="card-error">
            <UIcon name="i-heroicons-alert-circle" class="error-icon" />
            <p>{{ authError }}</p>
          </div>
          <div v-else-if="!isAuthenticated" class="auth-needed">
            <button class="google-signin-btn" @click.stop="signIn">
              <UIcon name="i-heroicons-log-in" />
              <span>Anmelden</span>
            </button>
          </div>
          <div v-else-if="calendarError" class="card-error">
            <UIcon name="i-heroicons-alert-circle" class="error-icon" />
            <p>{{ calendarError }}</p>
          </div>
          <div v-else-if="isLoadingCalendar" class="card-loading">
            <UIcon name="i-heroicons-loader-2" class="loading-spinner" />
            <span>Laden...</span>
          </div>
          <div v-else-if="todayAppointments.length === 0" class="card-empty">
            <UIcon name="i-heroicons-calendar-check" />
            <span>Keine Termine</span>
          </div>
          <div v-else class="card-list">
            <div v-for="event in todayAppointments.slice(0, 3)" :key="event.id" class="list-item">
              <div class="item-time">{{ formatTime(event.start.dateTime) }}</div>
              <div class="item-title">{{ event.summary }}</div>
            </div>
            <div v-if="todayAppointments.length > 3" class="more-items">
              +{{ todayAppointments.length - 3 }} weitere
            </div>
          </div>
        </div>
        <div class="card-arrow">
          <UIcon name="i-heroicons-arrow-right" />
        </div>
      </div>

      <!-- Tasks Card -->
      <div class="stat-card tasks-card" @click="handleTasksClick">
        <div class="card-icon-wrapper">
          <UIcon name="i-heroicons-list-checks" class="card-icon" />
        </div>
        <div class="card-content">
          <h3 class="card-title">Aufgaben</h3>
          <div v-if="!isTasksAuthenticated" class="auth-needed">
            <button class="google-signin-btn" @click.stop="signInTasks">
              <UIcon name="i-heroicons-log-in" />
              <span>Anmelden</span>
            </button>
          </div>
          <div v-else-if="tasksError" class="card-error">
            <UIcon name="i-heroicons-alert-circle" class="error-icon" />
            <p>{{ tasksError }}</p>
            <div class="error-actions">
              <button v-if="tasksError.includes('anmelden')" class="error-retry-btn" @click.stop="signInTasks">
                <UIcon name="i-heroicons-refresh-cw" />
                Neu anmelden
              </button>
              <button class="error-help-btn" @click.stop="showTasksSetup = true">
                <UIcon name="i-heroicons-help-circle" />
                Hilfe
              </button>
            </div>
          </div>
          <div v-else-if="isLoadingTasks" class="card-loading">
            <UIcon name="i-heroicons-loader-2" class="loading-spinner" />
            <span>Laden...</span>
          </div>
          <div v-else-if="incompleteTasks.length === 0" class="card-empty">
            <UIcon name="i-heroicons-check-circle" />
            <span>Keine Aufgaben</span>
          </div>
          <div v-else class="card-list">
            <div v-for="task in incompleteTasks.slice(0, 3)" :key="task.id" class="list-item task-list-item">
              <div class="task-checkbox" @click.stop="toggleTask(task)">
                <UIcon name="i-heroicons-circle" />
              </div>
              <div class="item-title">{{ task.title }}</div>
            </div>
            <div v-if="incompleteTasks.length > 3" class="more-items">
              +{{ incompleteTasks.length - 3 }} weitere
            </div>
          </div>
        </div>
        <div class="card-arrow">
          <UIcon name="i-heroicons-arrow-right" />
        </div>
      </div>
    </div>

    <!-- Quick Navigation to New Features -->
    <div class="feature-nav-section">
      <div class="feature-nav-grid">
        <div class="feature-nav-card routine-nav" @click="navigateTo('/routinen')">
          <div class="fnav-icon">🌅</div>
          <div class="fnav-content">
            <h3>Routinen</h3>
            <p>Morgen · Mittag · Abend</p>
          </div>
          <UIcon name="i-heroicons-arrow-right" class="fnav-arrow" />
        </div>
        <div class="feature-nav-card habits-nav" @click="navigateTo('/gewohnheiten')">
          <div class="fnav-icon">🎯</div>
          <div class="fnav-content">
            <h3>Gewohnheiten</h3>
            <p>Habits & Streaks tracken</p>
          </div>
          <UIcon name="i-heroicons-arrow-right" class="fnav-arrow" />
        </div>
        <div class="feature-nav-card grades-nav" @click="navigateTo('/noten')">
          <div class="fnav-icon">📐</div>
          <div class="fnav-content">
            <h3>Noten</h3>
            <p>Fächer & Durchschnitt</p>
          </div>
          <UIcon name="i-heroicons-arrow-right" class="fnav-arrow" />
        </div>
      </div>
    </div>

    <!-- News Section -->
    <div class="news-section">
      <div class="section-header">
        <div class="header-left">
          <h2>
            <UIcon name="i-heroicons-newspaper" class="section-icon" />
            Top Nachrichten
          </h2>
          <span class="news-time">Letzte 24 Stunden</span>
        </div>
        <NuxtLink to="/nachrichten" class="view-all-btn">
          Alle anzeigen
          <UIcon name="i-heroicons-arrow-right" />
        </NuxtLink>
      </div>

      <div v-if="newsError" class="news-error">
        <UIcon name="i-heroicons-alert-circle" />
        <p>{{ newsError }}</p>
      </div>

      <div v-else-if="isLoadingNews" class="news-loading">
        <UIcon name="i-heroicons-loader-2" class="loading-spinner" />
        <span>Nachrichten werden geladen...</span>
      </div>

      <div v-else class="news-grid">
        <article 
          v-for="(article, index) in topNews" 
          :key="index" 
          class="news-card"
          @click="openNewsArticle(article.url)"
        >
          <div v-if="article.urlToImage" class="news-image">
            <img :src="article.urlToImage" :alt="article.title" />
            <div class="news-badge">{{ index + 1 }}</div>
          </div>
          <div class="news-content">
            <div class="news-source">
              <UIcon name="i-heroicons-radio" />
              <span>{{ article.source.name }}</span>
              <span class="news-dot">•</span>
              <span>{{ formatNewsTime(article.publishedAt) }}</span>
            </div>
            <h3 class="news-title">{{ article.title }}</h3>
            <p class="news-description">{{ article.description }}</p>
            <div class="news-footer">
              <span class="read-more">
                Weiterlesen
                <UIcon name="i-heroicons-arrow-right" />
              </span>
            </div>
          </div>
        </article>
      </div>
    </div>

    <!-- Daily Inspiration -->
    <div class="inspiration-section">
      <div class="inspiration-grid">
        <!-- Daily Prayer -->
        <div class="inspiration-card prayer-card">
          <div class="insp-header">
            <div class="insp-icon">🙏</div>
            <button class="insp-reset-btn" @click="refreshDailyPrayer" title="Neues Gebet"><UIcon name="i-heroicons-arrow-path" /></button>
          </div>
          <h3>Tagesgebet</h3>
          <p class="insp-text" v-if="dailyPrayer">{{ dailyPrayer.text }}</p>
          <p class="insp-source" v-if="dailyPrayer">— {{ dailyPrayer.reference }}</p>
          <div v-if="!dailyPrayer" class="insp-loading">Laden...</div>
        </div>
        <!-- Daily Fact -->
        <div class="inspiration-card fact-card">
          <div class="insp-header">
            <div class="insp-icon">💡</div>
            <button class="insp-reset-btn" @click="refreshDailyFact" title="Neuer Fakt"><UIcon name="i-heroicons-arrow-path" /></button>
          </div>
          <h3>Fakt des Tages</h3>
          <p class="insp-text" v-if="dailyFact">{{ dailyFact }}</p>
          <div v-if="!dailyFact" class="insp-loading">Laden...</div>
        </div>
        <!-- Joke of the Day -->
        <div class="inspiration-card joke-card">
          <div class="insp-header">
            <div class="insp-icon">😂</div>
            <button class="insp-reset-btn" @click="refreshDailyJoke" title="Neuer Witz"><UIcon name="i-heroicons-arrow-path" /></button>
          </div>
          <h3>Witz des Tages</h3>
          <p class="insp-text" v-if="dailyJoke">{{ dailyJoke }}</p>
          <div v-if="!dailyJoke" class="insp-loading">Laden...</div>
        </div>
      </div>
    </div>

    <!-- Finance/Crypto Dashboard -->
    <div class="finance-section">
      <div class="section-header">
        <h2>
          <UIcon name="i-heroicons-trending-up" class="section-icon" />
          Finanzen & Crypto
        </h2>
        <button @click="refreshCrypto" class="refresh-btn">
          <UIcon name="i-heroicons-refresh-cw" :class="{ 'spinning': isLoadingCrypto }" />
        </button>
      </div>

      <div v-if="cryptoError" class="crypto-error">
        <UIcon name="i-heroicons-alert-circle" />
        <p>{{ cryptoError }}</p>
      </div>

      <div v-else-if="isLoadingCrypto" class="crypto-loading">
        <UIcon name="i-heroicons-loader-2" class="loading-spinner" />
        <span>Lade Kursdaten...</span>
      </div>

      <div v-else class="crypto-grid">
        <div 
          v-for="coin in cryptoData" 
          :key="coin.id" 
          class="crypto-card"
          :class="{ 'positive': coin.price_change_percentage_24h > 0, 'negative': coin.price_change_percentage_24h < 0 }"
        >
          <div class="crypto-header">
            <img :src="coin.image" :alt="coin.name" class="crypto-icon" />
            <div class="crypto-info">
              <h4>{{ coin.name }}</h4>
              <span class="crypto-symbol">{{ coin.symbol.toUpperCase() }}</span>
            </div>
          </div>
          <div class="crypto-price">{{ formatCurrency(coin.current_price) }}</div>
          <div class="crypto-change" :class="{ 'positive': coin.price_change_percentage_24h > 0, 'negative': coin.price_change_percentage_24h < 0 }">
            <UIcon :name="coin.price_change_percentage_24h > 0 ? 'i-heroicons-trending-up' : 'i-heroicons-trending-down'" />
            <span>{{ coin.price_change_percentage_24h.toFixed(2) }}%</span>
          </div>
          <div class="crypto-market-cap">
            <span>Market Cap:</span>
            <span>{{ formatMarketCap(coin.market_cap) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Daily Tagebuch (Journal) -->
    <div class="journal-section">
      <div class="section-header">
        <h2>
          <UIcon name="i-heroicons-book-open" class="section-icon" />
          Tägliches Tagebuch
        </h2>
        <button @click="saveTodayEntry" class="save-journal-btn">
          <UIcon name="i-heroicons-arrow-down-tray" />
          Speichern
        </button>
      </div>

      <div class="journal-card">
        <div class="journal-date">
          <UIcon name="i-heroicons-calendar" />
          <span>{{ formatJournalDate(new Date()) }}</span>
        </div>
        <textarea 
          v-model="todayJournalEntry" 
          placeholder="Wie war dein Tag? Was hast du erlebt? Wofür bist du dankbar?"
          class="journal-textarea"
          rows="10"
        ></textarea>
        <div class="journal-stats">
          <span>{{ journalWordCount }} Wörter</span>
          <span v-if="lastSaved" class="last-saved">Zuletzt gespeichert: {{ lastSaved }}</span>
        </div>
      </div>

      <div class="journal-history">
        <h4>Letzte Einträge</h4>
        <div v-if="journalEntries.length === 0" class="journal-empty">
          <UIcon name="i-heroicons-file-text" />
          <p>Noch keine Einträge vorhanden</p>
        </div>
        <div v-else class="journal-entries">
          <div 
            v-for="entry in journalEntries.slice(0, 5)" 
            :key="entry.date"
            class="journal-entry-card"
            @click="viewEntry(entry)"
          >
            <div class="entry-date">{{ formatJournalDate(new Date(entry.date)) }}</div>
            <p class="entry-preview">{{ getPreview(entry.content) }}</p>
            <span class="entry-words">{{ countWords(entry.content) }} Wörter</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Meditation Timer -->
    <div class="meditation-section">
      <div class="section-header">
        <h2>
          <UIcon name="i-heroicons-flower" class="section-icon" />
          5 Minuten Meditation
        </h2>
      </div>

      <div class="meditation-card">
        <div class="meditation-circle">
          <svg viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" class="meditation-bg" />
            <circle 
              cx="100" 
              cy="100" 
              r="90" 
              class="meditation-progress"
              :style="{ strokeDashoffset: meditationProgress }"
            />
          </svg>
          <div class="meditation-time">{{ meditationDisplay }}</div>
        </div>

        <div class="meditation-status">
          <p v-if="!meditationRunning && meditationTime === 300">Bereit für deine Meditation?</p>
          <p v-else-if="meditationRunning">Atme tief ein und aus...</p>
          <p v-else-if="meditationTime === 0">Meditation beendet! 🙏</p>
        </div>

        <div class="meditation-controls">
          <button @click="startMeditation" v-if="!meditationRunning" class="meditation-btn start">
            <UIcon name="i-heroicons-play" />
            {{ meditationTime === 300 ? 'Start' : 'Fortsetzen' }}
          </button>
          <button @click="pauseMeditation" v-if="meditationRunning" class="meditation-btn pause">
            <UIcon name="i-heroicons-pause" />
            Pause
          </button>
          <button @click="resetMeditation" class="meditation-btn reset">
            <UIcon name="i-heroicons-rotate-ccw" />
            Reset
          </button>
        </div>

        <div class="meditation-stats">
          <div class="stat-item">
            <UIcon name="i-heroicons-check-circle" />
            <span>{{ meditationSessions }} Sessions heute</span>
          </div>
        </div>
      </div>
    </div>

    <!-- (Removed old book reader widget) -->

    <!-- View Journal Entry Modal -->
    <div v-if="viewingEntry" class="modal-overlay" @click="viewingEntry = null">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="modal-title">
            <UIcon name="i-heroicons-book-open" class="modal-icon" />
            <h3>{{ formatJournalDate(new Date(viewingEntry.date)) }}</h3>
          </div>
          <button class="modal-close" @click="viewingEntry = null">
            <UIcon name="i-heroicons-x-mark" />
          </button>
        </div>
        <div class="modal-body">
          <div class="journal-viewer">
            <p class="journal-content">{{ viewingEntry.content }}</p>
            <div class="journal-meta">
              <span>{{ countWords(viewingEntry.content) }} Wörter</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" @click="viewingEntry = null">Schließen</button>
        </div>
      </div>
    </div>

    <!-- Quote of the Day -->
    <div class="quote-section">
      <div class="quote-card">
        <button class="insp-reset-btn quote-reset-btn" @click="refreshDailyQuote" title="Neues Zitat"><UIcon name="i-heroicons-arrow-path" /></button>
        <UIcon name="i-heroicons-quote" class="quote-icon" />
        <p class="quote-text">"{{ dailyQuote.text }}"</p>
        <p class="quote-author">— {{ dailyQuote.author }}</p>
      </div>
    </div>

    <!-- Feature Navigation Grid -->
    <div class="feature-hub-section">
      <div class="section-header"><h2><UIcon name="i-heroicons-squares-2x2" class="section-icon" /> Alle Features</h2></div>
      <div class="feature-hub-grid">
        <div class="fhub-card" @click="navigateTo('/tagesplan')" style="--accent:#4facfe"><div class="fhub-icon">📅</div><h4>Tagesplan</h4><p>Zeitblöcke planen</p></div>
        <div class="fhub-card" @click="navigateTo('/todo')" style="--accent:#10b981"><div class="fhub-icon">✅</div><h4>Todo Liste</h4><p>2-Wochen Planer</p></div>
        <div class="fhub-card" @click="navigateTo('/fitness')" style="--accent:#ff6b35"><div class="fhub-icon">🏋️</div><h4>Fitness</h4><p>Workouts & Gewicht</p></div>
        <div class="fhub-card" @click="navigateTo('/finanzen')" style="--accent:#ffd93d"><div class="fhub-icon">💰</div><h4>Finanzen</h4><p>Budget & Ausgaben</p></div>
        <div class="fhub-card" @click="navigateTo('/glowup')" style="--accent:#ff9ff3"><div class="fhub-icon">✨</div><h4>Glowup</h4><p>Selfies & Tracking</p></div>
        <div class="fhub-card" @click="navigateTo('/buecher')" style="--accent:#e056fd"><div class="fhub-icon">📖</div><h4>Bücher</h4><p>Lesen & Tracker</p></div>
        <div class="fhub-card" @click="navigateTo('/routinen')" style="--accent:#a29bfe"><div class="fhub-icon">🌅</div><h4>Routinen</h4><p>Morgen · Mittag · Abend</p></div>
        <div class="fhub-card" @click="navigateTo('/gewohnheiten')" style="--accent:#54a0ff"><div class="fhub-icon">🎯</div><h4>Gewohnheiten</h4><p>Habits & Streaks</p></div>
        <div class="fhub-card" @click="navigateTo('/noten')" style="--accent:#ff6b6b"><div class="fhub-icon">📐</div><h4>Noten</h4><p>Fächer & Schnitt</p></div>
      </div>
    </div>

    <!-- (Removed Quick Tools - replaced with Feature Hub above) -->
    <div style="display:none">
      <div class="section-header">
        <h2>
          <UIcon name="i-heroicons-wrench" class="section-icon" />
          Quick Tools
        </h2>
      </div>

      <div class="tools-grid">
        <!-- Calculator -->
        <div class="tool-card calculator-card">
          <div class="tool-header">
            <UIcon name="i-heroicons-calculator" />
            <h4>Rechner</h4>
          </div>
          <div class="calculator-display">{{ calcDisplay }}</div>
          <div class="calculator-buttons">
            <button @click="calcInput('7')" class="calc-btn">7</button>
            <button @click="calcInput('8')" class="calc-btn">8</button>
            <button @click="calcInput('9')" class="calc-btn">9</button>
            <button @click="calcInput('/')" class="calc-btn operator">÷</button>
            <button @click="calcInput('4')" class="calc-btn">4</button>
            <button @click="calcInput('5')" class="calc-btn">5</button>
            <button @click="calcInput('6')" class="calc-btn">6</button>
            <button @click="calcInput('*')" class="calc-btn operator">×</button>
            <button @click="calcInput('1')" class="calc-btn">1</button>
            <button @click="calcInput('2')" class="calc-btn">2</button>
            <button @click="calcInput('3')" class="calc-btn">3</button>
            <button @click="calcInput('-')" class="calc-btn operator">−</button>
            <button @click="calcClear" class="calc-btn clear">C</button>
            <button @click="calcInput('0')" class="calc-btn">0</button>
            <button @click="calcEqual" class="calc-btn equals">=</button>
            <button @click="calcInput('+')" class="calc-btn operator">+</button>
          </div>
        </div>

        <!-- Birthday Reminders -->
        <div class="tool-card birthday-card">
          <div class="tool-header">
            <UIcon name="i-heroicons-cake" />
            <h4>Geburtstage</h4>
          </div>
          <div v-if="upcomingBirthdays.length === 0" class="tool-empty">
            <UIcon name="i-heroicons-calendar" />
            <p>Keine Geburtstage in den nächsten 30 Tagen</p>
          </div>
          <div v-else class="birthday-list">
            <div v-for="birthday in upcomingBirthdays" :key="birthday.id" class="birthday-item">
              <div class="birthday-date">
                <span class="day">{{ birthday.day }}</span>
                <span class="month">{{ birthday.month }}</span>
              </div>
              <div class="birthday-info">
                <span class="name">{{ birthday.name }}</span>
                <span class="days-left">in {{ birthday.daysUntil }} Tagen</span>
              </div>
            </div>
          </div>
          <button @click="showAddBirthday = true" class="tool-action-btn">
            <UIcon name="i-heroicons-plus" />
            Geburtstag hinzufügen
          </button>
        </div>

        <!-- Step Counter -->
        <div class="tool-card steps-card">
          <div class="tool-header">
            <UIcon name="i-heroicons-footprints" />
            <h4>Schritte Heute</h4>
          </div>
          <div class="steps-display">
            <div class="steps-circle">
              <svg viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" class="steps-bg" />
                <circle 
                  cx="60" 
                  cy="60" 
                  r="54" 
                  class="steps-progress"
                  :style="{ strokeDashoffset: stepsProgress }"
                />
              </svg>
              <div class="steps-count">
                <span class="steps-number">{{ currentSteps }}</span>
                <span class="steps-label">Schritte</span>
              </div>
            </div>
          </div>
          <div class="steps-goal">
            <span>Ziel: {{ stepsGoal }} Schritte</span>
            <span class="steps-percentage">{{ stepsPercentage }}%</span>
          </div>
          <div class="step-controls">
            <button @click="addSteps(1000)" class="step-btn">+1k</button>
            <button @click="addSteps(500)" class="step-btn">+500</button>
            <button @click="resetSteps" class="step-btn reset">Reset</button>
          </div>
        </div>

        <!-- Currency Converter -->
        <div class="tool-card currency-card">
          <div class="tool-header">
            <UIcon name="i-heroicons-coins" />
            <h4>Währungsrechner</h4>
          </div>
          <div class="currency-converter">
            <div class="currency-input-group">
              <input v-model.number="currencyAmount" type="number" placeholder="Betrag" class="currency-input" />
              <select v-model="fromCurrency" class="currency-select">
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
                <option value="CHF">CHF</option>
              </select>
            </div>
            <button @click="swapCurrencies" class="swap-btn">
              <UIcon name="i-heroicons-arrow-left-right" />
            </button>
            <div class="currency-input-group">
              <input :value="convertedAmount" readonly class="currency-input result" />
              <select v-model="toCurrency" class="currency-select">
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
                <option value="CHF">CHF</option>
              </select>
            </div>
          </div>
          <div class="exchange-rate">
            1 {{ fromCurrency}} = {{ exchangeRate.toFixed(4) }} {{ toCurrency }}
          </div>
        </div>
      </div>
    </div>

    <!-- Add Birthday Modal -->
    <div v-if="showAddBirthday" class="modal-overlay" @click="showAddBirthday = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="modal-title">
            <UIcon name="i-heroicons-cake" class="modal-icon" />
            <h3>Geburtstag hinzufügen</h3>
          </div>
          <button class="modal-close" @click="showAddBirthday = false">
            <UIcon name="i-heroicons-x-mark" />
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Name</label>
            <input v-model="newBirthday.name" type="text" placeholder="Name" class="habit-input" />
          </div>
          <div class="form-group">
            <label>Datum</label>
            <input v-model="newBirthday.date" type="date" class="habit-input" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showAddBirthday = false">Abbrechen</button>
          <button class="btn-primary" @click="addBirthday">
            <UIcon name="i-heroicons-plus" />
            Hinzufügen
          </button>
        </div>
      </div>
    </div>

    <!-- Detailed Weather Section -->
    <div class="detailed-weather-section">
      <div class="section-header">
        <h2>
          <UIcon name="i-heroicons-cloud-sun" class="section-icon" />
          Detailliertes Wetter & Luftqualität
        </h2>
      </div>

      <div v-if="weatherError" class="weather-detail-error">
        <UIcon name="i-heroicons-alert-circle" />
        <p>{{ weatherError }}</p>
      </div>

      <div v-else-if="isLoading" class="weather-detail-loading">
        <UIcon name="i-heroicons-loader-2" class="loading-spinner" />
        <span>Wetterdaten werden geladen...</span>
      </div>

      <div v-else-if="weatherData" class="weather-detail-grid">
        <div class="weather-main-card">
          <div class="weather-main-info">
            <UIcon :name="weatherIcon" class="weather-main-icon" />
            <div class="weather-main-temp">
              <span class="temp-value">{{ weatherTemp }}°C</span>
              <span class="temp-feels">Gefühlt {{ Math.round(weatherData.current.feelslike_c) }}°C</span>
            </div>
          </div>
          <div class="weather-main-desc">{{ weatherDescription }}</div>
        </div>

        <div class="weather-info-card">
          <div class="weather-info-item">
            <UIcon name="i-heroicons-droplets" />
            <div>
              <span class="info-label">Luftfeuchtigkeit</span>
              <span class="info-value">{{ weatherData.current.humidity }}%</span>
            </div>
          </div>
          <div class="weather-info-item">
            <UIcon name="i-heroicons-wind" />
            <div>
              <span class="info-label">Wind</span>
              <span class="info-value">{{ weatherData.current.wind_kph }} km/h</span>
            </div>
          </div>
        </div>

        <div class="weather-info-card">
          <div class="weather-info-item">
            <UIcon name="i-heroicons-gauge" />
            <div>
              <span class="info-label">Luftdruck</span>
              <span class="info-value">{{ weatherData.current.pressure_mb }} mb</span>
            </div>
          </div>
          <div class="weather-info-item">
            <UIcon name="i-heroicons-eye" />
            <div>
              <span class="info-label">Sichtweite</span>
              <span class="info-value">{{ weatherData.current.vis_km }} km</span>
            </div>
          </div>
        </div>

        <div class="air-quality-card" v-if="weatherData.current.air_quality">
          <div class="aqi-header">
            <UIcon name="i-heroicons-wind" />
            <h4>Luftqualität</h4>
          </div>
          <div class="aqi-value" :class="getAqiClass(weatherData.current.air_quality['us-epa-index'])">
            {{ getAqiLabel(weatherData.current.air_quality['us-epa-index']) }}
          </div>
          <div class="aqi-details">
            <div class="aqi-detail">
              <span>PM2.5</span>
              <span>{{ Math.round(weatherData.current.air_quality.pm2_5) }}</span>
            </div>
            <div class="aqi-detail">
              <span>PM10</span>
              <span>{{ Math.round(weatherData.current.air_quality.pm10) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- (Pomodoro removed) -->

    <!-- Tasks Setup Modal -->
    <div v-if="showTasksSetup" class="modal-overlay" @click="showTasksSetup = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="modal-title">
            <UIcon name="i-heroicons-settings" class="modal-icon" />
            <h3>Google Tasks API aktivieren</h3>
          </div>
          <button class="modal-close" @click="showTasksSetup = false">
            <UIcon name="i-heroicons-x-mark" />
          </button>
        </div>
        
        <div class="modal-body">
          <div class="setup-step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>Google Cloud Console öffnen</h4>
              <p>Gehe zu <a href="https://console.cloud.google.com/apis/library/tasks.googleapis.com" target="_blank" class="setup-link">Google Cloud Console</a></p>
            </div>
          </div>

          <div class="setup-step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>Google Tasks API aktivieren</h4>
              <p>Klicke auf den Button "AKTIVIEREN" (oder "ENABLE")</p>
            </div>
          </div>

          <div class="setup-step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h4>Warte kurz</h4>
              <p>Die Aktivierung kann 1-2 Minuten dauern</p>
            </div>
          </div>

          <div class="setup-step">
            <div class="step-number">4</div>
            <div class="step-content">
              <h4>Erneut anmelden</h4>
              <p>Komm zurück und melde dich erneut an</p>
            </div>
          </div>

          <div class="setup-note">
            <UIcon name="i-heroicons-info" />
            <p><strong>Hinweis:</strong> Du benötigst Admin-Zugriff auf dein Google Cloud Projekt</p>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="showTasksSetup = false">
            Schließen
          </button>
          <a 
            href="https://console.cloud.google.com/apis/library/tasks.googleapis.com" 
            target="_blank" 
            class="btn-primary"
          >
            <UIcon name="i-heroicons-external-link" />
            Zur Console
          </a>
        </div>
      </div>
    </div>

  </div>
</template>
<script setup>
const config = useRuntimeConfig();

const greetingsIcon = computed(() => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) {
    return { icon: 'i-heroicons-hand-wave', message: 'Guten Morgen' };
  } else if (hour >= 10 && hour < 12) {
    return { icon: 'i-heroicons-sun', message: 'Guten Vormittag' };
  } else if (hour >= 12 && hour < 16) {
    return { icon: 'i-heroicons-sun', message: 'Guten Mittag' };
  } else if (hour >= 16 && hour < 18) {
    return { icon: 'i-heroicons-sun', message: 'Guten Nachmittag' };
  } else if (hour >= 18 && hour < 22) {
    return { icon: 'i-heroicons-moon', message: 'Guten Abend' };
  } else {
    return { icon: 'i-heroicons-bed', message: 'Gute Nacht' };
  }
});
const greetingMessage = computed(() => greetingsIcon.value.message);

// WeatherAPI.com configuration
const WEATHER_API_KEY = config.public.weatherApiKey;
const CITY = 'Leopoldshafen';

// NewsAPI configuration
const NEWS_API_KEY = '1ab37bb60011434a846cb415fe0f8eef';

// News data
const topNews = ref([]);
const newsError = ref('');
const isLoadingNews = ref(false);

// Weather data
const weatherData = ref(null);
const weatherError = ref('');
const isLoading = ref(false);

const weatherTemp = computed(() => {
  if (isLoading.value) return '--';
  if (!weatherData.value) return '--';
  return Math.round(weatherData.value.current.temp_c);
});

const weatherDescription = computed(() => {
  if (isLoading.value) return 'Laden...';
  if (weatherError.value) return '';
  if (!weatherData.value) return 'Keine Daten';
  return weatherData.value.current.condition.text;
});

const weatherIcon = computed(() => {
  if (!weatherData.value) return 'i-heroicons-thermometer';
  const code = weatherData.value.current.condition.code;
  const isDay = weatherData.value.current.is_day === 1;
  
  // Thunderstorm
  if ([1087, 1273, 1276, 1279, 1282].includes(code)) return 'i-heroicons-cloud-lightning';
  // Rain
  if ([1063, 1150, 1153, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246].includes(code)) return 'i-heroicons-cloud-rain';
  // Drizzle
  if ([1072, 1168, 1171].includes(code)) return 'i-heroicons-cloud-drizzle';
  // Snow
  if ([1066, 1114, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258].includes(code)) return 'i-heroicons-snowflake';
  // Sleet
  if ([1069, 1204, 1207, 1237, 1249, 1252, 1261, 1264].includes(code)) return 'i-heroicons-cloud-snow';
  // Fog/Mist
  if ([1030, 1135, 1147].includes(code)) return 'i-heroicons-cloud-fog';
  // Cloudy
  if ([1006, 1009].includes(code)) return 'i-heroicons-cloud';
  // Partly cloudy
  if (code === 1003) return isDay ? 'i-heroicons-cloud-sun' : 'i-heroicons-cloud-moon';
  // Clear
  if (code === 1000) return isDay ? 'i-heroicons-sun' : 'i-heroicons-moon';
  
  return 'i-heroicons-thermometer';
});

// Fetch weather data
const fetchWeather = async () => {
  if (!WEATHER_API_KEY) {
    weatherError.value = 'API-Schlüssel nicht konfiguriert';
    return;
  }

  try {
    isLoading.value = true;
    weatherError.value = '';
    
    const response = await $fetch(
      `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${CITY}&lang=de&aqi=yes`
    );
    weatherData.value = response;
  } catch (error) {
    console.error('Fehler beim Abrufen der Wetterdaten:', error);
    
    if (error.status === 401 || error.status === 403) {
      weatherError.value = 'API-Schlüssel ungültig';
    } else if (error.status === 400) {
      weatherError.value = 'Stadt nicht gefunden';
    } else {
      weatherError.value = 'Wetterdaten nicht verfügbar';
    }
  } finally {
    isLoading.value = false;
  }
};

// Air Quality Index helpers
const getAqiClass = (index) => {
  if (!index) return 'aqi-unknown';
  if (index === 1) return 'aqi-good';
  if (index === 2) return 'aqi-moderate';
  if (index === 3) return 'aqi-unhealthy-sensitive';
  if (index === 4) return 'aqi-unhealthy';
  if (index >= 5) return 'aqi-hazardous';
  return 'aqi-unknown';
};

const getAqiLabel = (index) => {
  if (!index) return 'Unbekannt';
  if (index === 1) return 'Gut';
  if (index === 2) return 'Mäßig';
  if (index === 3) return 'Ungesund für empfindliche Gruppen';
  if (index === 4) return 'Ungesund';
  if (index >= 5) return 'Sehr ungesund';
  return 'Unbekannt';
};

// Countdown Timer
const countdownMinutes = ref(5);
const countdownSeconds = ref(0);
const countdownTime = ref(0);
const countdownRunning = ref(false);
const countdownInterval = ref(null);

const countdownDisplay = computed(() => {
  const mins = Math.floor(countdownTime.value / 60);
  const secs = countdownTime.value % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
});

const startCountdown = () => {
  if (countdownTime.value === 0) {
    countdownTime.value = (countdownMinutes.value * 60) + countdownSeconds.value;
  }
  if (countdownTime.value === 0) return;
  
  countdownRunning.value = true;
  countdownInterval.value = setInterval(() => {
    countdownTime.value--;
    if (countdownTime.value <= 0) {
      pauseCountdown();
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Countdown beendet!');
      }
    }
  }, 1000);
};

const pauseCountdown = () => {
  countdownRunning.value = false;
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value);
  }
};

const resetCountdown = () => {
  pauseCountdown();
  countdownTime.value = 0;
};

// Stopwatch
const stopwatchTime = ref(0);
const stopwatchRunning = ref(false);
const stopwatchInterval = ref(null);

const stopwatchDisplay = computed(() => {
  const mins = Math.floor(stopwatchTime.value / 60);
  const secs = stopwatchTime.value % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
});

const startStopwatch = () => {
  stopwatchRunning.value = true;
  stopwatchInterval.value = setInterval(() => {
    stopwatchTime.value++;
  }, 1000);
};

const pauseStopwatch = () => {
  stopwatchRunning.value = false;
  if (stopwatchInterval.value) {
    clearInterval(stopwatchInterval.value);
  }
};

const resetStopwatch = () => {
  pauseStopwatch();
  stopwatchTime.value = 0;
};

// ====================
// CRYPTO/FINANCE
// ====================
const cryptoData = ref([]);
const cryptoError = ref('');
const isLoadingCrypto = ref(false);

const fetchCrypto = async () => {
  try {
    isLoadingCrypto.value = true;
    cryptoError.value = '';
    
    const response = await $fetch('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'eur',
        ids: 'bitcoin,ethereum,binancecoin,cardano,solana,ripple',
        order: 'market_cap_desc',
        sparkline: false
      }
    });
    
    cryptoData.value = response;
  } catch (error) {
    console.error('Crypto fetch error:', error);
    cryptoError.value = 'Kursdaten konnten nicht geladen werden';
  } finally {
    isLoadingCrypto.value = false;
  }
};

const refreshCrypto = () => {
  fetchCrypto();
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
};

const formatMarketCap = (value) => {
  if (value >= 1e12) return `€${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `€${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `€${(value / 1e6).toFixed(2)}M`;
  return `€${value.toFixed(2)}`;
};

// ====================
// DAILY JOURNAL (TAGEBUCH)
// ====================
const todayJournalEntry = ref('');
const journalEntries = ref([]);
const lastSaved = ref('');
const viewingEntry = ref(null);

const journalWordCount = computed(() => {
  return countWords(todayJournalEntry.value);
});

const countWords = (text) => {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
};

const getPreview = (text) => {
  const preview = text.substring(0, 150);
  return text.length > 150 ? preview + '...' : preview;
};

const formatJournalDate = (date) => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('de-DE', options);
};

const loadJournalEntries = () => {
  const saved = localStorage.getItem('dashboard_journal_entries');
  if (saved) {
    journalEntries.value = JSON.parse(saved);
  }
  
  // Load today's entry
  const today = new Date().toISOString().split('T')[0];
  const todayEntry = journalEntries.value.find(e => e.date === today);
  if (todayEntry) {
    todayJournalEntry.value = todayEntry.content;
  }
};

const saveTodayEntry = () => {
  const today = new Date().toISOString().split('T')[0];
  const existingIndex = journalEntries.value.findIndex(e => e.date === today);
  
  const entry = {
    date: today,
    content: todayJournalEntry.value,
    timestamp: new Date().toISOString()
  };
  
  if (existingIndex > -1) {
    journalEntries.value[existingIndex] = entry;
  } else {
    journalEntries.value.unshift(entry);
  }
  
  localStorage.setItem('dashboard_journal_entries', JSON.stringify(journalEntries.value));
  
  const now = new Date();
  lastSaved.value = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  
  setTimeout(() => {
    lastSaved.value = '';
  }, 5000);
};

const viewEntry = (entry) => {
  viewingEntry.value = entry;
};

// ====================
// MEDITATION TIMER (5 MINUTES)
// ====================
const meditationTime = ref(300); // 5 minutes in seconds
const meditationRunning = ref(false);
const meditationInterval = ref(null);
const meditationSessions = ref(0);

const meditationDisplay = computed(() => {
  const mins = Math.floor(meditationTime.value / 60);
  const secs = meditationTime.value % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
});

const meditationProgress = computed(() => {
  const total = 300;
  const progress = meditationTime.value / total;
  const circumference = 2 * Math.PI * 90;
  return circumference - (progress * circumference);
});

const startMeditation = () => {
  meditationRunning.value = true;
  meditationInterval.value = setInterval(() => {
    meditationTime.value--;
    if (meditationTime.value <= 0) {
      pauseMeditation();
      meditationSessions.value++;
      saveMeditationSessions();
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Meditation beendet! 🙏', {
          body: 'Gut gemacht! Du hast 5 Minuten meditiert.'
        });
      }
    }
  }, 1000);
};

const pauseMeditation = () => {
  meditationRunning.value = false;
  if (meditationInterval.value) {
    clearInterval(meditationInterval.value);
  }
};

const resetMeditation = () => {
  pauseMeditation();
  meditationTime.value = 300;
};

const loadMeditationSessions = () => {
  const today = new Date().toDateString();
  const savedDate = localStorage.getItem('meditation_date');
  
  if (savedDate === today) {
    const saved = localStorage.getItem('meditation_sessions');
    if (saved) {
      meditationSessions.value = parseInt(saved);
    }
  } else {
    meditationSessions.value = 0;
    localStorage.setItem('meditation_date', today);
  }
};

const saveMeditationSessions = () => {
  localStorage.setItem('meditation_sessions', meditationSessions.value.toString());
};

// ====================
// DAILY BOOK READER (5 PAGES)
// ====================
const currentBook = ref({
  title: 'Dein Buch',
  author: 'Unbekannt',
  totalPages: 300,
  currentPage: 1
});

const todayPagesRead = ref(0);
const readingStreak = ref(0);
const totalPagesRead = ref(0);
const booksCompleted = ref(0);
const showBookSelector = ref(false);

const newBook = ref({
  title: '',
  author: '',
  totalPages: 0,
  currentPage: 1
});

const bookProgressPercent = computed(() => {
  return Math.round((currentBook.value.currentPage / currentBook.value.totalPages) * 100);
});

const loadBookData = () => {
  const saved = localStorage.getItem('dashboard_current_book');
  if (saved) {
    currentBook.value = JSON.parse(saved);
  }
  
  const statsStr = localStorage.getItem('dashboard_reading_stats');
  if (statsStr) {
    const stats = JSON.parse(statsStr);
    readingStreak.value = stats.streak || 0;
    totalPagesRead.value = stats.totalPages || 0;
    booksCompleted.value = stats.booksCompleted || 0;
  }
  
  // Load today's pages
  const today = new Date().toDateString();
  const savedDate = localStorage.getItem('reading_date');
  
  if (savedDate === today) {
    const saved = localStorage.getItem('today_pages_read');
    if (saved) {
      todayPagesRead.value = parseInt(saved);
    }
  } else {
    todayPagesRead.value = 0;
    localStorage.setItem('reading_date', today);
  }
};

const saveBookData = () => {
  localStorage.setItem('dashboard_current_book', JSON.stringify(currentBook.value));
  localStorage.setItem('today_pages_read', todayPagesRead.value.toString());
  
  const stats = {
    streak: readingStreak.value,
    totalPages: totalPagesRead.value,
    booksCompleted: booksCompleted.value
  };
  localStorage.setItem('dashboard_reading_stats', JSON.stringify(stats));
};

const markPagesRead = (pages) => {
  todayPagesRead.value += pages;
  currentBook.value.currentPage += pages;
  totalPagesRead.value += pages;
  
  // Check if book is finished
  if (currentBook.value.currentPage >= currentBook.value.totalPages) {
    currentBook.value.currentPage = currentBook.value.totalPages;
    booksCompleted.value++;
    alert(`Glückwunsch! Du hast "${currentBook.value.title}" beendet! 📚`);
  }
  
  // Update streak
  if (todayPagesRead.value >= 5) {
    readingStreak.value++;
  }
  
  saveBookData();
};

const selectBook = () => {
  if (!newBook.value.title || !newBook.value.totalPages) return;
  
  currentBook.value = {
    title: newBook.value.title,
    author: newBook.value.author,
    totalPages: newBook.value.totalPages,
    currentPage: newBook.value.currentPage || 1
  };
  
  saveBookData();
  showBookSelector.value = false;
  newBook.value = {
    title: '',
    author: '',
    totalPages: 0,
    currentPage: 1
  };
};

// ====================
// QUOTE OF THE DAY
// ====================
const dailyQuote = ref({
  text: 'Die Zukunft gehört denen, die an die Schönheit ihrer Träume glauben.',
  author: 'Eleanor Roosevelt'
});

const quotes = [
  { text: 'Die Zukunft gehört denen, die an die Schönheit ihrer Träume glauben.', author: 'Eleanor Roosevelt' },
  { text: 'Der einzige Weg, großartige Arbeit zu leisten, ist zu lieben, was man tut.', author: 'Steve Jobs' },
  { text: 'Erfolg ist nicht der Schlüssel zum Glück. Glück ist der Schlüssel zum Erfolg.', author: 'Albert Schweitzer' },
  { text: 'Das Leben ist das, was passiert, während du eifrig dabei bist, andere Pläne zu machen.', author: 'John Lennon' },
  { text: 'Glaube an dich selbst und alles ist möglich.', author: 'Unknown' }
];

const setDailyQuote = (force = false) => {
  const today = new Date().toDateString();
  const savedDate = localStorage.getItem('quote_date');
  
  if (force || savedDate !== today) {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    dailyQuote.value = randomQuote;
    localStorage.setItem('quote_date', today);
    localStorage.setItem('daily_quote', JSON.stringify(randomQuote));
  } else {
    const saved = localStorage.getItem('daily_quote');
    if (saved) {
      dailyQuote.value = JSON.parse(saved);
    }
  }
};

const refreshDailyQuote = () => setDailyQuote(true);

// ====================
// DAILY PRAYER & FACT
// ====================
const dailyPrayer = ref(null);
const dailyFact = ref('');

const prayerVerses = [
  { text: 'Denn ich weiß wohl, was ich für Gedanken über euch habe, spricht der HERR: Gedanken des Friedens und nicht des Leides, dass ich euch gebe Zukunft und Hoffnung.', reference: 'Jeremia 29:11' },
  { text: 'Fürchte dich nicht, denn ich bin mit dir; sei nicht ängstlich, denn ich bin dein Gott. Ich stärke dich, ich helfe dir auch.', reference: 'Jesaja 41:10' },
  { text: 'Alle Dinge sind möglich dem, der da glaubt.', reference: 'Markus 9:23' },
  { text: 'Der HERR ist mein Hirte, mir wird nichts mangeln.', reference: 'Psalm 23:1' },
  { text: 'Befiehl dem HERRN deine Wege und hoffe auf ihn, er wird es wohl machen.', reference: 'Psalm 37:5' },
  { text: 'Seid stark und mutig! Fürchtet euch nicht und erschreckt nicht vor ihnen! Denn der HERR, dein Gott, er ist es, der mit dir geht.', reference: '5. Mose 31:6' },
  { text: 'Ich vermag alles durch den, der mich mächtig macht.', reference: 'Philipper 4:13' },
  { text: 'Kommt her zu mir, alle, die ihr mühselig und beladen seid; ich will euch erquicken.', reference: 'Matthäus 11:28' },
  { text: 'Denn Gott hat uns nicht gegeben den Geist der Furcht, sondern der Kraft und der Liebe und der Besonnenheit.', reference: '2. Timotheus 1:7' },
  { text: 'Der HERR segne dich und behüte dich. Der HERR lasse sein Angesicht leuchten über dir und sei dir gnädig.', reference: '4. Mose 6:24-25' },
  { text: 'Wirf dein Anliegen auf den HERRN; der wird dich versorgen.', reference: 'Psalm 55:23' },
  { text: 'Er gibt dem Müden Kraft und Stärke genug dem Unvermögenden.', reference: 'Jesaja 40:29' },
  { text: 'In der Welt habt ihr Angst; aber seid getrost, ich habe die Welt überwunden.', reference: 'Johannes 16:33' },
  { text: 'Denn wo zwei oder drei versammelt sind in meinem Namen, da bin ich mitten unter ihnen.', reference: 'Matthäus 18:20' },
];

const loadDailyPrayer = (force = false) => {
  const today = new Date().toDateString();
  const savedDate = localStorage.getItem('prayer_date');
  if (!force && savedDate === today) {
    const saved = localStorage.getItem('daily_prayer');
    if (saved) {
      dailyPrayer.value = JSON.parse(saved);
      return;
    }
  }
  const prayer = prayerVerses[Math.floor(Math.random() * prayerVerses.length)];
  dailyPrayer.value = prayer;
  localStorage.setItem('prayer_date', today);
  localStorage.setItem('daily_prayer', JSON.stringify(prayer));
};

const refreshDailyPrayer = () => loadDailyPrayer(true);

const loadDailyFact = async (force = false) => {
  const today = new Date().toDateString();
  const savedDate = localStorage.getItem('fact_date');
  if (!force && savedDate === today) {
    dailyFact.value = localStorage.getItem('daily_fact') || '';
    if (dailyFact.value) return;
  }
  try {
    const r = await $fetch('https://uselessfacts.jsph.pl/api/v2/facts/random?language=de');
    dailyFact.value = r.text;
    localStorage.setItem('fact_date', today);
    localStorage.setItem('daily_fact', r.text);
  } catch (e) {
    console.error('Fact fetch error:', e);
    dailyFact.value = 'Wusstest du? Honig wird nie schlecht. Archäologen haben 3000 Jahre alten Honig in ägyptischen Gräbern gefunden, der immer noch essbar war.';
  }
};

const refreshDailyFact = () => loadDailyFact(true);

const dailyJoke = ref('');

const loadDailyJoke = async (force = false) => {
  const today = new Date().toDateString();
  const savedDate = localStorage.getItem('joke_date');
  if (!force && savedDate === today) {
    dailyJoke.value = localStorage.getItem('daily_joke') || '';
    if (dailyJoke.value) return;
  }
  try {
    const r = await $fetch('https://v2.jokeapi.dev/joke/Any?lang=de&type=single');
    dailyJoke.value = r.joke || 'Warum können Geister so schlecht lügen? Weil man durch sie hindurchsehen kann!';
    localStorage.setItem('joke_date', today);
    localStorage.setItem('daily_joke', dailyJoke.value);
  } catch(e) {
    dailyJoke.value = 'Warum können Geister so schlecht lügen? Weil man durch sie hindurchsehen kann!';
  }
};

const refreshDailyJoke = () => loadDailyJoke(true);

// ====================
// CALCULATOR
// ====================
const calcDisplay = ref('0');
const calcCurrentValue = ref('');
const calcOperator = ref('');
const calcPrevValue = ref('');

const calcInput = (value) => {
  if (calcDisplay.value === '0' || calcDisplay.value === 'Error') {
    calcDisplay.value = value;
  } else {
    calcDisplay.value += value;
  }
};

const calcClear = () => {
  calcDisplay.value = '0';
  calcCurrentValue.value = '';
  calcOperator.value = '';
  calcPrevValue.value = '';
};

const calcEqual = () => {
  try {
    const result = eval(calcDisplay.value);
    calcDisplay.value = result.toString();
  } catch (error) {
    calcDisplay.value = 'Error';
  }
};

// ====================
// BIRTHDAY REMINDERS
// ====================
const birthdays = ref([]);
const showAddBirthday = ref(false);
const newBirthday = ref({
  name: '',
  date: ''
});

const loadBirthdays = () => {
  const saved = localStorage.getItem('dashboard_birthdays');
  if (saved) {
    birthdays.value = JSON.parse(saved);
  }
};

const saveBirthdays = () => {
  localStorage.setItem('dashboard_birthdays', JSON.stringify(birthdays.value));
};

const addBirthday = () => {
  if (!newBirthday.value.name || !newBirthday.value.date) return;
  
  birthdays.value.push({
    id: Date.now().toString(),
    name: newBirthday.value.name,
    date: newBirthday.value.date
  });
  
  saveBirthdays();
  showAddBirthday.value = false;
  newBirthday.value = { name: '', date: '' };
};

const upcomingBirthdays = computed(() => {
  const today = new Date();
  const upcoming = birthdays.value.map(b => {
    const [year, month, day] = b.date.split('-');
    const birthdayThisYear = new Date(today.getFullYear(), parseInt(month) - 1, parseInt(day));
    const birthdayNextYear = new Date(today.getFullYear() + 1, parseInt(month) - 1, parseInt(day));
    
    let nextBirthday = birthdayThisYear >= today ? birthdayThisYear : birthdayNextYear;
    const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
    
    return {
      ...b,
      day: day,
      month: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'][parseInt(month) - 1],
      daysUntil
    };
  }).filter(b => b.daysUntil <= 30).sort((a, b) => a.daysUntil - b.daysUntil);
  
  return upcoming;
});

// ====================
// STEP COUNTER
// ====================
const currentSteps = ref(0);
const stepsGoal = ref(10000);

const loadSteps = () => {
  const today = new Date().toDateString();
  const savedDate = localStorage.getItem('steps_date');
  
  if (savedDate === today) {
    const saved = localStorage.getItem('current_steps');
    if (saved) {
      currentSteps.value = parseInt(saved);
    }
  } else {
    currentSteps.value = 0;
    localStorage.setItem('steps_date', today);
  }
};

const saveSteps = () => {
  localStorage.setItem('current_steps', currentSteps.value.toString());
};

const addSteps = (amount) => {
  currentSteps.value += amount;
  saveSteps();
};

const resetSteps = () => {
  if (confirm('Schritte zurücksetzen?')) {
    currentSteps.value = 0;
    saveSteps();
  }
};

const stepsPercentage = computed(() => {
  return Math.min(100, Math.round((currentSteps.value / stepsGoal.value) * 100));
});

const stepsProgress = computed(() => {
  const circumference = 2 * Math.PI * 54;
  const progress = currentSteps.value / stepsGoal.value;
  return circumference - (progress * circumference);
});

// ====================
// CURRENCY CONVERTER
// ====================
const currencyAmount = ref(100);
const fromCurrency = ref('EUR');
const toCurrency = ref('USD');
const exchangeRates = ref({
  EUR: 1,
  USD: 1.08,
  GBP: 0.86,
  JPY: 161.5,
  CHF: 0.94
});

const exchangeRate = computed(() => {
  const fromRate = exchangeRates.value[fromCurrency.value];
  const toRate = exchangeRates.value[toCurrency.value];
  return toRate / fromRate;
});

const convertedAmount = computed(() => {
  return (currencyAmount.value * exchangeRate.value).toFixed(2);
});

const swapCurrencies = () => {
  const temp = fromCurrency.value;
  fromCurrency.value = toCurrency.value;
  toCurrency.value = temp;
};

// Pomodoro Timer
const pomodoroMode = ref('work');
const pomodoroTime = ref(25 * 60); // 25 minutes in seconds
const pomodoroRunning = ref(false);
const pomodoroInterval = ref(null);
const pomodoroSessions = ref(0);

const pomodoroDurations = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60
};

const pomodoroDisplay = computed(() => {
  const mins = Math.floor(pomodoroTime.value / 60);
  const secs = pomodoroTime.value % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
});

const pomodoroProgress = computed(() => {
  const total = pomodoroDurations[pomodoroMode.value];
  const progress = pomodoroTime.value / total;
  const circumference = 2 * Math.PI * 90;
  return circumference - (progress * circumference);
});

const setPomodoroMode = (mode) => {
  if (pomodoroRunning.value) return;
  pomodoroMode.value = mode;
  pomodoroTime.value = pomodoroDurations[mode];
};

const startPomodoro = () => {
  pomodoroRunning.value = true;
  pomodoroInterval.value = setInterval(() => {
    pomodoroTime.value--;
    if (pomodoroTime.value <= 0) {
      pausePomodoro();
      if (pomodoroMode.value === 'work') {
        pomodoroSessions.value++;
      }
      // Play sound or notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Pomodoro beendet!', {
          body: pomodoroMode.value === 'work' ? 'Zeit für eine Pause!' : 'Zurück zur Arbeit!'
        });
      }
    }
  }, 1000);
};

const pausePomodoro = () => {
  pomodoroRunning.value = false;
  if (pomodoroInterval.value) {
    clearInterval(pomodoroInterval.value);
  }
};

const resetPomodoro = () => {
  pausePomodoro();
  pomodoroTime.value = pomodoroDurations[pomodoroMode.value];
};

// Removed - merged into main onMounted below

// Fetch news articles
const fetchNews = async () => {
  try {
    isLoadingNews.value = true;
    newsError.value = '';
    
    // Try multiple endpoints for better results
    let response;
    try {
      // Try top headlines first (US for English news)
      response = await $fetch(
        `https://newsapi.org/v2/top-headlines?country=us&category=general&pageSize=10&apiKey=${NEWS_API_KEY}`
      );
    } catch (err) {
      // Fallback to everything endpoint with general query
      console.log('Top headlines failed, trying everything endpoint:', err);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const fromDate = yesterday.toISOString().split('T')[0];
      
      response = await $fetch(
        `https://newsapi.org/v2/everything?q=world OR breaking OR news&from=${fromDate}&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}`
      );
    }
    
    if (response.status === 'ok' && response.articles) {
      const filtered = response.articles.filter(article => 
        article && 
        article.title && 
        article.description && 
        article.title !== '[Removed]' &&
        article.description !== '[Removed]' &&
        article.url &&
        article.source
      );
      
      topNews.value = filtered.slice(0, 3);
      
      console.log('News API Response:', {
        total: response.articles.length,
        filtered: filtered.length,
        final: topNews.value.length,
        status: response.status
      });
      
      if (topNews.value.length === 0) {
        newsError.value = 'Keine aktuellen Nachrichten verfügbar';
      }
    } else {
      newsError.value = 'Nachrichten nicht verfügbar';
      console.error('News API bad status:', response);
    }
  } catch (error) {
    console.error('Fehler beim Abrufen der Nachrichten:', error);
    
    if (error.status === 401 || error.status === 403) {
      newsError.value = 'API-Schlüssel ungültig';
    } else if (error.status === 426) {
      newsError.value = 'API-Upgrade erforderlich - Free Tier hat Einschränkungen';
    } else if (error.status === 429) {
      newsError.value = 'Zu viele Anfragen. Bitte später erneut versuchen.';
    } else {
      newsError.value = `Nachrichten konnten nicht geladen werden`;
    }
  } finally {
    isLoadingNews.value = false;
  }
};

// Format news time
const formatNewsTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 60) {
    return `vor ${diffMinutes} Min.`;
  } else if (diffHours < 24) {
    return `vor ${diffHours} Std.`;
  } else {
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  }
};

// Open news article
const openNewsArticle = (url) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

// Removed - merged into main onMounted below

// Google Calendar configuration
const { isAuthenticated, authError, signIn, restoreToken, fetchCalendarEvents } = useGoogleAuth();

// Calendar data
const todayAppointments = ref([]);
const calendarError = ref('');
const isLoadingCalendar = ref(false);

// Helper function to format time
const formatTime = (dateTimeString) => {
  if (!dateTimeString) return '';
  const date = new Date(dateTimeString);
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
};

// Handle calendar card click
const handleCalendarClick = () => {
  if (isAuthenticated.value) {
    navigateTo('/termine');
  }
};

// Google Tasks configuration
const { 
  isAuthenticated: isTasksAuthenticated, 
  signIn: tasksSignIn, 
  restoreToken: restoreTasksToken,
  fetchAllTasks,
  completeTask
} = useGoogleTasks();

// Tasks data
const allTasksData = ref([]);
const tasksError = ref('');
const isLoadingTasks = ref(false);
const showTasksSetup = ref(false);

const incompleteTasks = computed(() => 
  allTasksData.value.filter(t => t.status !== 'completed')
);

// Handle tasks card click
const handleTasksClick = () => {
  navigateTo('/aufgaben');
};

// Sign in to tasks
const signInTasks = async () => {
  try {
    await tasksSignIn();
    await fetchTodayTasks();
  } catch (err) {
    console.error('Tasks sign in error:', err);
    tasksError.value = 'Fehler beim Anmelden';
  }
};

// Toggle task completion
const toggleTask = async (task) => {
  try {
    await completeTask(task.listId, task.id);
    await fetchTodayTasks();
  } catch (err) {
    console.error('Toggle task error:', err);
  }
};

// Fetch today's tasks
const fetchTodayTasks = async () => {
  if (!isTasksAuthenticated.value) return;
  
  try {
    isLoadingTasks.value = true;
    tasksError.value = '';
    const tasks = await fetchAllTasks(false);
    allTasksData.value = tasks;
  } catch (err) {
    console.error('Fehler beim Laden der Aufgaben:', err);
    if (err.message === 'AUTH_ERROR') {
      tasksError.value = 'Bitte erneut anmelden';
    } else {
      tasksError.value = 'Fehler beim Laden';
    }
  } finally {
    isLoadingTasks.value = false;
  }
};

// Fetch today's calendar events
const fetchTodayEvents = async () => {
  if (!isAuthenticated.value) {
    return;
  }

  try {
    isLoadingCalendar.value = true;
    calendarError.value = '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const timeMin = today.toISOString();
    const timeMax = tomorrow.toISOString();
    
    const events = await fetchCalendarEvents(timeMin, timeMax);
    todayAppointments.value = events;
  } catch (error) {
    console.error('Fehler beim Abrufen der Kalenderdaten:', error);
    
    if (error.status === 401 || error.status === 403) {
      calendarError.value = 'Bitte erneut anmelden';
    } else if (error.status === 404) {
      calendarError.value = 'Kalender nicht gefunden';
    } else {
      calendarError.value = 'Kalenderdaten nicht verfügbar';
    }
  } finally {
    isLoadingCalendar.value = false;
  }
};

// Fetch all data on mount
onMounted(async () => {
  // Request notification permission for timers
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  
  // Fetch weather immediately
  fetchWeather();
  setInterval(fetchWeather, 600000); // 10 minutes
  
  // Fetch news immediately
  fetchNews();
  setInterval(fetchNews, 1800000); // 30 minutes
  
  // Fetch crypto
  fetchCrypto();
  setInterval(fetchCrypto, 120000); // 2 minutes
  
  // Initialize local storage features
  loadJournalEntries();
  loadMeditationSessions();
  // loadBookData();
  loadBirthdays();
  loadSteps();
  setDailyQuote();
  loadDailyPrayer();
  loadDailyFact();
  loadDailyJoke();
  
  // Restore authentication tokens
  await restoreToken();
  await restoreTasksToken();
  
  // Watch for authentication changes
  watch(isAuthenticated, (authenticated) => {
    if (authenticated) {
      fetchTodayEvents();
    }
  }, { immediate: true });
  
  watch(isTasksAuthenticated, (authenticated) => {
    if (authenticated) {
      fetchTodayTasks();
    }
  }, { immediate: true });
  
  // Calendar and tasks refresh interval
  setInterval(() => {
    if (isAuthenticated.value) {
      fetchTodayEvents();
    }
    if (isTasksAuthenticated.value) {
      fetchTodayTasks();
    }
  }, 300000); // 5 minutes
});

// Cleanup intervals on unmount
onUnmounted(() => {
  if (countdownInterval.value) clearInterval(countdownInterval.value);
  if (stopwatchInterval.value) clearInterval(stopwatchInterval.value);
  if (pomodoroInterval.value) clearInterval(pomodoroInterval.value);
  if (meditationInterval.value) clearInterval(meditationInterval.value);
});
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 50%, #16213e 100%);
  padding: 2rem;
}

.greeting {
  padding-bottom: 2rem;
}

.greeting h1 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 2rem;
  font-weight: 600;
  color: white;
}

.greeting-icon {
  width: 2.5rem;
  height: 2.5rem;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Feature Navigation Cards */
.feature-nav-section {
  max-width: 1400px;
  margin: 2rem auto;
}

.feature-nav-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.feature-nav-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: rgba(26, 26, 46, 0.6);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.3s;
}

.feature-nav-card:hover {
  transform: translateY(-4px);
  border-color: rgba(79, 172, 254, 0.3);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.routine-nav:hover { border-color: rgba(255, 183, 77, 0.4); box-shadow: 0 10px 30px rgba(255, 183, 77, 0.15); }
.habits-nav:hover { border-color: rgba(16, 185, 129, 0.4); box-shadow: 0 10px 30px rgba(16, 185, 129, 0.15); }
.grades-nav:hover { border-color: rgba(255, 217, 61, 0.4); box-shadow: 0 10px 30px rgba(255, 217, 61, 0.15); }

.fnav-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.fnav-content {
  flex: 1;
}

.fnav-content h3 {
  color: white;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.15rem;
}

.fnav-content p {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.8rem;
  margin: 0;
}

.fnav-arrow {
  width: 1.25rem;
  height: 1.25rem;
  color: rgba(255, 255, 255, 0.2);
  transition: all 0.3s;
}

.feature-nav-card:hover .fnav-arrow {
  color: rgba(255, 255, 255, 0.6);
  transform: translateX(3px);
}

@media (max-width: 768px) {
  .feature-nav-grid {
    grid-template-columns: 1fr;
  }
}

/* Stat Card Base */
.stat-card {
  position: relative;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 1.75rem;
  background: rgba(26, 26, 46, 0.6);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 2px solid transparent;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 280px;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.03) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.stat-card:hover {
  transform: translateY(-8px);
  border-color: currentColor;
}

.stat-card:hover::before {
  opacity: 1;
}

/* Weather Card - Blue/Cyan */
.weather-card {
  border-color: rgba(79, 172, 254, 0.2);
  box-shadow: 0 10px 40px rgba(79, 172, 254, 0.15);
  color: #4facfe;
}

.weather-card .card-icon-wrapper {
  background: rgba(79, 172, 254, 0.25);
}

.weather-card .card-icon {
  color: #4facfe;
}

.weather-card:hover {
  border-color: rgba(79, 172, 254, 0.5);
  box-shadow: 0 15px 50px rgba(79, 172, 254, 0.25);
}

/* Calendar Card - Purple/Pink */
.calendar-card {
  border-color: rgba(162, 155, 254, 0.2);
  box-shadow: 0 10px 40px rgba(162, 155, 254, 0.15);
  color: #a29bfe;
}

.calendar-card .card-icon-wrapper {
  background: rgba(162, 155, 254, 0.25);
}

.calendar-card .card-icon {
  color: #a29bfe;
}

.calendar-card:hover {
  border-color: rgba(162, 155, 254, 0.5);
  box-shadow: 0 15px 50px rgba(162, 155, 254, 0.25);
}

/* Tasks Card - Green */
.tasks-card {
  border-color: rgba(16, 185, 129, 0.2);
  box-shadow: 0 10px 40px rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.tasks-card .card-icon-wrapper {
  background: rgba(16, 185, 129, 0.25);
}

.tasks-card .card-icon {
  color: #10b981;
}

.tasks-card:hover {
  border-color: rgba(16, 185, 129, 0.5);
  box-shadow: 0 15px 50px rgba(16, 185, 129, 0.25);
}

/* Card Icon */
.card-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 16px;
  margin-bottom: 0.5rem;
  position: relative;
}

.card-icon {
  width: 36px;
  height: 36px;
  position: relative;
  z-index: 1;
}

/* Card Content */
.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.card-title {
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  letter-spacing: -0.01em;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.info-main {
  color: white;
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
}

.info-sub {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
  font-weight: 500;
}

.info-location {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
}

/* Card Arrow */
.card-arrow {
  position: absolute;
  bottom: 1.5rem;
  right: 1.5rem;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.15;
  transition: all 0.3s ease;
}

.card-arrow svg {
  width: 18px;
  height: 18px;
  color: white;
}

.stat-card:hover .card-arrow {
  opacity: 0.3;
  transform: translateX(4px);
}

/* Card List */
.card-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.list-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
  background: rgba(255, 255, 255, 0.03);
  border-left: 3px solid currentColor;
  border-radius: 8px;
  transition: all 0.2s ease;
  align-items: center;
}

.list-item:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateX(2px);
}

.item-time {
  color: currentColor;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
  opacity: 0.9;
}

.item-title {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.more-items {
  text-align: center;
  padding: 0.5rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
  font-style: italic;
}

/* Task List Item */
.task-list-item {
  border-left-color: #10b981;
}

.task-checkbox {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.task-checkbox:hover {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.task-checkbox svg {
  width: 12px;
  height: 12px;
}

/* Card States */
.card-error {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.875rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  color: #fca5a5;
  font-size: 0.85rem;
  line-height: 1.4;
}

.error-icon {
  width: 1.125rem;
  height: 1.125rem;
  flex-shrink: 0;
}

.card-error p {
  margin: 0;
  flex: 1;
}

.card-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.5rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.loading-spinner {
  width: 1.5rem;
  height: 1.5rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

.card-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  padding: 2rem 1rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
}

.card-empty svg {
  width: 2.5rem;
  height: 2.5rem;
  color: currentColor;
  opacity: 0.6;
}

.appointments-loading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  color: rgba(255, 255, 255, 0.7);
}

.no-appointments {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem;
  color: rgba(255, 255, 255, 0.6);
}

.no-appointments svg {
  width: 2rem;
  height: 2rem;
  color: #4facfe;
}

.appointments-list {
  margin: 1rem 0;
}

.appointment-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: rgba(79, 172, 254, 0.05);
  border-left: 3px solid #4facfe;
  border-radius: 8px;
  transition: all 0.2s ease;
  align-items: center;
}

.appointment-item:hover {
  background: rgba(79, 172, 254, 0.1);
}

.task-item {
  border-left-color: #10b981;
}

.appointment-time {
  color: #4facfe;
  font-weight: 600;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.appointment-title {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-appointments {
  text-align: center;
  padding: 0.5rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  font-style: italic;
}

.auth-needed {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1rem;
  min-height: 120px;
}

.google-signin-btn {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 1.25rem;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.google-signin-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
  transform: scale(1.02);
}

.google-signin-btn svg {
  width: 1.125rem;
  height: 1.125rem;
}

.error-retry-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  margin-top: 0.75rem;
  background: rgba(79, 172, 254, 0.15);
  border: 1px solid rgba(79, 172, 254, 0.3);
  border-radius: 8px;
  color: #4facfe;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.error-retry-btn:hover {
  background: rgba(79, 172, 254, 0.25);
  border-color: rgba(79, 172, 254, 0.5);
  transform: translateY(-1px);
}

.error-retry-btn svg {
  width: 1rem;
  height: 1rem;
}

.error-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}

.error-help-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(162, 155, 254, 0.15);
  border: 1px solid rgba(162, 155, 254, 0.3);
  border-radius: 8px;
  color: #a29bfe;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.error-help-btn:hover {
  background: rgba(162, 155, 254, 0.25);
  border-color: rgba(162, 155, 254, 0.5);
  transform: translateY(-1px);
}

.error-help-btn svg {
  width: 1rem;
  height: 1rem;
}

/* Modal Styles */
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
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid rgba(79, 172, 254, 0.2);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.modal-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #4facfe;
}

.modal-title h3 {
  color: white;
  font-size: 1.25rem;
  margin: 0;
}

.modal-close {
  width: 2rem;
  height: 2rem;
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

.modal-close:hover {
  background: rgba(255, 255, 255, 0.1);
}

.modal-body {
  padding: 1.5rem;
}

.setup-step {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.setup-step:last-of-type {
  margin-bottom: 1rem;
  border-bottom: none;
}

.step-number {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 50%;
  color: white;
  font-weight: 700;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.step-content h4 {
  color: white;
  font-size: 1rem;
  margin: 0 0 0.5rem 0;
}

.step-content p {
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  line-height: 1.5;
}

.setup-link {
  color: #4facfe;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
}

.setup-link:hover {
  color: #00f2fe;
  text-decoration: underline;
}

.setup-note {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(79, 172, 254, 0.1);
  border: 1px solid rgba(79, 172, 254, 0.2);
  border-radius: 12px;
  margin-top: 1rem;
}

.setup-note svg {
  width: 1.5rem;
  height: 1.5rem;
  color: #4facfe;
  flex-shrink: 0;
}

.setup-note p {
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  line-height: 1.5;
}

.scope-list {
  list-style: none;
  padding: 0;
  margin: 0.75rem 0 0;
}

.scope-list li {
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.scope-list code {
  color: #4facfe;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.85rem;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  justify-content: flex-end;
}

.btn-primary,
.btn-secondary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(79, 172, 254, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}

.view-details {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(79, 172, 254, 0.1);
  border: 1px solid rgba(79, 172, 254, 0.2);
  border-radius: 8px;
  color: #4facfe;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.card1:hover .view-details {
  background: rgba(79, 172, 254, 0.2);
  border-color: rgba(79, 172, 254, 0.4);
}

.view-details svg {
  width: 1rem;
  height: 1rem;
  transition: transform 0.2s ease;
}

.card1:hover .view-details svg {
  transform: translateX(3px);
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 1rem;
  }

  .greeting h1 {
    font-size: 1.5rem;
  }

  .greeting-icon {
    width: 2rem;
    height: 2rem;
  }

  .quick-stats {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .stat-card {
    padding: 1.5rem;
    min-height: 240px;
  }

  .card-icon-wrapper {
    width: 56px;
    height: 56px;
  }

  .card-icon {
    width: 32px;
    height: 32px;
  }

  .card-title {
    font-size: 1rem;
  }

  .info-main {
    font-size: 2rem;
  }

  .info-sub {
    font-size: 0.9rem;
  }

  .list-item {
    padding: 0.5rem 0.75rem;
  }

  .item-time,
  .item-title {
    font-size: 0.8rem;
  }

  .card-arrow {
    bottom: 1.25rem;
    right: 1.25rem;
    width: 28px;
    height: 28px;
  }

  .card-arrow svg {
    width: 16px;
    height: 16px;
  }

  .google-signin-btn {
    font-size: 0.85rem;
    padding: 0.625rem 1rem;
  }
}

@media (max-width: 1024px) and (min-width: 769px) {
  .quick-stats {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
}

/* News Section */
.news-section {
  max-width: 1400px;
  margin: 3rem auto 0;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.section-header h2 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
  margin: 0;
}

.section-icon {
  width: 1.75rem;
  height: 1.75rem;
  color: #4facfe;
}

.news-time {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  font-weight: 500;
}

.view-all-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: rgba(79, 172, 254, 0.1);
  border: 2px solid rgba(79, 172, 254, 0.3);
  border-radius: 10px;
  color: #4facfe;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
}

.view-all-btn:hover {
  background: rgba(79, 172, 254, 0.2);
  border-color: #4facfe;
  transform: translateY(-2px);
}

.view-all-btn svg {
  width: 1rem;
  height: 1rem;
}

.news-error {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 16px;
  color: #fca5a5;
}

.news-error svg {
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
}

.news-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.news-card {
  cursor: pointer;
  background: rgba(26, 26, 46, 0.6);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 2px solid rgba(79, 172, 254, 0.1);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.news-card:hover {
  transform: translateY(-8px);
  border-color: rgba(79, 172, 254, 0.3);
  box-shadow: 0 15px 50px rgba(79, 172, 254, 0.2);
}

.news-image {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
}

.news-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.news-card:hover .news-image img {
  transform: scale(1.05);
}

.news-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 50%;
  color: white;
  font-weight: 700;
  font-size: 1.1rem;
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.4);
}

.news-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.news-source {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
  font-weight: 500;
}

.news-source svg {
  width: 0.875rem;
  height: 0.875rem;
  color: #4facfe;
}

.news-dot {
  font-size: 0.6rem;
}

.news-title {
  color: white;
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.4;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.news-description {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.news-footer {
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.read-more {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #4facfe;
  font-size: 0.9rem;
  font-weight: 600;
  transition: gap 0.3s ease;
}

.news-card:hover .read-more {
  gap: 0.75rem;
}

.read-more svg {
  width: 1rem;
  height: 1rem;
}

@media (max-width: 768px) {
  .news-section {
    margin-top: 2rem;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .section-header h2 {
    font-size: 1.25rem;
  }

  .view-all-btn {
    width: 100%;
    justify-content: center;
  }

  .news-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .news-image {
    height: 180px;
  }

  .news-content {
    padding: 1.25rem;
  }

  .news-title {
    font-size: 1rem;
  }

  .news-description {
    font-size: 0.85rem;
  }
}

@media (max-width: 1024px) and (min-width: 769px) {
  .news-grid {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
}

/* Timers Section */
.timers-section {
  max-width: 1400px;
  margin: 3rem auto 0;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.timers-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.timer-card {
  background: rgba(26, 26, 46, 0.6);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 2px solid rgba(79, 172, 254, 0.2);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.timer-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: white;
}

.timer-icon {
  width: 1.75rem;
  height: 1.75rem;
  color: #4facfe;
}

.timer-header h3 {
  font-size: 1.25rem;
  margin: 0;
}

.timer-display {
  font-size: 3.5rem;
  font-weight: 700;
  color: white;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.05em;
}

.timer-input {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: white;
  font-size: 1.25rem;
}

.time-input {
  width: 80px;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: white;
  font-size: 1.25rem;
  text-align: center;
  transition: all 0.3s ease;
}

.time-input:focus {
  outline: none;
  border-color: #4facfe;
  background: rgba(79, 172, 254, 0.1);
}

.timer-controls {
  display: flex;
  gap: 1rem;
}

.timer-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  border: none;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.start-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
}

.pause-btn {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.pause-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4);
}

.reset-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.15);
  color: white;
}

.reset-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

/* Google Notes Section */
.notes-section {
  max-width: 1400px;
  margin: 3rem auto 0;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* ====================
   FINANCE/CRYPTO SECTION
   ==================== */
.finance-section {
  max-width: 1400px;
  margin: 3rem auto 0;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(79, 172, 254, 0.1);
  border: 2px solid rgba(79, 172, 254, 0.3);
  border-radius: 10px;
  color: #4facfe;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-btn:hover {
  background: rgba(79, 172, 254, 0.2);
  transform: scale(1.05);
}

.refresh-btn .spinning {
  animation: spin 1s linear infinite;
}

.crypto-error,
.crypto-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  background: rgba(26, 26, 46, 0.6);
  border-radius: 16px;
  border: 2px solid rgba(79, 172, 254, 0.2);
}

.crypto-error {
  color: #fca5a5;
  border-color: rgba(239, 68, 68, 0.3);
}

.crypto-loading {
  color: rgba(255, 255, 255, 0.7);
}

.crypto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.crypto-card {
  background: rgba(26, 26, 46, 0.6);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 2px solid rgba(79, 172, 254, 0.2);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: all 0.3s ease;
}

.crypto-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.crypto-card.positive {
  border-color: rgba(16, 185, 129, 0.3);
}

.crypto-card.negative {
  border-color: rgba(239, 68, 68, 0.3);
}

.crypto-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.crypto-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.crypto-info {
  display: flex;
  flex-direction: column;
}

.crypto-info h4 {
  color: white;
  font-size: 1.1rem;
  margin: 0;
}

.crypto-symbol {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  text-transform: uppercase;
}

.crypto-price {
  font-size: 2rem;
  font-weight: 700;
  color: white;
}

.crypto-change {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  width: fit-content;
}

.crypto-change.positive {
  color: #10b981;
  background: rgba(16, 185, 129, 0.15);
}

.crypto-change.negative {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.15);
}

.crypto-market-cap {
  display: flex;
  justify-content: space-between;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* ====================
   DAILY JOURNAL SECTION
   ==================== */
.journal-section {
  max-width: 1400px;
  margin: 3rem auto 0;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.journal-card {
  background: rgba(26, 26, 46, 0.6);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 2px solid rgba(79, 172, 254, 0.2);
  padding: 2rem;
  margin-bottom: 1.5rem;
}

.journal-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.journal-header svg {
  width: 28px;
  height: 28px;
  color: #4facfe;
}

.journal-header h3 {
  color: white;
  font-size: 1.4rem;
  margin: 0;
}

.journal-textarea {
  width: 100%;
  min-height: 200px;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  color: white;
  font-size: 1rem;
  font-family: inherit;
  line-height: 1.6;
  resize: vertical;
  transition: all 0.3s ease;
}

.journal-textarea:focus {
  outline: none;
  border-color: #4facfe;
  background: rgba(79, 172, 254, 0.05);
}

.journal-textarea::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.journal-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
}

.word-count {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
}

.save-journal-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.save-journal-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
}

.save-journal-btn svg {
  width: 18px;
  height: 18px;
}

.saved-indicator {
  color: #10b981;
  font-size: 0.9rem;
  font-weight: 600;
}

.journal-history h4 {
  color: white;
  font-size: 1.1rem;
  margin: 0 0 1rem 0;
}

.journal-entries {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.journal-entry-card {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.journal-entry-card:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateX(4px);
}

.entry-date {
  color: #4facfe;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.entry-preview {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
  line-height: 1.5;
}

.journal-viewer {
  width: 100%;
  max-width: 700px;
}

.full-entry {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
  line-height: 1.7;
  white-space: pre-wrap;
}

/* ====================
   MEDITATION TIMER SECTION
   ==================== */
.meditation-section {
  max-width: 1400px;
  margin: 3rem auto 0;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.meditation-card {
  background: rgba(26, 26, 46, 0.6);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 2px solid rgba(162, 155, 254, 0.3);
  padding: 2.5rem;
  text-align: center;
}

.meditation-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.meditation-header svg {
  width: 32px;
  height: 32px;
  color: #a29bfe;
}

.meditation-header h3 {
  color: white;
  font-size: 1.5rem;
  margin: 0;
}

.meditation-circle {
  margin: 2rem auto;
  position: relative;
  width: 200px;
  height: 200px;
}

.meditation-progress {
  transform: rotate(-90deg);
}

.progress-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 8;
}

.progress-ring {
  fill: none;
  stroke: #a29bfe;
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.3s ease;
}

.meditation-time {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 3rem;
  font-weight: 700;
  color: white;
  font-family: 'Courier New', monospace;
}

.breathing-prompt {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.1rem;
  margin: 1.5rem 0;
  font-style: italic;
}

.meditation-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin: 2rem 0;
}

.meditation-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.75rem;
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.meditation-btn svg {
  width: 20px;
  height: 20px;
}

.meditation-btn.start-btn {
  background: linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%);
}

.meditation-btn.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(162, 155, 254, 0.4);
}

.meditation-btn.reset-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.15);
}

.meditation-btn.reset-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.meditation-stats {
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.meditation-stats p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  margin: 0;
}

.meditation-stats strong {
  color: #a29bfe;
  font-size: 1.2rem;
}

/* ====================
   BOOK READER SECTION
   ==================== */
.book-section {
  max-width: 1400px;
  margin: 3rem auto 0;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.book-card {
  background: rgba(26, 26, 46, 0.6);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 2px solid rgba(245, 158, 11, 0.3);
  padding: 2rem;
}

.book-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.book-title-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.book-title-section svg {
  width: 28px;
  height: 28px;
  color: #f59e0b;
}

.book-title-section h3 {
  color: white;
  font-size: 1.4rem;
  margin: 0;
}

.change-book-btn {
  padding: 0.625rem 1.25rem;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.change-book-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.book-info {
  text-align: center;
  margin-bottom: 2rem;
}

.current-book-title {
  color: white;
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
}

.current-book-author {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.1rem;
  margin: 0;
}

.book-progress {
  margin: 2rem 0;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  margin-bottom: 0.75rem;
}

.progress-label strong {
  color: #f59e0b;
}

.book-progress-bar {
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
}

.book-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
  transition: width 0.5s ease;
}

.daily-goal {
  margin: 1.5rem 0;
  padding: 1rem;
  background: rgba(245, 158, 11, 0.1);
  border-radius: 10px;
  text-align: center;
}

.daily-goal p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  margin: 0;
}

.daily-goal strong {
  color: #f59e0b;
  font-size: 1.3rem;
}

.book-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin: 2rem 0;
}

.page-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4);
}

.page-btn svg {
  width: 20px;
  height: 20px;
}

.book-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.book-stat-box {
  text-align: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
}

.book-stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #f59e0b;
  line-height: 1;
}

.book-stat-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.5rem;
}

/* ====================
   QUOTE SECTION
   ==================== */
.quote-section {
  max-width: 1400px;
  margin: 3rem auto 0;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.quote-card {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 2px solid rgba(245, 158, 11, 0.3);
  padding: 2.5rem;
  text-align: center;
  position: relative;
}

.quote-reset-btn {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
}

.quote-icon {
  width: 48px;
  height: 48px;
  color: #f59e0b;
  margin: 0 auto 1.5rem;
  opacity: 0.5;
}

.quote-text {
  color: white;
  font-size: 1.5rem;
  font-style: italic;
  line-height: 1.6;
  margin: 0 0 1rem 0;
  font-weight: 500;
}

.quote-author {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.1rem;
  margin: 0;
}

/* ====================
   TOOLS SECTION
   ==================== */
.tools-section {
  max-width: 1400px;
  margin: 3rem auto 2rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.tool-card {
  background: rgba(26, 26, 46, 0.6);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 2px solid rgba(79, 172, 254, 0.2);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: all 0.3s ease;
}

.tool-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.tool-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.tool-header svg {
  width: 1.5rem;
  height: 1.5rem;
  color: #4facfe;
}

.tool-header h4 {
  color: white;
  font-size: 1.1rem;
  margin: 0;
}

.tool-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem 1rem;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
}

.tool-empty svg {
  width: 3rem;
  height: 3rem;
  color: #4facfe;
  opacity: 0.5;
}

.tool-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(79, 172, 254, 0.1);
  border: 2px solid rgba(79, 172, 254, 0.3);
  border-radius: 10px;
  color: #4facfe;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tool-action-btn:hover {
  background: rgba(79, 172, 254, 0.2);
  border-color: #4facfe;
}

/* Calculator */
.calculator-display {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  padding: 1.25rem;
  text-align: right;
  color: white;
  font-size: 2rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  min-height: 60px;
  word-break: break-all;
}

.calculator-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.calc-btn {
  aspect-ratio: 1;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.calc-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.05);
}

.calc-btn.operator {
  background: rgba(79, 172, 254, 0.2);
  border-color: rgba(79, 172, 254, 0.4);
  color: #4facfe;
}

.calc-btn.clear {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  color: #ef4444;
}

.calc-btn.equals {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-color: transparent;
  color: white;
}

/* Birthday */
.birthday-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.birthday-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  border-left: 3px solid #ec4899;
}

.birthday-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: rgba(236, 72, 153, 0.2);
  border-radius: 10px;
  flex-shrink: 0;
}

.birthday-date .day {
  color: #ec4899;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1;
}

.birthday-date .month {
  color: rgba(236, 72, 153, 0.8);
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.birthday-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.birthday-info .name {
  color: white;
  font-weight: 600;
}

.birthday-info .days-left {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
}

/* Steps */
.steps-display {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.steps-circle {
  position: relative;
  width: 160px;
  height: 160px;
}

.steps-circle svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.steps-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 8;
}

.steps-progress {
  fill: none;
  stroke: #10b981;
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: 339.29;
  transition: stroke-dashoffset 0.5s ease;
}

.steps-count {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.steps-number {
  display: block;
  color: white;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.steps-label {
  display: block;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.steps-goal {
  display: flex;
  justify-content: space-between;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  padding: 0.75rem 0;
}

.steps-percentage {
  color: #10b981;
  font-weight: 700;
}

.step-controls {
  display: flex;
  gap: 0.5rem;
}

.step-btn {
  flex: 1;
  padding: 0.625rem;
  background: rgba(16, 185, 129, 0.15);
  border: 2px solid rgba(16, 185, 129, 0.3);
  border-radius: 8px;
  color: #10b981;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.step-btn:hover {
  background: rgba(16, 185, 129, 0.25);
  border-color: #10b981;
}

.step-btn.reset {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.step-btn.reset:hover {
  background: rgba(239, 68, 68, 0.25);
  border-color: #ef4444;
}

/* Currency */
.currency-converter {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.currency-input-group {
  display: flex;
  gap: 0.5rem;
}

.currency-input {
  flex: 1;
  padding: 0.875rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
}

.currency-input:focus {
  outline: none;
  border-color: #4facfe;
}

.currency-input.result {
  background: rgba(79, 172, 254, 0.1);
  border-color: rgba(79, 172, 254, 0.3);
}

.currency-select {
  padding: 0.875rem;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  min-width: 80px;
}

.currency-select:focus {
  outline: none;
  border-color: #4facfe;
}

.swap-btn {
  align-self: center;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(79, 172, 254, 0.15);
  border: 2px solid rgba(79, 172, 254, 0.3);
  border-radius: 50%;
  color: #4facfe;
  cursor: pointer;
  transition: all 0.3s ease;
}

.swap-btn:hover {
  background: rgba(79, 172, 254, 0.25);
  transform: rotate(180deg);
}

.exchange-rate {
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.color-picker {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.color-btn {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: 3px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.color-btn:hover {
  transform: scale(1.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.color-btn.active {
  border-color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.color-btn svg {
  width: 1.25rem;
  height: 1.25rem;
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

/* Detailed Weather Section */
.detailed-weather-section {
  max-width: 1400px;
  margin: 3rem auto 0;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.weather-detail-error,
.weather-detail-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  background: rgba(26, 26, 46, 0.6);
  border-radius: 16px;
  border: 2px solid rgba(79, 172, 254, 0.2);
}

.weather-detail-error {
  color: #fca5a5;
  border-color: rgba(239, 68, 68, 0.3);
}

.weather-detail-loading {
  color: rgba(255, 255, 255, 0.7);
}

.weather-detail-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.weather-main-card {
  grid-column: span 2;
  background: linear-gradient(135deg, rgba(79, 172, 254, 0.2) 0%, rgba(0, 242, 254, 0.1) 100%);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 2px solid rgba(79, 172, 254, 0.3);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.weather-main-info {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.weather-main-icon {
  width: 80px;
  height: 80px;
  color: #4facfe;
}

.weather-main-temp {
  display: flex;
  flex-direction: column;
}

.temp-value {
  font-size: 3.5rem;
  font-weight: 700;
  color: white;
  line-height: 1;
}

.temp-feels {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.5rem;
}

.weather-main-desc {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.weather-info-card {
  background: rgba(26, 26, 46, 0.6);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 2px solid rgba(79, 172, 254, 0.2);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.weather-info-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.weather-info-item svg {
  width: 1.5rem;
  height: 1.5rem;
  color: #4facfe;
  flex-shrink: 0;
}

.weather-info-item > div {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.info-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
}

.air-quality-card {
  grid-column: span 2;
  background: rgba(26, 26, 46, 0.6);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 2px solid rgba(79, 172, 254, 0.2);
  padding: 1.5rem;
}

.aqi-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.aqi-header svg {
  width: 1.5rem;
  height: 1.5rem;
  color: #4facfe;
}

.aqi-header h4 {
  color: white;
  font-size: 1.1rem;
  margin: 0;
}

.aqi-value {
  font-size: 1.5rem;
  font-weight: 700;
  padding: 1rem;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 1rem;
}

.aqi-good {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.aqi-moderate {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.aqi-unhealthy-sensitive {
  background: rgba(249, 115, 22, 0.2);
  color: #f97316;
}

.aqi-unhealthy {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.aqi-hazardous {
  background: rgba(127, 29, 29, 0.2);
  color: #991b1b;
}

.aqi-unknown {
  background: rgba(156, 163, 175, 0.2);
  color: #9ca3af;
}

.aqi-details {
  display: flex;
  gap: 1rem;
}

.aqi-detail {
  flex: 1;
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

/* Pomodoro Section */
.pomodoro-section {
  max-width: 1400px;
  margin: 3rem auto 2rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.pomodoro-card {
  background: rgba(26, 26, 46, 0.6);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 2px solid rgba(239, 68, 68, 0.3);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.pomodoro-mode {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  border: 2px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mode-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.mode-btn.active.work-mode {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border-color: #ef4444;
  color: white;
}

.mode-btn.active.break-mode {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-color: #10b981;
  color: white;
}

.pomodoro-display {
  position: relative;
  width: 280px;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pomodoro-progress {
  position: absolute;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.progress-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 8;
}

.progress-bar {
  fill: none;
  stroke: #ef4444;
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: 565.48;
  transition: stroke-dashoffset 0.3s ease;
}

.pomodoro-time {
  font-size: 4rem;
  font-weight: 700;
  color: white;
  font-variant-numeric: tabular-nums;
  z-index: 1;
}

.pomodoro-controls {
  display: flex;
  gap: 1rem;
}

.pomo-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.75rem;
  border-radius: 10px;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pomo-btn svg {
  width: 1.125rem;
  height: 1.125rem;
}

.pomodoro-stats {
  display: flex;
  gap: 2rem;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
}

.stat-item svg {
  width: 1.125rem;
  height: 1.125rem;
  color: #10b981;
}

@media (max-width: 768px) {
  .timers-grid {
    grid-template-columns: 1fr;
  }

  .timer-display {
    font-size: 2.5rem;
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
  }

  .weather-detail-grid {
    grid-template-columns: 1fr;
  }

  .weather-main-card,
  .air-quality-card {
    grid-column: span 1;
  }

  .weather-main-icon {
    width: 60px;
    height: 60px;
  }

  .temp-value {
    font-size: 2.5rem;
  }

  .pomodoro-display {
    width: 220px;
    height: 220px;
  }

  .pomodoro-time {
    font-size: 3rem;
  }

  .pomodoro-mode {
    width: 100%;
  }

  .mode-btn {
    flex: 1;
    justify-content: center;
  }

  /* New responsive styles */
  .crypto-grid {
    grid-template-columns: 1fr;
  }

  .habits-grid {
    grid-template-columns: 1fr;
  }

  .now-playing {
    flex-direction: column;
    text-align: center;
  }

  .album-art {
    width: 100px;
    height: 100px;
  }

  .disc-icon {
    width: 50px;
    height: 50px;
  }

  .track-info h3 {
    font-size: 1.25rem;
  }

  .track-info p {
    font-size: 1rem;
  }

  .quote-text {
    font-size: 1.25rem;
  }

  .quote-author {
    font-size: 0.95rem;
  }

  .tools-grid {
    grid-template-columns: 1fr;
  }

  .calculator-display {
    font-size: 1.5rem;
  }

  .calc-btn {
    font-size: 1.1rem;
  }

  .steps-circle {
    width: 140px;
    height: 140px;
  }

  .steps-number {
    font-size: 1.75rem;
  }
}

@media (max-width: 1024px) and (min-width: 769px) {
  .weather-detail-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .weather-main-card,
  .air-quality-card {
    grid-column: span 2;
  }
}

/* Daily Inspiration */
.inspiration-section { margin-bottom: 2rem; }
.inspiration-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.inspiration-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem; position: relative; transition: transform 0.2s; }
.inspiration-card:hover { transform: translateY(-3px); }
.prayer-card { border-color: rgba(162,155,254,0.2); background: linear-gradient(135deg, rgba(162,155,254,0.05), rgba(108,92,231,0.05)); }
.fact-card { border-color: rgba(255,217,61,0.2); background: linear-gradient(135deg, rgba(255,217,61,0.05), rgba(249,202,36,0.05)); }
.joke-card { border-color: rgba(79,172,254,0.2); background: linear-gradient(135deg, rgba(79,172,254,0.05), rgba(0,242,254,0.05)); }
.insp-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
.insp-icon { font-size: 2rem; }
.insp-reset-btn { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); cursor: pointer; transition: all 0.3s ease; }
.insp-reset-btn:hover { background: rgba(255,255,255,0.15); color: white; transform: rotate(180deg); }
.inspiration-card h3 { font-size: 1rem; margin: 0 0 0.75rem; color: rgba(255,255,255,0.9); }
.insp-text { font-size: 0.9rem; line-height: 1.6; color: rgba(255,255,255,0.75); margin: 0; font-style: normal; }
.insp-source { color: rgba(255,255,255,0.4); font-size: 0.8rem; margin-top: 0.5rem; font-style: italic; }
.insp-loading { color: rgba(255,255,255,0.3); font-size: 0.85rem; font-style: italic; }

/* Feature Hub */
.feature-hub-section { margin-bottom: 2rem; }
.feature-hub-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; }
.fhub-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.25rem; cursor: pointer; text-align: center; transition: all 0.3s ease; }
.fhub-card:hover { background: rgba(255,255,255,0.08); border-color: var(--accent, #4facfe); transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.3); }
.fhub-icon { font-size: 2rem; margin-bottom: 0.5rem; }
.fhub-card h4 { margin: 0 0 0.25rem; font-size: 0.95rem; color: rgba(255,255,255,0.9); }
.fhub-card p { margin: 0; font-size: 0.75rem; color: rgba(255,255,255,0.4); }

@media (max-width: 768px) {
  .inspiration-grid { grid-template-columns: 1fr; }
  .feature-hub-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>