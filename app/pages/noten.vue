<template>
  <div class="noten-container">
    <button class="back-btn" @click="navigateTo('/dashboard')">
      <UIcon name="i-heroicons-arrow-left" /> Dashboard
    </button>

    <div class="page-header">
      <h1 class="page-title">
        <UIcon name="i-heroicons-academic-cap" class="title-icon" />
        Notenverwaltung
      </h1>
      <button class="add-btn" @click="showAddSubject = true" v-if="activeSemester !== 'Ganzjahr'">
        <UIcon name="i-heroicons-plus" /> Fach hinzufügen
      </button>
    </div>

    <!-- Overall Stats -->
    <div class="overview-bar">
      <div class="overview-card main-avg" :class="getGradeClass(overallAverage)">
        <div class="ov-label">{{ activeSemester === 'Ganzjahr' ? 'Ganzjahres-Schnitt' : 'Semester-Schnitt' }}</div>
        <div class="ov-value">{{ overallAverage > 0 ? overallAverage.toFixed(2) : '—' }}</div>
        <div class="ov-badge">{{ overallAverage > 0 ? getGradeLabel(overallAverage) : '' }}</div>
      </div>
      <div class="overview-card">
        <div class="ov-label">Fächer</div>
        <div class="ov-value">{{ filteredSubjects.length }}</div>
      </div>
      <div class="overview-card">
        <div class="ov-label">Noten gesamt</div>
        <div class="ov-value">{{ totalGradesDisplayed }}</div>
      </div>
      <div class="overview-card">
        <div class="ov-label">Beste Note</div>
        <div class="ov-value" :class="getGradeClass(bestGrade)">{{ bestGrade > 0 ? bestGrade.toFixed(1) : '—' }}</div>
      </div>
    </div>

    <!-- Semester Tabs -->
    <div class="semester-tabs">
      <button v-for="sem in semesters" :key="sem" class="sem-tab" :class="{ active: activeSemester === sem }" @click="activeSemester = sem">
        {{ sem }}
      </button>
      <button class="sem-tab" :class="{ active: activeSemester === 'Ganzjahr' }" @click="activeSemester = 'Ganzjahr'">
        🌍 Ganzjahr
      </button>
      <button class="sem-tab add-sem" @click="addSemester">
        <UIcon name="i-heroicons-plus" />
      </button>
    </div>

    <!-- Subjects -->
    <div v-if="filteredSubjects.length === 0" class="empty-state">
      <UIcon name="i-heroicons-academic-cap" />
      <p>Noch keine Fächer in dieser Ansicht</p>
      <button v-if="activeSemester !== 'Ganzjahr'" class="add-btn small" @click="showAddSubject = true"><UIcon name="i-heroicons-plus" /> Fach hinzufügen</button>
    </div>

    <div v-else class="subjects-grid">
      <div v-for="subject in filteredSubjects" :key="subject.id" class="subject-card" :style="{ '--accent': subject.color }">
        <div class="subject-header">
          <div class="subject-info">
            <span class="subject-emoji">{{ subject.icon }}</span>
            <div>
              <h3>{{ subject.name }}</h3>
              <span class="subject-weight">Gewichtung: {{ subject.weight }}x | Klausuren: {{ subject.examWeight }}%</span>
            </div>
          </div>
          <div class="subject-avg" :class="getGradeClass(getSubjectAvg(subject))">
            {{ getSubjectAvg(subject) > 0 ? getSubjectAvg(subject).toFixed(2) : '—' }}
          </div>
        </div>

        <!-- Grades List -->
        <div class="grades-list">
          <div v-for="grade in getSubjectGrades(subject)" :key="grade.id" class="grade-item">
            <div class="grade-info">
              <span class="grade-type" :class="isWritten(grade.type) ? 'written' : 'oral'">{{ grade.type }}</span>
              <span class="grade-date" v-if="activeSemester === 'Ganzjahr'">{{ grade.semesterName }} · {{ formatDate(grade.date) }}</span>
              <span class="grade-date" v-else>{{ formatDate(grade.date) }}</span>
            </div>
            <div class="grade-actions">
              <span class="grade-value" :class="getGradeClass(grade.value)">{{ grade.value }}</span>
              <span class="grade-weight-badge">{{ grade.weight }}x</span>
              <button v-if="activeSemester !== 'Ganzjahr'" class="delete-grade-btn" @click="deleteGrade(grade.id)">
                <UIcon name="i-heroicons-x-mark" />
              </button>
            </div>
          </div>
          <div v-if="getSubjectGrades(subject).length === 0" class="no-grades">Noch keine Noten</div>
        </div>

        <!-- Add Grade (hidden in Ganzjahr) -->
        <div v-if="activeSemester !== 'Ganzjahr'" class="add-grade-row">
          <select v-model="subject.newGradeType" class="grade-select">
            <option value="Klausur">Klausur (Schriftlich)</option>
            <option value="Test">Test (Mündlich/Sonst.)</option>
            <option value="Mündlich">Mündlich</option>
            <option value="Hausarbeit">Hausarbeit</option>
            <option value="Referat">Referat</option>
            <option value="Sonstige">Sonstige</option>
          </select>
          <input v-model.number="subject.newGradeValue" type="number" min="1" max="6" step="0.1" placeholder="Note" class="grade-input" @keyup.enter="addGrade(subject)" />
          <input v-model.number="subject.newGradeWeight" type="number" min="0.5" max="3" step="0.5" placeholder="Gew." class="grade-input small" />
          <button class="add-grade-btn" @click="addGrade(subject)">
            <UIcon name="i-heroicons-plus" />
          </button>
        </div>

        <!-- Subject Actions (hidden in Ganzjahr) -->
        <div v-if="activeSemester !== 'Ganzjahr'" class="subject-actions">
          <button class="sub-action-btn danger" @click="deleteSubject(subject.id)">
            <UIcon name="i-heroicons-trash" /> Löschen
          </button>
        </div>
      </div>
    </div>

    <!-- Grade Distribution Chart -->
    <div v-if="totalGradesDisplayed > 0" class="chart-section">
      <h2 class="section-title"><UIcon name="i-heroicons-chart-bar" /> Notenverteilung</h2>
      <div class="grade-chart">
        <div v-for="n in 6" :key="n" class="chart-bar-wrapper">
          <div class="chart-bar" :style="{ height: getDistributionPercent(n) + '%' }" :class="getGradeClass(n)"></div>
          <span class="chart-label">{{ n }}</span>
          <span class="chart-count">{{ getDistributionCount(n) }}</span>
        </div>
      </div>
    </div>

    <!-- Add Subject Modal -->
    <div v-if="showAddSubject" class="modal-overlay" @click="showAddSubject = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3><UIcon name="i-heroicons-book-open" class="modal-icon" /> Fach hinzufügen</h3>
          <button class="modal-close" @click="showAddSubject = false"><UIcon name="i-heroicons-x-mark" /></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Fachname</label>
            <input v-model="newSubject.name" type="text" placeholder="z.B. Mathematik" class="form-input" />
          </div>
          <div class="form-group row-flex">
            <div style="flex:1">
              <label>Fach-Gewichtung Gesamtschnitt</label>
              <input v-model.number="newSubject.weight" type="number" min="0.5" max="5" step="0.5" class="form-input" />
            </div>
            <div style="flex:1">
              <label>Klausuren Anteil in % (Schriftlich)</label>
              <input v-model.number="newSubject.examWeight" type="number" min="0" max="100" step="5" class="form-input" />
            </div>
          </div>
          <p style="font-size:0.75rem; color:rgba(255,255,255,0.4); margin-top:-0.5rem; margin-bottom:1rem;">Der restliche Prozentanteil ({{ 100 - newSubject.examWeight }}%) zählt für Mündlich/Sonstige Noten.</p>
          <div class="form-group">
            <label>Farbe</label>
            <div class="color-select">
              <button v-for="c in subjectColors" :key="c" class="color-option" :class="{ selected: newSubject.color === c }" :style="{ background: c }" @click="newSubject.color = c"></button>
            </div>
          </div>
          <div class="form-group">
            <label>Icon</label>
            <div class="icon-select">
              <button v-for="ic in subjectIcons" :key="ic" class="icon-option" :class="{ selected: newSubject.icon === ic }" @click="newSubject.icon = ic">{{ ic }}</button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showAddSubject = false">Abbrechen</button>
          <button class="btn-primary" @click="addSubject"><UIcon name="i-heroicons-check" /> Hinzufügen</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const subjects = ref([]);
