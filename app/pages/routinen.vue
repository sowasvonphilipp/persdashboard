<template>
  <div class="routinen-container">
    <div class="top-bar">
      <button class="back-btn" @click="activeRoutine ? (activeRoutine = null) : navigateTo('/dashboard')">
        <UIcon name="i-heroicons-arrow-left" /> {{ activeRoutine ? 'Zurück' : 'Dashboard' }}
      </button>
      <button v-if="!activeRoutine" class="settings-btn" @click="showSettings = true">
        <UIcon name="i-heroicons-settings" /> Konfigurieren
      </button>
    </div>

    <!-- ROUTINE SELECTION -->
    <div v-if="!activeRoutine" class="routine-select">
      <h1 class="page-title"><UIcon name="i-heroicons-sparkles" class="title-icon" />Tägliche Routinen</h1>
      <p class="page-subtitle">Wähle deine Routine für jetzt</p>
      <div class="routine-cards">
        <div class="routine-card morning" :class="{ recommended: currentPeriod === 'morning', 'done-today': isDoneToday('morning') }" @click="startRoutine('morning')">
          <div v-if="currentPeriod === 'morning' && !isDoneToday('morning')" class="rec-badge">Jetzt empfohlen</div>
          <div v-if="isDoneToday('morning')" class="done-badge">✅ Heute erledigt</div>
          <div class="rc-icon">🌅</div>
          <h2>Morgenroutine</h2>
          <div class="rc-meta">
            <span class="rc-time">⏰ 05:00 – 11:00</span>
            <span class="rc-streak" v-if="getStreak('morning') > 0">🔥 {{ getStreak('morning') }}d Streak</span>
          </div>
          <div class="rc-last" v-if="getLastDone('morning')">Zuletzt: {{ getLastDone('morning') }}</div>
          <ul><li>Aufgaben & Termine</li><li>Wetter & Prioritäten</li><li>Morgen-Checklist</li><li>Motivations-Zitat</li></ul>
          <button class="start-btn"><UIcon name="i-heroicons-play" /> {{ isDoneToday('morning') ? 'Wiederholen' : 'Starten' }}</button>
        </div>
        <div class="routine-card mittag" :class="{ recommended: currentPeriod === 'mittag', 'done-today': isDoneToday('mittag') }" @click="startRoutine('mittag')">
          <div v-if="currentPeriod === 'mittag' && !isDoneToday('mittag')" class="rec-badge">Jetzt empfohlen</div>
          <div v-if="isDoneToday('mittag')" class="done-badge">✅ Heute erledigt</div>
          <div class="rc-icon">🍲</div>
          <h2>Mittagsroutine</h2>
          <div class="rc-meta">
            <span class="rc-time">⏰ 11:00 – 15:00</span>
            <span class="rc-streak" v-if="getStreak('mittag') > 0">🔥 {{ getStreak('mittag') }}d Streak</span>
          </div>
          <div class="rc-last" v-if="getLastDone('mittag')">Zuletzt: {{ getLastDone('mittag') }}</div>
          <ul><li>Erledigt & Offen</li><li>Aufgaben hinzufügen</li><li>Energie-Check</li></ul>
          <button class="start-btn"><UIcon name="i-heroicons-play" /> {{ isDoneToday('mittag') ? 'Wiederholen' : 'Starten' }}</button>
        </div>
        <div class="routine-card abend" :class="{ recommended: currentPeriod === 'abend', 'done-today': isDoneToday('abend') }" @click="startRoutine('abend')">
          <div v-if="currentPeriod === 'abend' && !isDoneToday('abend')" class="rec-badge">Jetzt empfohlen</div>
          <div v-if="isDoneToday('abend')" class="done-badge">✅ Heute erledigt</div>
          <div class="rc-icon">🌙</div>
          <h2>Abendroutine</h2>
          <div class="rc-meta">
            <span class="rc-time">⏰ 17:00 – 23:00</span>
            <span class="rc-streak" v-if="getStreak('abend') > 0">🔥 {{ getStreak('abend') }}d Streak</span>
          </div>
          <div class="rc-last" v-if="getLastDone('abend')">Zuletzt: {{ getLastDone('abend') }}</div>
          <ul><li>Tagesrückblick & Checklist</li><li>Dankbarkeit & Bewertung</li><li>Morgen planen & Termine</li><li>Aufgaben für morgen</li></ul>
          <button class="start-btn"><UIcon name="i-heroicons-play" /> {{ isDoneToday('abend') ? 'Wiederholen' : 'Starten' }}</button>
        </div>
      </div>
      <div class="routine-streak" v-if="totalStreakDays > 0">
        <UIcon name="i-heroicons-flame" /> {{ totalStreakDays }} Tage Streak! &nbsp;·&nbsp; {{ doneCountToday }}/3 heute erledigt
      </div>
    </div>

    <!-- ACTIVE ROUTINE -->
    <div v-else class="active-routine">
      <div class="routine-header-bar">
        <span class="rh-title">{{ routineTitle }}</span>
        <span class="rh-step">Schritt {{ currentStepIndex + 1 }}/{{ currentSteps.length }}</span>
      </div>
      <div class="step-indicators">
        <div v-for="(s, i) in currentSteps" :key="i" class="step-dot" :class="{ active: i === currentStepIndex, done: i < currentStepIndex }">
          <UIcon v-if="i < currentStepIndex" name="i-heroicons-check" /><span v-else>{{ i + 1 }}</span>
        </div>
      </div>

      <transition name="slide" mode="out-in">
        <div :key="currentStepIndex" class="step-card">
          <h2 class="step-title"><span class="step-emoji">{{ currentStep.emoji }}</span>{{ currentStep.title }}</h2>
          <p class="step-desc">{{ currentStep.description }}</p>

          <!-- TASKS -->
          <div v-if="currentStep.type === 'tasks'" class="sd">
            <div v-if="tasks.length === 0" class="empty"><UIcon name="i-heroicons-check-circle" /><p>Keine offenen Aufgaben</p></div>
            <div v-else class="tlist">
              <div v-for="t in tasks" :key="t.id" class="titem"><UIcon name="i-heroicons-circle" class="ti" /><span>{{ t.title }}</span></div>
            </div>
          </div>

          <!-- COMPLETED -->
          <div v-if="currentStep.type === 'completed'" class="sd">
            <div v-if="completedTasks.length === 0" class="empty"><UIcon name="i-heroicons-coffee" /><p>Noch nichts erledigt</p></div>
            <div v-else class="tlist">
              <div v-for="t in completedTasks" :key="t.id" class="titem ok"><UIcon name="i-heroicons-check-circle" class="ti" /><span>{{ t.title }}</span></div>
            </div>
          </div>

          <!-- APPOINTMENTS -->
          <div v-if="currentStep.type === 'appointments'" class="sd">
            <div v-if="appointments.length === 0" class="empty"><UIcon name="i-heroicons-calendar-check" /><p>Keine Termine</p></div>
            <div v-else class="tlist">
              <div v-for="a in appointments" :key="a.id" class="titem apt"><span class="atime">{{ fmtTime(a.start?.dateTime) }}</span><span>{{ a.summary }}</span></div>
            </div>
          </div>

          <!-- WEATHER -->
          <div v-if="currentStep.type === 'weather'" class="sd wdisplay">
            <UIcon :name="weatherIcon" class="wicon" />
            <div><div class="wtemp">{{ weatherTemp }}°C</div><div class="wdesc">{{ weatherDesc }}</div></div>
          </div>

          <!-- QUOTE -->
          <div v-if="currentStep.type === 'quote'" class="sd qdisp">
            <UIcon name="i-heroicons-quote" class="qicon" />
            <p class="qtxt">"{{ currentQuote.text }}"</p>
            <p class="qauth">— {{ currentQuote.author }}</p>
          </div>

          <!-- PRIORITIES -->
          <div v-if="currentStep.type === 'priorities'" class="sd">
            <div class="pinputs">
              <div v-for="i in 3" :key="i" class="prow"><span class="pnum">{{ i }}.</span><input v-model="priorities[i-1]" type="text" :placeholder="'Priorität ' + i" class="pinput" /></div>
            </div>
          </div>

          <!-- TOMORROW PRIORITIES -->
          <div v-if="currentStep.type === 'tomorrowPlan'" class="sd">
            <div class="pinputs">
              <div v-for="i in 3" :key="i" class="prow"><span class="pnum">{{ i }}.</span><input v-model="tomorrowPriorities[i-1]" type="text" :placeholder="'Morgen Priorität ' + i" class="pinput" /></div>
            </div>
          </div>

          <!-- ENERGY -->
          <div v-if="currentStep.type === 'energy'" class="sd ecenter">
            <input v-model.number="energyLevel" type="range" min="1" max="5" class="eslider" />
            <div class="elabels"><span>😴</span><span>😐</span><span>🙂</span><span>😊</span><span>🔥</span></div>
            <div class="eval">{{ ['Sehr müde','Etwas müde','OK','Gut','Volle Energie'][energyLevel-1] }}</div>
          </div>

          <!-- GRATITUDE -->
          <div v-if="currentStep.type === 'gratitude'" class="sd">
            <div class="pinputs">
              <div v-for="i in 3" :key="i" class="prow"><span class="pnum">🙏</span><input v-model="gratitude[i-1]" type="text" :placeholder="'Dankbar für... #' + i" class="pinput" /></div>
            </div>
          </div>

          <!-- DAY RATING -->
          <div v-if="currentStep.type === 'dayRating'" class="sd ecenter">
            <div class="rgrid">
              <button v-for="n in 10" :key="n" class="rbtn" :class="{ sel: dayRating === n }" @click="dayRating = n">{{ n }}</button>
            </div>
            <div class="rlabel">{{ dayRating > 0 ? ratingLabels[dayRating-1] : 'Tippe auf eine Zahl' }}</div>
          </div>

          <!-- CHECKLIST (configurable habits) -->
          <!-- CHECKLIST -->
          <div v-if="currentStep.type === 'checklist'" class="sd">
            <div class="checklist">
              <div v-for="item in getChecklistItems(activeRoutine)" :key="item.id" class="chk-item" :class="{ checked: isChecked(item.id) }" @click="toggleCheck(item.id)">
                <div class="chk-box"><UIcon v-if="isChecked(item.id)" name="i-heroicons-check" /></div>
                <span class="chk-icon">{{ item.icon }}</span>
                <span class="chk-label">{{ item.name }}</span>
              </div>
            </div>
            <div class="chk-progress">{{ checkedCount }}/{{ getChecklistItems(activeRoutine).length }} erledigt</div>
          </div>

          <!-- LINKED HABITS -->
          <div v-if="currentStep.type === 'linkedHabits'" class="sd">
            <div v-if="linkedHabits.length === 0" class="empty">
              <p>Keine Gewohnheiten mit Routinen verknüpft.<br><small>In Gewohnheiten → Karte → "Zur Routine hinzufügen" klicken.</small></p>
            </div>
            <div v-else class="checklist">
              <div v-for="habit in linkedHabits" :key="habit.id" class="chk-item" :class="{ checked: isHabitCheckedToday(habit.id) }" @click="toggleHabitToday(habit.id)">
                <div class="chk-box"><UIcon v-if="isHabitCheckedToday(habit.id)" name="i-heroicons-check" /></div>
                <span class="chk-icon">{{ habit.icon }}</span>
                <span class="chk-label">{{ habit.name }}<span v-if="habit.description" class="chk-sub"> – {{ habit.description }}</span></span>
              </div>
            </div>
            <div v-if="linkedHabits.length > 0" class="chk-progress">{{ linkedHabitsChecked }}/{{ linkedHabits.length }} heute</div>
          </div>

          <!-- PRAYER -->
          <div v-if="currentStep.type === 'prayer'" class="sd">
            <div class="prayer-box" v-if="routinePrayer">
              <p class="prayer-text">{{ routinePrayer.text }}</p>
              <p class="prayer-ref">— {{ routinePrayer.reference }}</p>
            </div>
          </div>

          <!-- FACT -->
          <div v-if="currentStep.type === 'fact'" class="sd">
            <div class="fact-box" v-if="routineFact"><p>{{ routineFact }}</p></div>
            <div v-else class="hint-msg">Laden...</div>
          </div>

          <!-- SELFIE -->
          <div v-if="currentStep.type === 'selfie'" class="sd">
            <div class="selfie-upload-area">
              <div v-if="!selfiePreview" class="selfie-placeholder" @click="$refs.selfieInput?.click()">
                <span class="selfie-cam-icon">📸</span><p>Foto aufnehmen oder hochladen</p>
              </div>
              <img v-else :src="selfiePreview" class="selfie-preview" @click="$refs.selfieInput?.click()" />
              <input ref="selfieInput" type="file" accept="image/*" capture="user" @change="handleSelfieFile" style="display:none" />
            </div>
            <div v-if="selfiePreview" class="selfie-feeling">
              <label>Wie fühlst du dich? (1-10)</label>
              <div class="feeling-row">
                <button v-for="n in 10" :key="n" class="fbtn" :class="{ sel: selfieFeeling === n }" @click="selfieFeeling = n">{{ n }}</button>
              </div>
              <input v-model="selfieNote" type="text" placeholder="Notiz zu dir..." class="pinput" style="margin-top:0.5rem" />
              <button class="add-form-btn wide" style="margin-top:0.5rem" @click="saveSelfieFromRoutine" :disabled="!selfieFeeling">📸 Selfie speichern</button>
              <p v-if="selfieSaved" class="success-msg">✅ Gespeichert!</p>
            </div>
          </div>

          <!-- JOURNAL -->
          <div v-if="currentStep.type === 'journal'" class="sd">
            <textarea v-model="journalEntry" class="journal-textarea" rows="5" placeholder="Wie war dein Tag? Was hast du gelernt?"></textarea>
            <button class="add-form-btn wide" style="margin-top:0.5rem" @click="saveJournalEntry"><UIcon name="i-heroicons-arrow-down-tray" /> Speichern</button>
            <p v-if="journalSaved" class="success-msg">✅ Tagebuch gespeichert!</p>
          </div>

          <!-- TAGESPLAN -->
          <div v-if="currentStep.type === 'tagesplan'" class="sd">
            <div v-if="todayPlanBlocks.length" class="tplan-list">
              <div v-for="b in todayPlanBlocks" :key="b.id" class="tplan-item" :class="b.category">
                <span class="tplan-time">{{ b.start }}-{{ b.end }}</span>
                <span>{{ b.title }}</span>
              </div>
            </div>
            <div v-else class="hint-msg">Kein Tagesplan vorhanden</div>
            <button class="add-form-btn wide" style="margin-top:0.75rem" @click="navigateTo('/tagesplan')"><UIcon name="i-heroicons-calendar" /> Zum Tagesplan</button>
          </div>

          <!-- ADD TASK -->
          <div v-if="currentStep.type === 'addTask'" class="sd">
            <div class="day-picker">
              <button class="dp-btn" :class="{ active: taskTargetDay === 'today' }" @click="taskTargetDay = 'today'">📅 Heute</button>
              <button class="dp-btn" :class="{ active: taskTargetDay === 'tomorrow' }" @click="taskTargetDay = 'tomorrow'">➡️ Morgen</button>
              <button class="dp-btn" :class="{ active: taskTargetDay === 'custom' }" @click="taskTargetDay = 'custom'">📆 Datum</button>
            </div>
            <input v-if="taskTargetDay === 'custom'" v-model="taskCustomDate" type="date" class="pinput" style="margin-bottom:0.5rem" />
            <div class="add-form">
              <input v-model="newTaskTitle" type="text" placeholder="Neue Aufgabe..." class="pinput" @keyup.enter="addNewTask" />
              <button class="add-form-btn" @click="addNewTask" :disabled="!newTaskTitle.trim()">
                <UIcon name="i-heroicons-plus" /> Hinzufügen
              </button>
            </div>
            <div v-if="addedTasks.length" class="tlist" style="margin-top:1rem">
              <div v-for="(t, i) in addedTasks" :key="i" class="titem ok"><UIcon name="i-heroicons-check" class="ti" /><span>{{ t.title }} <small class="task-day-label">· {{ t.dayLabel }}</small></span></div>
            </div>
            <p v-if="taskAddError" class="err-msg">{{ taskAddError }}</p>
            <p v-if="!isTasksAuth" class="hint-msg">Google Tasks nicht verbunden — Aufgaben werden lokal gespeichert</p>
          </div>

          <!-- ADD APPOINTMENT -->
          <div v-if="currentStep.type === 'addAppointment'" class="sd">
            <div class="day-picker">
              <button class="dp-btn" :class="{ active: aptTargetDay === 'today' }" @click="setAptDay('today')">📅 Heute</button>
              <button class="dp-btn" :class="{ active: aptTargetDay === 'tomorrow' }" @click="setAptDay('tomorrow')">➡️ Morgen</button>
              <button class="dp-btn" :class="{ active: aptTargetDay === 'custom' }" @click="aptTargetDay = 'custom'">📆 Datum</button>
            </div>
            <div class="add-form-col">
              <input v-model="newAptTitle" type="text" placeholder="Termin-Titel..." class="pinput" />
              <div class="apt-row">
                <input v-model="newAptDate" type="date" class="pinput" />
                <input v-model="newAptTime" type="time" class="pinput" />
              </div>
              <button class="add-form-btn wide" @click="addNewAppointment" :disabled="!newAptTitle.trim()">
                <UIcon name="i-heroicons-calendar-plus" /> Termin erstellen
              </button>
            </div>
            <div v-if="addedApts.length" class="tlist" style="margin-top:1rem">
              <div v-for="(a, i) in addedApts" :key="i" class="titem apt"><span class="atime">{{ a.time }}</span><span>{{ a.title }} <small class="task-day-label">· {{ a.dayLabel }}</small></span></div>
            </div>
            <p v-if="aptAddError" class="err-msg">{{ aptAddError }}</p>
            <p v-if="!isCalAuth" class="hint-msg">Google Calendar nicht verbunden — Termine werden nur angezeigt</p>
          </div>
        </div>
      </transition>

      <div class="step-nav">
        <button v-if="currentStepIndex > 0" class="nbtn prev" @click="prevStep"><UIcon name="i-heroicons-arrow-left" /> Zurück</button>
        <div v-else></div>
        <button v-if="currentStepIndex < currentSteps.length - 1" class="nbtn next" @click="nextStep">Weiter <UIcon name="i-heroicons-arrow-right" /></button>
        <button v-else class="nbtn finish" @click="finishRoutine"><UIcon name="i-heroicons-check" /> Fertig!</button>
      </div>
    </div>

    <!-- SETTINGS MODAL -->
    <div v-if="showSettings" class="modal-overlay" @click="showSettings = false">
      <div class="modal-content modal-lg" @click.stop>
        <div class="modal-header">
          <h3><UIcon name="i-heroicons-settings" class="mi" /> Routinen konfigurieren</h3>
          <button class="modal-close" @click="showSettings = false"><UIcon name="i-heroicons-x-mark" /></button>
        </div>
        <div class="cfg-tabs">
          <button class="cfg-tab" :class="{ active: settingsTab === 'checklists' }" @click="settingsTab = 'checklists'">✅ Checklists / Habits</button>
          <button class="cfg-tab" :class="{ active: settingsTab === 'steps' }" @click="settingsTab = 'steps'">📋 Schritte</button>
        </div>
        <div class="modal-body">
          <!-- CHECKLISTS TAB -->
          <div v-if="settingsTab === 'checklists'">
            <div v-for="rt in ['morning','mittag','abend']" :key="rt" class="cfg-section">
              <h4>{{ {morning:'🌅 Morgen-Habits',mittag:'🍲 Mittag-Habits',abend:'🌙 Abend-Habits'}[rt] }}</h4>
              <div class="cfg-items">
                <div v-for="item in routineChecklists[rt]" :key="item.id" class="cfg-item">
                  <span>{{ item.icon }} {{ item.name }}</span>
                  <button class="cfg-del" @click="removeChecklistItem(rt, item.id)"><UIcon name="i-heroicons-x-mark" /></button>
                </div>
                <div v-if="routineChecklists[rt].length === 0" class="cfg-empty">Keine Einträge</div>
              </div>
              <div class="cfg-add">
                <input v-model="newChecklistName[rt]" type="text" :placeholder="'Neuer Eintrag...'" class="pinput sm" @keyup.enter="addChecklistItem(rt)" />
                <select v-model="newChecklistIcon[rt]" class="icon-sel">
                  <option v-for="ic in checklistIcons" :key="ic" :value="ic">{{ ic }}</option>
                </select>
                <button class="cfg-add-btn" @click="addChecklistItem(rt)"><UIcon name="i-heroicons-plus" /></button>
              </div>
            </div>
          </div>
          <!-- STEPS TAB -->
          <div v-if="settingsTab === 'steps'">
            <div v-for="rt in ['morning','mittag','abend']" :key="rt" class="cfg-section">
              <h4>{{ {morning:'🌅 Morgen-Schritte',mittag:'🍲 Mittag-Schritte',abend:'🌙 Abend-Schritte'}[rt] }}</h4>
              <div class="cfg-items">
                <div v-for="step in allRoutineSteps[rt]" :key="step.type" class="cfg-item cfg-step-item">
                  <label class="step-toggle">
                    <input type="checkbox" :checked="isStepEnabled(rt, step.type)" @change="toggleStep(rt, step.type)" />
                    <span class="step-toggle-slider"></span>
                  </label>
                  <span>{{ step.emoji }} {{ step.title }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" @click="showSettings = false">Fertig</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const config = useRuntimeConfig();
const { isAuthenticated: isCalAuth, restoreToken, fetchCalendarEvents, createEvent } = useGoogleAuth();
const { isAuthenticated: isTasksAuth, restoreToken: restoreTasksToken, fetchAllTasks, fetchTaskLists, createTask } = useGoogleTasks();

const activeRoutine = ref(null);
const currentStepIndex = ref(0);
const routineStreak = ref(0);
const showSettings = ref(false);
const settingsTab = ref('checklists');

// Data
const tasks = ref([]);
const completedTasks = ref([]);
const appointments = ref([]);
const priorities = ref(['','','']);
const tomorrowPriorities = ref(['','','']);
const gratitude = ref(['','','']);
const energyLevel = ref(3);
const dayRating = ref(0);
const weatherTemp = ref('--');
const weatherDesc = ref('');
const weatherIcon = ref('i-heroicons-sun');
const checkedItems = ref([]);
const newTaskTitle = ref('');
const addedTasks = ref([]);
const taskAddError = ref('');
const newAptTitle = ref('');
const newAptDate = ref('');
const newAptTime = ref('09:00');
const addedApts = ref([]);
const aptAddError = ref('');
const taskListId = ref(null);

// Day picker for tasks & appointments
const taskTargetDay = ref('tomorrow');
const taskCustomDate = ref('');
const aptTargetDay = ref('tomorrow');

const getDateForTarget = (target, customDate) => {
  if (target === 'today') return new Date().toISOString().split('T')[0];
  if (target === 'tomorrow') { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; }
  return customDate || new Date().toISOString().split('T')[0];
};
const getDayLabel = (target, customDate) => {
  if (target === 'today') return 'Heute';
  if (target === 'tomorrow') return 'Morgen';
  return customDate || '';
};
const setAptDay = (day) => {
  aptTargetDay.value = day;
  newAptDate.value = getDateForTarget(day, '');
};

const ratingLabels = ['Katastrophal','Sehr schlecht','Schlecht','Unter Durchschnitt','OK','Ganz gut','Gut','Sehr gut','Fantastisch','Perfekter Tag!'];
const checklistIcons = ['💪','🏋️','🥤','🦷','💊','🧘','📖','💧','🍎','🚶','🧹','😴','📵','✍️','🎯','🥗','☕'];

const quotes = [
  {text:'Die Zukunft gehört denen, die an die Schönheit ihrer Träume glauben.',author:'Eleanor Roosevelt'},
  {text:'Der einzige Weg, großartige Arbeit zu leisten, ist zu lieben, was man tut.',author:'Steve Jobs'},
  {text:'Erfolg ist nicht der Schlüssel zum Glück. Glück ist der Schlüssel zum Erfolg.',author:'Albert Schweitzer'},
  {text:'Jeder Tag ist eine neue Chance, das zu tun, was du möchtest.',author:'Friedrich Schiller'},
  {text:'Es ist nie zu spät, das zu werden, was du hättest sein können.',author:'George Eliot'},
  {text:'Nicht der Wind bestimmt die Richtung, sondern das Segel.',author:'Chinesisches Sprichwort'},
  {text:'Tu heute etwas, wofür dir dein zukünftiges Ich danken wird.',author:'Sean Patrick Flanery'},
  {text:'Das Geheimnis des Vorankommens ist das Anfangen.',author:'Mark Twain'},
  {text:'Sei die Veränderung, die du in der Welt sehen willst.',author:'Mahatma Gandhi'},
  {text:'Fortschritt, nicht Perfektion.',author:'Unbekannt'},
  {text:'Disziplin ist die Brücke zwischen Zielen und Ergebnissen.',author:'Jim Rohn'},
  {text:'Kleine Schritte führen zu großen Veränderungen.',author:'Unbekannt'},
  {text:'Wer immer tut, was er schon kann, bleibt immer das, was er schon ist.',author:'Henry Ford'},
  {text:'Du bist stärker als du denkst.',author:'Unbekannt'},
  {text:'Schließe den Tag ab und lass ihn los. Morgen ist ein neuer Tag.',author:'Ralph Waldo Emerson'},
  {text:'Motivation bringt dich in Gang. Gewohnheit bringt dich weiter.',author:'Jim Ryun'},
  {text:'Der Körper erreicht, was der Geist glaubt.',author:'Unbekannt'},
  {text:'Ruhe und Erholung sind keine Faulheit. Sie sind Vorbereitung.',author:'Unbekannt'},
  {text:'Glaube an dich selbst und alles ist möglich.',author:'Unbekannt'},
  {text:'Der Weg ist das Ziel.',author:'Konfuzius'},
];
const currentQuote = ref(quotes[0]);

// Configurable checklists per routine
const defaultChecklists = {
  morning: [
    {id:'m1',name:'Zähne putzen',icon:'🦷'},{id:'m2',name:'Wasser trinken',icon:'💧'},{id:'m3',name:'Bett machen',icon:'🛏️'},{id:'m4',name:'Frühstück',icon:'☕'},
  ],
  mittag: [
    {id:'mi1',name:'Wasser nachfüllen',icon:'💧'},{id:'mi2',name:'Kurze Pause',icon:'☕'},
  ],
  abend: [
    {id:'a1',name:'Fitness / Sport',icon:'💪'},{id:'a2',name:'Proteine gegessen',icon:'🥤'},{id:'a3',name:'Zähne putzen',icon:'🦷'},
    {id:'a4',name:'Gesund gegessen',icon:'🥗'},{id:'a5',name:'Genug Wasser',icon:'💧'},{id:'a6',name:'Kein Handy ab 22h',icon:'📵'},
    {id:'a7',name:'Tagebuch geschrieben',icon:'✍️'},{id:'a8',name:'Sachen für morgen vorbereitet',icon:'🎯'},
  ]
};

const routineChecklists = ref(JSON.parse(JSON.stringify(defaultChecklists)));
const newChecklistName = ref({morning:'',mittag:'',abend:''});
const newChecklistIcon = ref({morning:'💪',mittag:'💪',abend:'💪'});

const loadChecklists = () => {
  const saved = localStorage.getItem('routine_checklists');
  if (saved) routineChecklists.value = JSON.parse(saved);
};
const saveChecklists = () => localStorage.setItem('routine_checklists', JSON.stringify(routineChecklists.value));

const addChecklistItem = (rt) => {
  const name = newChecklistName.value[rt]?.trim();
  if (!name) return;
  routineChecklists.value[rt].push({id: Date.now().toString(), name, icon: newChecklistIcon.value[rt]});
  newChecklistName.value[rt] = '';
  saveChecklists();
};
const removeChecklistItem = (rt, id) => {
  routineChecklists.value[rt] = routineChecklists.value[rt].filter(i => i.id !== id);
  saveChecklists();
};
const getChecklistItems = (rt) => routineChecklists.value[rt] || [];
const isChecked = (id) => checkedItems.value.includes(id);
const toggleCheck = (id) => {
  const idx = checkedItems.value.indexOf(id);
  if (idx > -1) checkedItems.value.splice(idx, 1);
  else checkedItems.value.push(id);
};
const checkedCount = computed(() => {
  const items = getChecklistItems(activeRoutine.value);
  return items.filter(i => isChecked(i.id)).length;
});

// All possible steps per routine (used for config)
const allRoutineSteps = {
  morning: [
    {emoji:'🙏',title:'Tagesgebet',description:'Dein Gebet für heute:',type:'prayer'},
    {emoji:'💡',title:'Fakt des Tages',description:'Wusstest du?',type:'fact'},
    {emoji:'📋',title:'Aufgaben heute',description:'Diese Aufgaben stehen heute an:',type:'tasks'},
    {emoji:'📅',title:'Termine heute',description:'Deine Termine für heute:',type:'appointments'},
    {emoji:'🕐',title:'Tagesplan',description:'Dein Plan für heute:',type:'tagesplan'},
    {emoji:'🌤️',title:'Wetter',description:'So sieht das Wetter aus:',type:'weather'},
    {emoji:'✅',title:'Morgen-Habits',description:'Hake ab, was du erledigt hast:',type:'checklist'},
    {emoji:'📸',title:'Morgen-Selfie',description:'Nimm dein Morgen-Selfie auf:',type:'selfie'},
    {emoji:'🎯',title:'3 Prioritäten',description:'Was sind deine 3 wichtigsten Ziele für heute?',type:'priorities'},
    {emoji:'➕',title:'Aufgaben hinzufügen',description:'Erstelle neue Aufgaben:',type:'addTask'},
    {emoji:'📅',title:'Termine erstellen',description:'Plane neue Termine:',type:'addAppointment'},
    {emoji:'💪',title:'Motivation',description:'Dein Zitat für heute:',type:'quote'},
  ],
  mittag: [
    {emoji:'✅',title:'Was erledigt?',description:'Das hast du heute schon geschafft:',type:'completed'},
    {emoji:'📋',title:'Was steht noch an?',description:'Offene Aufgaben:',type:'tasks'},
    {emoji:'🕐',title:'Restlicher Tag',description:'Was kommt noch heute:',type:'tagesplan'},
    {emoji:'✅',title:'Mittag-Habits',description:'Hake ab:',type:'checklist'},
    {emoji:'📸',title:'Mittag-Selfie',description:'Nimm dein Mittag-Selfie auf:',type:'selfie'},
    {emoji:'➕',title:'Aufgaben hinzufügen',description:'Neue Aufgaben für heute oder morgen:',type:'addTask'},
    {emoji:'📅',title:'Termine erstellen',description:'Plane neue Termine:',type:'addAppointment'},
    {emoji:'⚡',title:'Energie-Check',description:'Wie ist dein Energielevel?',type:'energy'},
  ],
  abend: [
    {emoji:'✅',title:'Tagesrückblick',description:'Das hast du heute geschafft:',type:'completed'},
    {emoji:'📋',title:'Was ist offen?',description:'Diese Aufgaben sind noch nicht erledigt:',type:'tasks'},
    {emoji:'🔗',title:'Gewohnheiten-Check',description:'Hake deine verknüpften Gewohnheiten ab:',type:'linkedHabits'},
    {emoji:'✅',title:'Abend-Habits',description:'Hake ab, was du heute gemacht hast:',type:'checklist'},
    {emoji:'📸',title:'Abend-Selfie',description:'Nimm dein Abend-Selfie auf:',type:'selfie'},
    {emoji:'📝',title:'Tagebuch',description:'Schreibe eine kurze Reflexion:',type:'journal'},
    {emoji:'🙏',title:'Dankbarkeit',description:'Nenne 3 Dinge, für die du heute dankbar bist:',type:'gratitude'},
    {emoji:'⭐',title:'Tag bewerten',description:'Wie war dein Tag? (1-10)',type:'dayRating'},
    {emoji:'📝',title:'Morgen planen',description:'3 Prioritäten für morgen:',type:'tomorrowPlan'},
    {emoji:'🕐',title:'Morgen-Tagesplan',description:'Plane deinen morgigen Tag:',type:'tagesplan'},
    {emoji:'➕',title:'Aufgaben für morgen',description:'Erstelle Aufgaben:',type:'addTask'},
    {emoji:'📅',title:'Termine erstellen',description:'Plane Termine:',type:'addAppointment'},
    {emoji:'🌙',title:'Gute Nacht!',description:'Ein Zitat zum Abschluss:',type:'quote'},
  ]
};

// Configurable step toggles (which steps are enabled)
const defaultDisabledSteps = { morning: ['addAppointment'], mittag: ['addAppointment'], abend: [] };
const disabledSteps = ref(JSON.parse(JSON.stringify(defaultDisabledSteps)));

const loadStepConfig = () => {
  const saved = localStorage.getItem('routine_disabled_steps');
  if (saved) disabledSteps.value = JSON.parse(saved);
};
const saveStepConfig = () => localStorage.setItem('routine_disabled_steps', JSON.stringify(disabledSteps.value));
const isStepEnabled = (rt, type) => !(disabledSteps.value[rt] || []).includes(type);
const toggleStep = (rt, type) => {
  if (!disabledSteps.value[rt]) disabledSteps.value[rt] = [];
  const idx = disabledSteps.value[rt].indexOf(type);
  if (idx > -1) disabledSteps.value[rt].splice(idx, 1);
  else disabledSteps.value[rt].push(type);
  saveStepConfig();
};

const currentPeriod = computed(() => {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 15) return 'mittag';
  if (h >= 17 && h < 23) return 'abend';
  return '';
});