const grades = ref([]);
const semesters = ref(['1. Halbjahr', '2. Halbjahr']);
const activeSemester = ref('1. Halbjahr');
const showAddSubject = ref(false);

const subjectColors = ['#4facfe', '#10b981', '#a29bfe', '#ff6b6b', '#ffd93d', '#ff9ff3', '#54a0ff', '#ff6348', '#5f27cd', '#01a3a4'];
const subjectIcons = ['📐', '📚', '🧪', '🌍', '🎨', '💻', '🎵', '📖', '⚽', '🔬', '🗣️', '🧮', '🇩🇪', '🇬🇧', '🇫🇷'];

const newSubject = ref({ name: '', weight: 1, examWeight: 50, color: '#4facfe', icon: '📚' });

// Derived subjects list depending on whether we view a specific semester or Ganzjahr
const filteredSubjects = computed(() => {
  if (activeSemester.value === 'Ganzjahr') {
    const grouped = {};
    subjects.value.forEach(s => {
      if (!grouped[s.name]) {
        grouped[s.name] = { ...s, id: `ganzjahr_${s.name}`, isCombined: true, originalSubjects: [s.id] };
      } else {
        grouped[s.name].originalSubjects.push(s.id);
      }
    });
    return Object.values(grouped);
  } else {
    // For single semester, ensure reactive inputs exist
    return subjects.value.filter(s => s.semester === activeSemester.value).map(s => {
      if (!s.newGradeType) s.newGradeType = 'Klausur';
      if (!s.newGradeWeight) s.newGradeWeight = 1;
      return s;
    });
  }
});