const routineTitle = computed(() => ({morning:'🌅 Morgenroutine',mittag:'🍲 Mittagsroutine',abend:'🌙 Abendroutine'}[activeRoutine.value] || ''));
const currentSteps = computed(() => (allRoutineSteps[activeRoutine.value] || []).filter(s => isStepEnabled(activeRoutine.value, s.type)));
const currentStep = computed(() => currentSteps.value[currentStepIndex.value] || {});

const fmtTime = (dt) => dt ? new Date(dt).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}) : '';

// Prayer & Fact for routines
const routinePrayer = ref(null);
const routineFact = ref('');
const prayerVerses = [
  {text:'Denn ich weiß wohl, was ich für Gedanken über euch habe, spricht der HERR: Gedanken des Friedens und nicht des Leides.',reference:'Jeremia 29:11'},
  {text:'Fürchte dich nicht, denn ich bin mit dir; sei nicht ängstlich, denn ich bin dein Gott.',reference:'Jesaja 41:10'},
  {text:'Alle Dinge sind möglich dem, der da glaubt.',reference:'Markus 9:23'},
  {text:'Der HERR ist mein Hirte, mir wird nichts mangeln.',reference:'Psalm 23:1'},
  {text:'Ich vermag alles durch den, der mich mächtig macht.',reference:'Philipper 4:13'},
  {text:'Er gibt dem Müden Kraft und Stärke genug dem Unvermögenden.',reference:'Jesaja 40:29'},
  {text:'Wirf dein Anliegen auf den HERRN; der wird dich versorgen.',reference:'Psalm 55:23'},
];