const isWritten = (type) => type === 'Klausur';

// Collect grades, injecting semesterName for Ganzjahr view
const getSubjectGrades = (subject) => {
  if (subject.isCombined) {
    return grades.value.filter(g => subject.originalSubjects.includes(g.subjectId)).map(g => {
       const oSub = subjects.value.find(s => s.id === g.subjectId);
       return { ...g, semesterName: oSub ? oSub.semester : '' };
    });
  }
  return grades.value.filter(g => g.subjectId === subject.id);
};

// Calculate average using the examWeight formula (written vs oral)
const calculateAverageFromGrades = (sg, examWeight) => {
  if (sg.length === 0) return 0;
  
  const written = sg.filter(g => isWritten(g.type));
  const oral = sg.filter(g => !isWritten(g.type));

  let wAvg = 0;
  if (written.length > 0) {
    let totW = 0, sumW = 0;
    written.forEach(g => { totW += (g.value * g.weight); sumW += g.weight; });
    wAvg = totW / sumW;
  }

  let oAvg = 0;
  if (oral.length > 0) {
    let totO = 0, sumO = 0;
    oral.forEach(g => { totO += (g.value * g.weight); sumO += g.weight; });
    oAvg = totO / sumO;
  }

  if (written.length > 0 && oral.length > 0) {
    return wAvg * (examWeight / 100) + oAvg * ((100 - examWeight) / 100);
  } else if (written.length > 0) {
    return wAvg;
  } else if (oral.length > 0) {
    return oAvg;
  }
  return 0;
};

const getSubjectAvg = (subject) => {
  const sg = getSubjectGrades(subject);
  return calculateAverageFromGrades(sg, subject.examWeight);
};

const overallAverage = computed(() => {
  const subs = filteredSubjects.value.filter(s => getSubjectGrades(s).length > 0);
  if (subs.length === 0) return 0;
  let totalWeighted = 0, totalWeight = 0;
  subs.forEach(s => { 
    const avg = getSubjectAvg(s); 
    totalWeighted += avg * s.weight; 
    totalWeight += s.weight; 
  });
  return totalWeight > 0 ? totalWeighted / totalWeight : 0;
});

const displayedGrades = computed(() => {
  if (activeSemester.value === 'Ganzjahr') return grades.value;
  const currentSubIds = filteredSubjects.value.map(s => s.id);
  return grades.value.filter(g => currentSubIds.includes(g.subjectId));
});

const totalGradesDisplayed = computed(() => displayedGrades.value.length);
const bestGrade = computed(() => {
  if (displayedGrades.value.length === 0) return 0; 
  return Math.min(...displayedGrades.value.map(g => g.value)); 
});

const getGradeClass = (val) => {
  if (!val || val <= 0) return '';
  if (val <= 1.5) return 'grade-excellent';
  if (val <= 2.5) return 'grade-good';
  if (val <= 3.5) return 'grade-ok';
  if (val <= 4.5) return 'grade-poor';
  return 'grade-fail';
};

const getGradeLabel = (val) => {
  if (val <= 1.5) return 'Sehr gut';
  if (val <= 2.5) return 'Gut';
  if (val <= 3.5) return 'Befriedigend';
  if (val <= 4.5) return 'Ausreichend';
  if (val <= 5.5) return 'Mangelhaft';
  return 'Ungenügend';
};

const formatDate = (d) => new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

const getDistributionCount = (n) => displayedGrades.value.filter(g => Math.round(g.value) === n).length;
const getDistributionPercent = (n) => {
  const count = getDistributionCount(n);
  const max = Math.max(1, ...([1,2,3,4,5,6].map(x => getDistributionCount(x))));
  return (count / max) * 100;
};

const addSubject = () => {
  if (!newSubject.value.name.trim()) return;
  subjects.value.push({ 
    id: Date.now().toString(), 
    semester: activeSemester.value, 
    newGradeType: 'Klausur', 
    newGradeWeight: 1, 
    ...newSubject.value 
  });
  saveData();
  showAddSubject.value = false;
  newSubject.value = { name: '', weight: 1, examWeight: 50, color: '#4facfe', icon: '📚' };
};

const deleteSubject = (id) => {
  if (!confirm('Fach und alle Noten löschen?')) return;
  subjects.value = subjects.value.filter(s => s.id !== id);
  grades.value = grades.value.filter(g => g.subjectId !== id);
  saveData();
};

const addGrade = (subject) => {
  if (!subject.newGradeValue || subject.newGradeValue < 1 || subject.newGradeValue > 6) return;
  grades.value.push({ 
    id: Date.now().toString(), 
    subjectId: subject.id, 
    type: subject.newGradeType || 'Klausur', 
    value: subject.newGradeValue, 
    weight: subject.newGradeWeight || 1, 
    date: new Date().toISOString() 
  });
  saveData();
  subject.newGradeValue = null;
};

const deleteGrade = (id) => { grades.value = grades.value.filter(g => g.id !== id); saveData(); };

const addSemester = () => {
  const next = `Semester ${semesters.value.length + 1}`;
  semesters.value.push(next);
  activeSemester.value = next;
  saveData();
};

const saveData = () => {
  localStorage.setItem('grades_subjects_v2', JSON.stringify(subjects.value));
  localStorage.setItem('grades_grades_v2', JSON.stringify(grades.value));
  localStorage.setItem('grades_semesters_v2', JSON.stringify(semesters.value));
};

const loadData = () => {
  const sv2 = localStorage.getItem('grades_subjects_v2') || localStorage.getItem('grades_subjects');
  const gv2 = localStorage.getItem('grades_grades_v2') || localStorage.getItem('grades_grades');
  const semv2 = localStorage.getItem('grades_semesters_v2') || localStorage.getItem('grades_semesters');
  
  if (sv2) {
    // Migration for examWeight
    subjects.value = JSON.parse(sv2).map(s => ({ examWeight: 50, ...s }));
  }
  if (gv2) grades.value = JSON.parse(gv2);
  if (semv2) semesters.value = JSON.parse(semv2);
  
  // Backward comp if completely new but user had it before the refactor with v1 localstorage
  if (!semv2 && !sv2 && !gv2) {
    semesters.value = ['1. Halbjahr', '2. Halbjahr'];
  }
};

onMounted(loadData);
</script>