const loadPrayerAndFact = async () => {
  routinePrayer.value = prayerVerses[Math.floor(Math.random() * prayerVerses.length)];
  try {
    const r = await $fetch('https://uselessfacts.jsph.pl/api/v2/facts/today', { params: { language: 'en' } });
    routineFact.value = r.text;
  } catch { routineFact.value = 'Honig wird nie schlecht. Archäologen fanden 3000 Jahre alten Honig, der noch essbar war.'; }
};

// Selfie in routine
const selfiePreview = ref('');
const selfieFeeling = ref(0);
const selfieNote = ref('');
const selfieSaved = ref(false);

const handleSelfieFile = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxSize = 400;
      let w = img.width, h = img.height;
      if (w > h) { h = (h / w) * maxSize; w = maxSize; } else { w = (w / h) * maxSize; h = maxSize; }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      selfiePreview.value = canvas.toDataURL('image/webp', 0.6);
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
};

const saveSelfieFromRoutine = () => {
  if (!selfiePreview.value || !selfieFeeling.value) return;
  const selfies = JSON.parse(localStorage.getItem('glowup_selfies') || '[]');
  const timeOfDay = activeRoutine.value === 'morning' ? 'morgen' : activeRoutine.value === 'mittag' ? 'mittag' : 'abend';
  selfies.push({ id: Date.now().toString(), date: new Date().toISOString().split('T')[0], timeOfDay, image: selfiePreview.value, feeling: selfieFeeling.value, note: selfieNote.value, timestamp: new Date().toISOString() });
  localStorage.setItem('glowup_selfies', JSON.stringify(selfies));
  selfieSaved.value = true; setTimeout(() => { selfieSaved.value = false; }, 3000);
};

// Journal in routine
const journalEntry = ref('');
const journalSaved = ref(false);

const saveJournalEntry = () => {
  if (!journalEntry.value.trim()) return;
  const entries = JSON.parse(localStorage.getItem('dashboard_journal_entries') || '[]');
  const today = new Date().toISOString().split('T')[0];
  const existing = entries.findIndex(e => e.date === today);
  const entry = { date: today, content: journalEntry.value, timestamp: new Date().toISOString() };
  if (existing > -1) entries[existing] = entry; else entries.unshift(entry);
  localStorage.setItem('dashboard_journal_entries', JSON.stringify(entries));
  journalSaved.value = true; setTimeout(() => { journalSaved.value = false; }, 3000);
};

// Tagesplan in routine
const todayPlanBlocks = ref([]);
const loadTagesplan = () => {
  const blocks = JSON.parse(localStorage.getItem('planner_blocks') || '[]');
  const today = new Date().toISOString().split('T')[0];
  const dow = new Date().getDay();
  todayPlanBlocks.value = blocks.filter(b => {
    if (b.date === today) return true;
    if (b.repeat === 'daily') return true;
    if (b.repeat === 'weekdays' && dow >= 1 && dow <= 5) return true;
    if (b.repeat === 'weekly' && new Date(b.date).getDay() === dow) return true;
    return false;
  }).sort((a, b) => a.start.localeCompare(b.start));
};