<style scoped>
.noten-container { min-height: 100vh; background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 50%, #16213e 100%); padding: 2rem; color: white; }
.back-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.2rem; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; color: rgba(255,255,255,0.8); cursor: pointer; font-size: 0.9rem; margin-bottom: 2rem; transition: all 0.2s; }
.back-btn:hover { background: rgba(255,255,255,0.12); color: white; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
.page-title { display: flex; align-items: center; gap: 0.75rem; font-size: 2.2rem; font-weight: 700; margin: 0; background: linear-gradient(135deg, #fff 0%, #ffd93d 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.title-icon { width: 2.5rem; height: 2.5rem; }
.add-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border: none; border-radius: 12px; color: white; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.add-btn:hover { box-shadow: 0 8px 25px rgba(79,172,254,0.4); transform: translateY(-2px); }
.add-btn.small { font-size: 0.9rem; padding: 0.6rem 1.2rem; }

.overview-bar { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
.overview-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.25rem; text-align: center; }
.overview-card.main-avg { border-color: rgba(79,172,254,0.3); }
.ov-label { color: rgba(255,255,255,0.5); font-size: 0.8rem; margin-bottom: 0.25rem; }
.ov-value { font-size: 2rem; font-weight: 700; color: white; }
.ov-badge { font-size: 0.8rem; margin-top: 0.25rem; }

.grade-excellent { color: #10b981 !important; }
.grade-good { color: #4facfe !important; }
.grade-ok { color: #ffd93d !important; }
.grade-poor { color: #ff9ff3 !important; }
.grade-fail { color: #ff6b6b !important; }

.semester-tabs { display: flex; gap: 0.5rem; margin-bottom: 2rem; overflow-x: auto; padding-bottom: 0.5rem; }
.sem-tab { padding: 0.5rem 1.25rem; border-radius: 20px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); cursor: pointer; font-size: 0.9rem; transition: all 0.2s; white-space: nowrap; }
.sem-tab.active { background: rgba(79,172,254,0.15); border-color: #4facfe; color: #4facfe; font-weight:600;}
.sem-tab.add-sem { padding: 0.5rem 0.75rem; }

.subjects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
.subject-card { background: rgba(26,26,46,0.7); backdrop-filter: blur(20px); border-radius: 18px; padding: 1.5rem; border: 1px solid rgba(255,255,255,0.08); border-top: 4px solid var(--accent); }
.subject-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.subject-info { display: flex; gap: 0.75rem; align-items: center; }
.subject-emoji { font-size: 2rem; }
.subject-info h3 { margin: 0; font-size: 1.15rem; }
.subject-weight { color: rgba(255,255,255,0.4); font-size: 0.75rem; }
.subject-avg { font-size: 2rem; font-weight: 700; }

.grades-list { margin-bottom: 1rem; max-height: 200px; overflow-y: auto; }
.grade-item { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.75rem; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 0.4rem; }
.grade-info { display: flex; gap: 0.75rem; align-items: center; flex:1; }
.grade-type { font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
.grade-type.written { background: rgba(79,172,254,0.15); color: #4facfe; }
.grade-type.oral { background: rgba(16,185,129,0.15); color: #10b981; }
.grade-date { font-size: 0.75rem; color: rgba(255,255,255,0.35); }
.grade-actions { display: flex; align-items: center; gap: 0.5rem; }
.grade-value { font-weight: 700; font-size: 1.1rem; }
.grade-weight-badge { font-size: 0.65rem; color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px; }
.delete-grade-btn { background: none; border: none; color: rgba(255,255,255,0.15); cursor: pointer; padding: 2px; }
.delete-grade-btn:hover { color: #ff6b6b; }
.no-grades { text-align: center; color: rgba(255,255,255,0.3); font-size: 0.85rem; padding: 1rem; }

.add-grade-row { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.75rem; }
.grade-select { padding: 0.5rem; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; color: white; font-size: 0.85rem; flex: 1; }
.grade-select option { background: #1a1a2e; }
.grade-input { padding: 0.5rem; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; color: white; font-size: 0.85rem; width: 70px; outline: none; }
.grade-input:focus { border-color: #4facfe; }
.grade-input.small { width: 55px; }
.add-grade-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #4facfe, #00f2fe); border: none; border-radius: 8px; color: white; cursor: pointer; flex-shrink: 0; transition: all 0.2s; }
.add-grade-btn:hover { transform: scale(1.1); }

.subject-actions { display: flex; justify-content: flex-end; }
.sub-action-btn { display: flex; align-items: center; gap: 0.3rem; padding: 0.35rem 0.75rem; border-radius: 8px; border: none; cursor: pointer; font-size: 0.75rem; transition: all 0.2s; }
.sub-action-btn.danger { background: rgba(255,107,107,0.1); color: #ff6b6b; }
.sub-action-btn.danger:hover { background: rgba(255,107,107,0.2); }

.chart-section { max-width: 600px; margin: 2rem auto 0; }
.section-title { display: flex; align-items: center; gap: 0.5rem; font-size: 1.3rem; margin-bottom: 1.5rem; color: rgba(255,255,255,0.9); }
.grade-chart { display: flex; justify-content: space-around; align-items: flex-end; height: 150px; background: rgba(255,255,255,0.03); border-radius: 14px; padding: 1.5rem 1rem 0.5rem; }
.chart-bar-wrapper { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; flex: 1; }
.chart-bar { width: 36px; border-radius: 6px 6px 0 0; min-height: 4px; transition: height 0.5s ease; }
.chart-bar.grade-excellent { background: #10b981; }
.chart-bar.grade-good { background: #4facfe; }
.chart-bar.grade-ok { background: #ffd93d; }
.chart-bar.grade-poor { background: #ff9ff3; }
.chart-bar.grade-fail { background: #ff6b6b; }
.chart-label { font-weight: 700; color: rgba(255,255,255,0.6); font-size: 0.9rem; }
.chart-count { font-size: 0.7rem; color: rgba(255,255,255,0.35); }

.empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem 2rem; color: rgba(255,255,255,0.4); }
.empty-state svg { width: 4rem; height: 4rem; }

/* Modal reuse */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
.modal-content { background: #1a1a2e; border-radius: 16px; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto; border: 1px solid rgba(79,172,254,0.2); }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
.modal-header h3 { display: flex; align-items: center; gap: 0.5rem; margin: 0; font-size: 1.15rem; }
.modal-icon { width: 1.25rem; height: 1.25rem; color: #4facfe; }
.modal-close { width: 2rem; height: 2rem; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white; cursor: pointer; }
.modal-body { padding: 1.5rem; }
.modal-footer { display: flex; gap: 1rem; padding: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1); justify-content: flex-end; }
.form-group { margin-bottom: 1.25rem; }
.row-flex { display: flex; gap: 1rem; }
.form-group label { display: block; color: rgba(255,255,255,0.7); font-size: 0.85rem; margin-bottom: 0.5rem; font-weight: 500; }
.form-input { width: 100%; padding: 0.75rem 1rem; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; color: white; font-size: 0.95rem; outline: none; }
.form-input:focus { border-color: #4facfe; }
.form-input::placeholder { color: rgba(255,255,255,0.3); }
.color-select { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.color-option { width: 32px; height: 32px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: all 0.2s; }
.color-option.selected { border-color: white; transform: scale(1.2); }
.icon-select { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.icon-option { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); cursor: pointer; font-size: 1.2rem; transition: all 0.2s; }
.icon-option.selected { border-color: #4facfe; background: rgba(79,172,254,0.15); }
.btn-primary { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 10px; background: linear-gradient(135deg, #4facfe, #00f2fe); color: white; font-weight: 500; cursor: pointer; border: none; }
.btn-primary:hover { box-shadow: 0 8px 20px rgba(79,172,254,0.4); }
.btn-secondary { padding: 0.75rem 1.5rem; border-radius: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; cursor: pointer; }

@media (max-width: 768px) {
  .overview-bar { grid-template-columns: repeat(2, 1fr); }
  .subjects-grid { grid-template-columns: 1fr; }
  .page-title { font-size: 1.6rem; }
  .add-grade-row { flex-wrap: wrap; }
  .row-flex { flex-direction: column; }
}
</style>