// Linked habits
const linkedHabits = ref([]);
const linkedHabitLog = ref([]);
const loadLinkedHabits = () => {
  const savedHabits = JSON.parse(localStorage.getItem('habits_v2') || '[]');
  linkedHabits.value = savedHabits.filter(h => h.inRoutine);
  const savedLog = JSON.parse(localStorage.getItem('habit_log') || '{}');
  linkedHabitLog.value = savedLog;
};
const isHabitCheckedToday = (id) => {
  const today = new Date().toISOString().split('T')[0];
  return (linkedHabitLog.value[id] || []).includes(today);
};
const toggleHabitToday = (id) => {
  const today = new Date().toISOString().split('T')[0];
  if (!linkedHabitLog.value[id]) linkedHabitLog.value[id] = [];
  const idx = linkedHabitLog.value[id].indexOf(today);
  if (idx > -1) linkedHabitLog.value[id].splice(idx, 1);
  else linkedHabitLog.value[id].push(today);
  localStorage.setItem('habit_log', JSON.stringify(linkedHabitLog.value));
};
const linkedHabitsChecked = computed(() => linkedHabits.value.filter(h => isHabitCheckedToday(h.id)).length);

const startRoutine = async (type) => {
  activeRoutine.value = type;
  currentStepIndex.value = 0;
  currentQuote.value = quotes[Math.floor(Math.random() * quotes.length)];
  priorities.value = ['','',''];
  tomorrowPriorities.value = ['','',''];
  gratitude.value = ['','',''];
  energyLevel.value = 3;
  dayRating.value = 0;
  checkedItems.value = [];
  addedTasks.value = [];
  addedApts.value = [];
  newTaskTitle.value = '';
  newAptTitle.value = '';
  taskAddError.value = '';
  aptAddError.value = '';
  selfiePreview.value = '';
  selfieFeeling.value = 0;
  selfieNote.value = '';
  selfieSaved.value = false;
  journalEntry.value = '';
  journalSaved.value = false;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  newAptDate.value = tomorrow.toISOString().split('T')[0];
  newAptTime.value = '09:00';
  await loadRoutineData();
  await loadPrayerAndFact();
  loadTagesplan();
  loadLinkedHabits();
};

const loadRoutineData = async () => {
  try {
    if (isTasksAuth.value) {
      const all = await fetchAllTasks(true);
      tasks.value = all.filter(t => t.status !== 'completed');
      completedTasks.value = all.filter(t => t.status === 'completed');
      const lists = await fetchTaskLists();
      if (lists.length > 0) taskListId.value = lists[0].id;
    }
  } catch (e) { console.error(e); }
  try {
    if (isCalAuth.value) {
      const today = new Date(); today.setHours(0,0,0,0);
      const tom = new Date(today); tom.setDate(tom.getDate() + 1);
      appointments.value = await fetchCalendarEvents(today.toISOString(), tom.toISOString());
    }
  } catch (e) { console.error(e); }
  try {
    const key = config.public.weatherApiKey;
    if (key) {
      const r = await $fetch(`https://api.weatherapi.com/v1/current.json?key=${key}&q=Leopoldshafen&lang=de`);
      weatherTemp.value = Math.round(r.current.temp_c);
      weatherDesc.value = r.current.condition.text;
      const c = r.current.condition.code;
      weatherIcon.value = c === 1000 ? 'i-heroicons-sun' : c === 1003 ? 'i-heroicons-cloud-sun' : [1006,1009].includes(c) ? 'i-heroicons-cloud' : [1063,1180,1183,1186,1189,1192,1195].includes(c) ? 'i-heroicons-cloud-rain' : 'i-heroicons-cloud';
    }
  } catch (e) { console.error(e); }
};

const addNewTask = async () => {
  const title = newTaskTitle.value.trim();
  if (!title) return;
  taskAddError.value = '';
  const dayLabel = getDayLabel(taskTargetDay.value, taskCustomDate.value);
  try {
    if (isTasksAuth.value && taskListId.value) {
      const dueDate = getDateForTarget(taskTargetDay.value, taskCustomDate.value);
      await createTask(taskListId.value, { title, due: `${dueDate}T00:00:00.000Z` });
    }
    addedTasks.value.push({ title, dayLabel });
    newTaskTitle.value = '';
  } catch (e) {
    taskAddError.value = 'Fehler beim Erstellen';
    console.error(e);
  }
};

const addNewAppointment = async () => {
  const title = newAptTitle.value.trim();
  if (!title) return;
  aptAddError.value = '';
  const dayLabel = getDayLabel(aptTargetDay.value, newAptDate.value);
  try {
    if (isCalAuth.value) {
      const dateStr = getDateForTarget(aptTargetDay.value, newAptDate.value);
      const start = `${dateStr}T${newAptTime.value}:00`;
      const endDate = new Date(start);
      endDate.setHours(endDate.getHours() + 1);
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await createEvent({ summary: title, start: { dateTime: start, timeZone: tz }, end: { dateTime: endDate.toISOString(), timeZone: tz } });
    }
    addedApts.value.push({ title, time: newAptTime.value, date: newAptDate.value, dayLabel });
    newAptTitle.value = '';
  } catch (e) {
    aptAddError.value = 'Fehler beim Erstellen';
    console.error(e);
  }
};

const nextStep = () => { if (currentStepIndex.value < currentSteps.value.length - 1) currentStepIndex.value++; };
const prevStep = () => { if (currentStepIndex.value > 0) currentStepIndex.value--; };

const finishRoutine = () => {
  const today = new Date().toDateString();
  const data = JSON.parse(localStorage.getItem('routine_data') || '{}');
  if (!data[today]) data[today] = {};
  data[today][activeRoutine.value] = {
    completed: true, priorities: priorities.value, tomorrowPriorities: tomorrowPriorities.value,
    gratitude: gratitude.value, energyLevel: energyLevel.value, dayRating: dayRating.value,
    checkedItems: checkedItems.value, timestamp: new Date().toISOString()
  };
  localStorage.setItem('routine_data', JSON.stringify(data));
  updateStreak();
  activeRoutine.value = null;
};

const isDoneToday = (type) => {
  const data = JSON.parse(localStorage.getItem('routine_data') || '{}');
  const today = new Date().toDateString();
  return !!(data[today]?.[type]?.completed);
};

const getStreak = (type) => {
  const data = JSON.parse(localStorage.getItem('routine_data') || '{}');
  let streak = 0;
  const d = new Date();
  while (true) {
    if (data[d.toDateString()]?.[type]?.completed) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
};

const getLastDone = (type) => {
  const data = JSON.parse(localStorage.getItem('routine_data') || '{}');
  const today = new Date().toDateString();
  const keys = Object.keys(data).filter(k => data[k]?.[type]?.completed && k !== today);
  if (keys.length === 0) return null;
  const last = keys.sort((a, b) => new Date(b) - new Date(a))[0];
  const d = new Date(last);
  const diff = Math.round((new Date() - d) / 86400000);
  if (diff === 1) return 'Gestern';
  if (diff < 7) return `vor ${diff} Tagen`;
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
};

const doneCountToday = computed(() => ['morning','mittag','abend'].filter(t => isDoneToday(t)).length);

const updateStreak = () => {
  const data = JSON.parse(localStorage.getItem('routine_data') || '{}');
  let streak = 0;
  const d = new Date();
  // count days where at least one routine was done
  while (data[d.toDateString()] && Object.values(data[d.toDateString()]).some(v => v?.completed)) {
    streak++; d.setDate(d.getDate() - 1);
  }
  routineStreak.value = streak;
};

const totalStreakDays = computed(() => routineStreak.value);

onMounted(async () => { loadChecklists(); loadStepConfig(); await restoreToken(); await restoreTasksToken(); updateStreak(); });
</script>

<style scoped>
.routinen-container { min-height:100vh; background:linear-gradient(135deg,#0f0f1e 0%,#1a1a2e 50%,#16213e 100%); padding:2rem; color:white; }
.top-bar { display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; }
.back-btn,.settings-btn { display:inline-flex; align-items:center; gap:0.5rem; padding:0.6rem 1.2rem; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:12px; color:rgba(255,255,255,0.8); cursor:pointer; transition:all 0.2s; font-size:0.9rem; }
.back-btn:hover,.settings-btn:hover { background:rgba(255,255,255,0.12); color:white; }
.page-title { display:flex; align-items:center; gap:0.75rem; font-size:2.2rem; font-weight:700; margin-bottom:0.5rem; background:linear-gradient(135deg,#fff 0%,#a29bfe 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
.title-icon { width:2.5rem; height:2.5rem; }
.page-subtitle { color:rgba(255,255,255,0.5); font-size:1.1rem; margin-bottom:2.5rem; }
.routine-cards { display:grid; grid-template-columns:repeat(3,1fr); gap:1.5rem; max-width:1200px; }
.routine-card { position:relative; background:rgba(26,26,46,0.7); backdrop-filter:blur(20px); border-radius:20px; padding:2rem 1.5rem; border:2px solid rgba(255,255,255,0.08); cursor:pointer; transition:all 0.3s; display:flex; flex-direction:column; gap:0.75rem; }
.routine-card:hover { transform:translateY(-8px); }
.routine-card.morning { border-color:rgba(255,183,77,0.3); } .routine-card.morning:hover { border-color:rgba(255,183,77,0.6); box-shadow:0 15px 50px rgba(255,183,77,0.2); }
.routine-card.mittag { border-color:rgba(79,172,254,0.3); } .routine-card.mittag:hover { border-color:rgba(79,172,254,0.6); box-shadow:0 15px 50px rgba(79,172,254,0.2); }
.routine-card.abend { border-color:rgba(162,155,254,0.3); } .routine-card.abend:hover { border-color:rgba(162,155,254,0.6); box-shadow:0 15px 50px rgba(162,155,254,0.2); }
.routine-card.recommended { animation:pulse-border 2s infinite; }
.routine-card.done-today { opacity:0.85; }
@keyframes pulse-border { 0%,100% { opacity:1; } 50% { opacity:0.7; } }
.rec-badge { position:absolute; top:-10px; right:16px; padding:4px 12px; border-radius:20px; font-size:0.7rem; font-weight:600; text-transform:uppercase; letter-spacing:1px; background:linear-gradient(135deg,#4facfe,#00f2fe); color:white; }
.done-badge { position:absolute; top:-10px; right:16px; padding:4px 12px; border-radius:20px; font-size:0.7rem; font-weight:600; background:rgba(16,185,129,0.25); border:1px solid rgba(16,185,129,0.4); color:#10b981; }
.rc-meta { display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap; margin:-0.25rem 0 0.25rem; }
.rc-time { font-size:0.78rem; color:rgba(255,255,255,0.45); }
.rc-streak { font-size:0.78rem; color:#ff6b35; font-weight:600; }
.rc-last { font-size:0.75rem; color:rgba(255,255,255,0.35); margin-bottom:0.25rem; }
.rc-icon { font-size:3rem; }
.routine-card h2 { font-size:1.3rem; font-weight:600; margin:0; }
.routine-card p { color:rgba(255,255,255,0.5); font-size:0.9rem; margin:0; }
.routine-card ul { list-style:none; padding:0; margin:0.5rem 0; flex:1; }
.routine-card li { color:rgba(255,255,255,0.6); font-size:0.85rem; padding:4px 0 4px 1rem; position:relative; }
.routine-card li::before { content:'•'; position:absolute; left:0; color:rgba(255,255,255,0.3); }
.start-btn { display:flex; align-items:center; justify-content:center; gap:0.5rem; padding:0.75rem; background:linear-gradient(135deg,#4facfe,#00f2fe); border:none; border-radius:12px; color:white; font-size:0.95rem; font-weight:600; cursor:pointer; transition:all 0.2s; }
.start-btn:hover { transform:scale(1.03); box-shadow:0 8px 25px rgba(79,172,254,0.4); }
.routine-streak { display:flex; align-items:center; gap:0.5rem; margin-top:2rem; padding:1rem 1.5rem; background:rgba(255,107,53,0.15); border:1px solid rgba(255,107,53,0.3); border-radius:12px; color:#ff6b35; font-weight:600; font-size:1.1rem; width:fit-content; }

/* ACTIVE */
.active-routine { max-width:700px; margin:0 auto; }
.routine-header-bar { display:flex; justify-content:space-between; align-items:center; padding:1rem 1.5rem; background:rgba(255,255,255,0.04); border-radius:14px; margin-bottom:1.5rem; border:1px solid rgba(255,255,255,0.08); }
.rh-title { font-weight:600; font-size:1.1rem; }
.rh-step { color:rgba(255,255,255,0.4); font-size:0.85rem; }
.step-indicators { display:flex; justify-content:center; gap:0.5rem; margin-bottom:1.5rem; flex-wrap:wrap; }
.step-dot { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-weight:600; border:2px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.04); transition:all 0.3s; color:rgba(255,255,255,0.4); }
.step-dot.active { border-color:#4facfe; background:rgba(79,172,254,0.2); color:#4facfe; transform:scale(1.15); }
.step-dot.done { border-color:#10b981; background:rgba(16,185,129,0.2); color:#10b981; }
.step-card { background:rgba(26,26,46,0.7); backdrop-filter:blur(20px); border-radius:20px; padding:2rem; border:1px solid rgba(255,255,255,0.08); min-height:280px; }
.step-title { display:flex; align-items:center; gap:0.75rem; font-size:1.4rem; font-weight:600; margin:0 0 0.4rem; }
.step-emoji { font-size:1.6rem; }
.step-desc { color:rgba(255,255,255,0.5); margin:0 0 1.25rem; font-size:0.9rem; }
.sd { margin-top:0.5rem; }

.tlist { display:flex; flex-direction:column; gap:0.4rem; max-height:250px; overflow-y:auto; }
.titem { display:flex; align-items:center; gap:0.75rem; padding:0.65rem 1rem; background:rgba(255,255,255,0.04); border-radius:10px; border-left:3px solid #4facfe; font-size:0.9rem; }
.titem.ok { border-left-color:#10b981; }
.titem.ok span { text-decoration:line-through; color:rgba(255,255,255,0.4); }
.titem.apt { border-left-color:#a29bfe; }
.ti { width:1.1rem; height:1.1rem; color:#4facfe; flex-shrink:0; }
.titem.ok .ti { color:#10b981; }
.atime { color:#a29bfe; font-weight:600; font-size:0.85rem; min-width:46px; }
.empty { display:flex; flex-direction:column; align-items:center; gap:0.5rem; padding:1.5rem; color:rgba(255,255,255,0.35); }
.empty svg { width:2.5rem; height:2.5rem; }

/* Checklist */
.checklist { display:flex; flex-direction:column; gap:0.4rem; }
.chk-item { display:flex; align-items:center; gap:0.75rem; padding:0.7rem 1rem; background:rgba(255,255,255,0.04); border-radius:10px; cursor:pointer; transition:all 0.2s; border:1px solid transparent; }
.chk-item:hover { background:rgba(255,255,255,0.07); }
.chk-item.checked { background:rgba(16,185,129,0.1); border-color:rgba(16,185,129,0.3); }
.chk-box { width:22px; height:22px; border-radius:6px; border:2px solid rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.2s; }
.chk-item.checked .chk-box { background:#10b981; border-color:#10b981; }
.chk-box svg { width:14px; height:14px; color:white; }
.chk-icon { font-size:1.2rem; }
.chk-label { color:rgba(255,255,255,0.8); font-size:0.9rem; }
.chk-item.checked .chk-label { text-decoration:line-through; color:rgba(255,255,255,0.4); }
.chk-sub { color:rgba(255,255,255,0.35); font-size:0.78rem; }
.chk-progress { text-align:center; margin-top:0.75rem; color:#10b981; font-weight:600; font-size:0.9rem; }

/* Inputs */
.pinputs { display:flex; flex-direction:column; gap:0.6rem; }
.prow { display:flex; align-items:center; gap:0.75rem; }
.pnum { color:#4facfe; font-weight:700; font-size:1rem; min-width:24px; text-align:center; }
.pinput { flex:1; padding:0.7rem 1rem; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:10px; color:white; font-size:0.9rem; outline:none; transition:all 0.2s; }
.pinput:focus { border-color:#4facfe; background:rgba(79,172,254,0.08); }
.pinput::placeholder { color:rgba(255,255,255,0.3); }
.pinput.sm { padding:0.5rem 0.75rem; font-size:0.85rem; }

/* Add forms */
.add-form { display:flex; gap:0.5rem; }
.add-form-col { display:flex; flex-direction:column; gap:0.75rem; }
.apt-row { display:flex; gap:0.5rem; }
.add-form-btn { display:flex; align-items:center; gap:0.4rem; padding:0.7rem 1.2rem; background:linear-gradient(135deg,#4facfe,#00f2fe); border:none; border-radius:10px; color:white; font-weight:600; font-size:0.85rem; cursor:pointer; transition:all 0.2s; white-space:nowrap; }
.add-form-btn:hover { box-shadow:0 6px 20px rgba(79,172,254,0.4); }
.add-form-btn:disabled { opacity:0.4; cursor:not-allowed; }
.add-form-btn.wide { justify-content:center; }
.err-msg { color:#ff6b6b; font-size:0.8rem; margin:0.5rem 0 0; }
.hint-msg { color:rgba(255,255,255,0.3); font-size:0.75rem; margin:0.5rem 0 0; font-style:italic; }

/* Energy & Rating */
.ecenter { text-align:center; padding:1rem 0; }
.eslider { width:100%; -webkit-appearance:none; height:8px; border-radius:4px; background:rgba(255,255,255,0.1); outline:none; margin:1rem 0; }
.eslider::-webkit-slider-thumb { -webkit-appearance:none; width:28px; height:28px; border-radius:50%; background:linear-gradient(135deg,#4facfe,#00f2fe); cursor:pointer; }
.elabels { display:flex; justify-content:space-between; font-size:1.5rem; }
.eval { color:#4facfe; font-weight:600; font-size:1.1rem; margin-top:0.5rem; }
.rgrid { display:flex; gap:0.4rem; justify-content:center; flex-wrap:wrap; }
.rbtn { width:44px; height:44px; border-radius:10px; border:2px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:rgba(255,255,255,0.6); font-size:1rem; font-weight:600; cursor:pointer; transition:all 0.2s; }
.rbtn:hover { border-color:#4facfe; }
.rbtn.sel { border-color:#4facfe; background:rgba(79,172,254,0.25); color:#4facfe; transform:scale(1.1); }
.rlabel { margin-top:1rem; color:#4facfe; font-weight:500; }

/* Weather & Quote */
.wdisplay { display:flex; justify-content:center; align-items:center; gap:1.5rem; padding:2rem 0; }
.wicon { width:4rem; height:4rem; color:#ffd93d; }
.wtemp { font-size:2.5rem; font-weight:700; }
.wdesc { color:rgba(255,255,255,0.6); }
.qdisp { text-align:center; padding:1.5rem 0; }
.qicon { width:2.5rem; height:2.5rem; color:#ffd93d; margin-bottom:1rem; }
.qtxt { font-size:1.2rem; font-style:italic; color:rgba(255,255,255,0.9); line-height:1.6; margin:0 0 1rem; }
.qauth { color:rgba(255,255,255,0.5); font-size:0.9rem; margin:0; }

/* Nav */
.step-nav { display:flex; justify-content:space-between; margin-top:1.5rem; }
.nbtn { display:flex; align-items:center; gap:0.5rem; padding:0.75rem 1.5rem; border-radius:12px; font-size:0.95rem; font-weight:600; cursor:pointer; border:none; transition:all 0.2s; }
.nbtn.prev { background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.7); border:1px solid rgba(255,255,255,0.12); }
.nbtn.prev:hover { background:rgba(255,255,255,0.12); }
.nbtn.next { background:linear-gradient(135deg,#4facfe,#00f2fe); color:white; }
.nbtn.next:hover { box-shadow:0 8px 25px rgba(79,172,254,0.4); }
.nbtn.finish { background:linear-gradient(135deg,#10b981,#34d399); color:white; }
.nbtn.finish:hover { box-shadow:0 8px 25px rgba(16,185,129,0.4); }

/* Modal */
.modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:1000; padding:1rem; }
.modal-content { background:#1a1a2e; border-radius:16px; max-width:600px; width:100%; max-height:90vh; overflow-y:auto; border:1px solid rgba(79,172,254,0.2); }
.modal-header { display:flex; justify-content:space-between; align-items:center; padding:1.5rem; border-bottom:1px solid rgba(255,255,255,0.1); }
.modal-header h3 { display:flex; align-items:center; gap:0.5rem; margin:0; font-size:1.15rem; }
.mi { width:1.25rem; height:1.25rem; color:#4facfe; }
.modal-close { width:2rem; height:2rem; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:white; cursor:pointer; }
.modal-body { padding:1.5rem; }
.modal-footer { display:flex; gap:1rem; padding:1.5rem; border-top:1px solid rgba(255,255,255,0.1); justify-content:flex-end; }
.btn-primary { padding:0.75rem 1.5rem; border-radius:10px; background:linear-gradient(135deg,#4facfe,#00f2fe); color:white; font-weight:500; cursor:pointer; border:none; }

.cfg-section { margin-bottom:2rem; }
.cfg-section h4 { margin:0 0 0.75rem; font-size:1rem; color:rgba(255,255,255,0.9); }
.cfg-items { display:flex; flex-direction:column; gap:0.35rem; margin-bottom:0.75rem; }
.cfg-item { display:flex; justify-content:space-between; align-items:center; padding:0.5rem 0.75rem; background:rgba(255,255,255,0.04); border-radius:8px; font-size:0.85rem; }
.cfg-del { background:none; border:none; color:rgba(255,255,255,0.2); cursor:pointer; padding:2px; }
.cfg-del:hover { color:#ff6b6b; }
.cfg-empty { color:rgba(255,255,255,0.3); font-size:0.8rem; padding:0.5rem; }
.cfg-add { display:flex; gap:0.4rem; align-items:center; }
.icon-sel { padding:0.5rem; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:8px; color:white; font-size:1.1rem; width:50px; }
.icon-sel option { background:#1a1a2e; }
.cfg-add-btn { width:36px; height:36px; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#4facfe,#00f2fe); border:none; border-radius:8px; color:white; cursor:pointer; flex-shrink:0; }

.slide-enter-active,.slide-leave-active { transition:all 0.3s ease; }
.slide-enter-from { opacity:0; transform:translateX(30px); }
.slide-leave-to { opacity:0; transform:translateX(-30px); }

/* Day Picker */
.day-picker { display:flex; gap:0.4rem; margin-bottom:0.75rem; }
.dp-btn { flex:1; display:flex; align-items:center; justify-content:center; gap:0.4rem; padding:0.6rem 0.75rem; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:10px; color:rgba(255,255,255,0.6); cursor:pointer; transition:all 0.2s; font-size:0.85rem; }
.dp-btn:hover { background:rgba(255,255,255,0.08); }
.dp-btn.active { background:rgba(79,172,254,0.15); border-color:#4facfe; color:#4facfe; }
.task-day-label { color:rgba(255,255,255,0.35); font-size:0.75rem; }

/* Settings Tabs */
.modal-lg { max-width:700px; }
.cfg-tabs { display:flex; border-bottom:1px solid rgba(255,255,255,0.1); }
.cfg-tab { flex:1; padding:0.85rem 1rem; background:none; border:none; border-bottom:2px solid transparent; color:rgba(255,255,255,0.5); cursor:pointer; font-size:0.9rem; transition:all 0.2s; }
.cfg-tab:hover { color:rgba(255,255,255,0.8); background:rgba(255,255,255,0.03); }
.cfg-tab.active { color:#4facfe; border-bottom-color:#4facfe; background:rgba(79,172,254,0.05); }

/* Step Toggle */
.cfg-step-item { gap:0.75rem; }
.step-toggle { position:relative; display:inline-block; width:40px; height:22px; flex-shrink:0; }
.step-toggle input { opacity:0; width:0; height:0; }
.step-toggle-slider { position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background:rgba(255,255,255,0.15); border-radius:22px; transition:0.3s; }
.step-toggle-slider:before { content:''; position:absolute; height:16px; width:16px; left:3px; bottom:3px; background:white; border-radius:50%; transition:0.3s; }
.step-toggle input:checked + .step-toggle-slider { background:#4facfe; }
.step-toggle input:checked + .step-toggle-slider:before { transform:translateX(18px); }

@media (max-width:768px) {
  .routine-cards { grid-template-columns:1fr; }
  .step-card { padding:1.5rem; }
  .page-title { font-size:1.6rem; }
  .add-form { flex-direction:column; }
  .apt-row { flex-direction:column; }
  .day-picker { flex-direction:column; }
}

/* Prayer & Fact */
.prayer-box { background:rgba(162,155,254,0.1); border:1px solid rgba(162,155,254,0.2); border-radius:14px; padding:1.25rem; }
.prayer-text { font-size:1rem; line-height:1.7; font-style:italic; color:rgba(255,255,255,0.85); margin:0; }
.prayer-ref { color:#a29bfe; font-size:0.85rem; margin:0.75rem 0 0; }
.fact-box { background:rgba(255,217,61,0.08); border:1px solid rgba(255,217,61,0.2); border-radius:14px; padding:1.25rem; }
.fact-box p { font-size:0.95rem; line-height:1.6; color:rgba(255,255,255,0.8); margin:0; }

/* Selfie in routine */
.selfie-upload-area { margin-bottom:1rem; }
.selfie-placeholder { display:flex; flex-direction:column; align-items:center; gap:0.5rem; padding:2.5rem; border:2px dashed rgba(255,255,255,0.15); border-radius:14px; cursor:pointer; color:rgba(255,255,255,0.4); transition:all 0.2s; }
.selfie-placeholder:hover { border-color:rgba(255,159,243,0.3); }
.selfie-cam-icon { font-size:2.5rem; }
.selfie-preview { width:100%; max-height:250px; object-fit:cover; border-radius:14px; cursor:pointer; }
.selfie-feeling label { display:block; color:rgba(255,255,255,0.6); font-size:0.8rem; margin-bottom:0.4rem; }
.feeling-row { display:flex; gap:0.3rem; }
.fbtn { width:32px; height:32px; border-radius:8px; border:2px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:rgba(255,255,255,0.6); font-size:0.85rem; font-weight:600; cursor:pointer; transition:all 0.2s; }
.fbtn:hover { border-color:#ff9ff3; }
.fbtn.sel { border-color:#ff9ff3; background:rgba(255,159,243,0.25); color:#ff9ff3; transform:scale(1.1); }

/* Journal in routine */
.journal-textarea { width:100%; padding:0.8rem 1rem; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:12px; color:white; font-size:0.9rem; outline:none; resize:vertical; line-height:1.6; box-sizing:border-box; }
.journal-textarea:focus { border-color:#4facfe; }
.journal-textarea::placeholder { color:rgba(255,255,255,0.3); }
.success-msg { color:#10b981; font-size:0.85rem; margin:0.5rem 0; }

/* Tagesplan in routine */
.tplan-list { display:flex; flex-direction:column; gap:0.35rem; }
.tplan-item { display:flex; gap:0.75rem; padding:0.5rem 0.75rem; background:rgba(255,255,255,0.04); border-radius:8px; font-size:0.85rem; border-left:3px solid rgba(255,255,255,0.1); }
.tplan-item.school { border-left-color:#ffd93d; }
.tplan-item.sport { border-left-color:#10b981; }
.tplan-item.work { border-left-color:#4facfe; }
.tplan-item.personal { border-left-color:#a29bfe; }
.tplan-item.travel { border-left-color:#ff6b35; }
.tplan-item.free { border-left-color:#00f2fe; }
.tplan-item.sleep { border-left-color:#636e72; }
.tplan-time { color:#4facfe; font-weight:600; min-width:80px; }
</style>
