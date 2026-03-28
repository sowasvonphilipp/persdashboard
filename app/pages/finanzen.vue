<template>
  <div class="finance-container">
    <div class="top-bar">
      <button class="back-btn" @click="navigateTo('/dashboard')"><UIcon name="i-heroicons-arrow-left" /> Dashboard</button>
      <div class="top-actions">
        <button class="action-btn" @click="showImport = true"><UIcon name="i-heroicons-arrow-up-tray" /> Import</button>
        <button class="add-btn" @click="showAdd = true"><UIcon name="i-heroicons-plus" /> Neu</button>
      </div>
    </div>
    <h1 class="page-title"><UIcon name="i-heroicons-wallet" class="title-icon" />Finanzen</h1>

    <!-- Balance Overview -->
    <div class="balance-cards">
      <div class="balance-card income"><div class="bc-icon">📈</div><div><div class="bc-label">Einnahmen</div><div class="bc-val">{{ formatMoney(monthlyIncome) }}</div></div></div>
      <div class="balance-card expense"><div class="bc-icon">📉</div><div><div class="bc-label">Ausgaben</div><div class="bc-val">{{ formatMoney(monthlyExpenses) }}</div></div></div>
      <div class="balance-card total"><div class="bc-icon">💰</div><div><div class="bc-label">Bilanz</div><div class="bc-val" :class="monthlyBalance >= 0 ? 'pos' : 'neg'">{{ formatMoney(monthlyBalance) }}</div></div></div>
    </div>

    <!-- Month Navigation -->
    <div class="month-nav">
      <button @click="changeMonth(-1)"><UIcon name="i-heroicons-chevron-left" /></button>
      <span>{{ monthLabel }}</span>
      <button @click="changeMonth(1)"><UIcon name="i-heroicons-chevron-right" /></button>
    </div>

    <div class="tabs">
      <button :class="{ active: tab === 'list' }" @click="tab = 'list'">📋 Liste</button>
      <button :class="{ active: tab === 'budget' }" @click="tab = 'budget'">🎯 Budget</button>
      <button :class="{ active: tab === 'chart' }" @click="tab = 'chart'">📊 Analyse</button>
      <button :class="{ active: tab === 'savings' }" @click="tab = 'savings'">🏦 Sparziele</button>
      <button :class="{ active: tab === 'recurring' }" @click="tab = 'recurring'">🔁 Abos</button>
    </div>

    <!-- LIST TAB -->
    <div v-if="tab === 'list'" class="tab-content">
      <div v-if="monthTransactions.length === 0" class="empty"><UIcon name="i-heroicons-document-text" /><p>Keine Transaktionen in diesem Monat</p></div>
      <div v-else class="tx-list">
        <div v-for="tx in monthTransactions" :key="tx.id" class="tx-item" :class="tx.type">
          <div class="tx-cat-icon">{{ getCatIcon(tx.category) }}</div>
          <div class="tx-body">
            <span class="tx-title">{{ tx.title }}</span>
            <span class="tx-meta">{{ tx.category }} · {{ formatTxDate(tx.date) }} <span v-if="tx.isRecurring" class="rec-badge">🔁 Abo</span></span>
          </div>
          <div class="tx-amount" :class="tx.type">{{ tx.type === 'income' ? '+' : '-' }}{{ formatMoney(Math.abs(tx.amount)) }}</div>
          <button class="tx-del" @click="deleteTx(tx.id)"><UIcon name="i-heroicons-x-mark" /></button>
        </div>
      </div>
    </div>

    <!-- BUDGET TAB -->
    <div v-if="tab === 'budget'" class="tab-content">
      <div v-for="cat in expenseCategories" :key="cat.id" class="budget-row">
        <div class="budget-header">
          <span>{{ cat.icon }} {{ cat.label }}</span>
          <span class="budget-spent">{{ formatMoney(getCatSpent(cat.id)) }} / {{ formatMoney(budgets[cat.id] || 0) }}</span>
        </div>
        <div class="budget-bar"><div class="budget-fill" :style="{ width: getBudgetPct(cat.id) + '%' }" :class="getBudgetPct(cat.id) > 90 ? 'over' : ''"></div></div>
        <div class="budget-set"><input v-model.number="budgets[cat.id]" type="number" placeholder="Budget €" class="finput xs" @change="saveAll" /></div>
      </div>
    </div>

    <!-- CHART TAB -->
    <div v-if="tab === 'chart'" class="tab-content">
      <h3 class="section-title">Ausgaben nach Kategorie</h3>
      <div v-if="categoryBreakdown.length === 0" class="text-muted" style="text-align:center;">Keine Ausgaben</div>
      <div class="pie-chart" v-else>
        <div v-for="cat in categoryBreakdown" :key="cat.id" class="pie-row">
          <span class="pie-icon">{{ cat.icon }}</span>
          <span class="pie-label">{{ cat.label }}</span>
          <div class="pie-bar"><div class="pie-fill" :style="{ width: cat.pct + '%', background: cat.color }"></div></div>
          <span class="pie-val">{{ formatMoney(cat.amount) }}</span>
          <span class="pie-pct">{{ cat.pct.toFixed(0) }}%</span>
        </div>
      </div>
    </div>

    <!-- SAVINGS TAB -->
    <div v-if="tab === 'savings'" class="tab-content">
      <div class="add-box">
        <h4>Neues Sparziel</h4>
        <div style="display:flex;gap:0.5rem;">
          <input v-model="newGoal.title" placeholder="Wofür sparst du? (z.B. PS5)" class="finput" />
          <input v-model.number="newGoal.target" type="number" placeholder="Ziel €" class="finput sm" />
          <button class="add-btn sm" @click="addSavingsGoal">Speichern</button>
        </div>
      </div>

      <div v-if="savingsGoals.length === 0" class="empty"><UIcon name="i-heroicons-banknotes" /><p>Noch keine Sparziele</p></div>
      <div v-for="g in savingsGoals" :key="g.id" class="savings-card">
        <div class="sc-header">
          <h3>{{ g.title }}</h3>
          <button class="tx-del" @click="deleteGoal(g.id)"><UIcon name="i-heroicons-trash" /></button>
        </div>
        <div class="sc-progress">
          <div class="sc-bar"><div class="sc-fill" :style="{ width: Math.min(100, (g.current / g.target) * 100) + '%' }"></div></div>
          <span class="sc-txt">{{ formatMoney(g.current) }} / {{ formatMoney(g.target) }} ({{ ((g.current / g.target) * 100).toFixed(1) }}%)</span>
        </div>
        <div class="sc-actions">
          <button class="sc-btn" @click="depositGoal(g.id, 50)">+50€</button>
          <button class="sc-btn" @click="depositGoal(g.id, 100)">+100€</button>
          <input type="number" placeholder="Betrag..." class="finput xs" style="margin-left:auto;" @keyup.enter="(e) => { depositGoal(g.id, parseFloat(e.target.value)); e.target.value=''; }" />
        </div>
      </div>
    </div>

    <!-- RECURRING TAB -->
    <div v-if="tab === 'recurring'" class="tab-content">
      <div class="add-box">
        <h4>Neues Abo / Wiederkehrend</h4>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          <input v-model="newRec.title" placeholder="Name (z.B. Netflix)" class="finput" style="min-width:150px;" />
          <input v-model.number="newRec.amount" type="number" placeholder="Betrag €" class="finput sm" />
          <select v-model="newRec.type" class="finput sm">
            <option value="expense">Ausgabe</option>
            <option value="income">Einnahme</option>
          </select>
          <button class="add-btn sm" @click="addRecurring">Hinzufügen</button>
        </div>
      </div>

      <div v-if="recurringTxs.length === 0" class="empty"><UIcon name="i-heroicons-arrow-path" /><p>Keine wiederkehrenden Zahlungen</p></div>
      <div v-for="r in recurringTxs" :key="r.id" class="tx-item" :class="r.type">
        <div class="tx-cat-icon">🔁</div>
        <div class="tx-body">
          <span class="tx-title">{{ r.title }}</span>
          <span class="tx-meta">Monatlich · Nächste: {{ formatTxDate(r.nextDate) }}</span>
        </div>
        <div class="tx-amount" :class="r.type">{{ r.type === 'income' ? '+' : '-' }}{{ formatMoney(Math.abs(r.amount)) }}</div>
        <button class="tx-del" @click="deleteRecurring(r.id)"><UIcon name="i-heroicons-trash" /></button>
      </div>
    </div>

    <!-- ADD TRANSACTION MODAL -->
    <div v-if="showAdd" class="modal-overlay" @click="showAdd = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header"><h3><UIcon name="i-heroicons-plus-circle" class="mi" /> Transaktion</h3><button class="modal-close" @click="showAdd = false"><UIcon name="i-heroicons-x-mark" /></button></div>
        <div class="modal-body">
          <div class="fg"><label>Typ</label><div class="opt-row"><button class="opt-btn" :class="{ sel: newTx.type === 'expense' }" @click="newTx.type = 'expense'">📉 Ausgabe</button><button class="opt-btn" :class="{ sel: newTx.type === 'income' }" @click="newTx.type = 'income'">📈 Einnahme</button></div></div>
          <div class="fg"><label>Titel</label><input v-model="newTx.title" type="text" placeholder="z.B. Supermarkt" class="finput" /></div>
          <div class="fg"><label>Betrag (€)</label><input v-model.number="newTx.amount" type="number" step="0.01" class="finput" /></div>
          <div class="fg"><label>Datum</label><input v-model="newTx.date" type="date" class="finput" /></div>
          <div class="fg"><label>Kategorie</label><div class="opt-row"><button v-for="c in (newTx.type === 'expense' ? expenseCategories : incomeCategories)" :key="c.id" class="opt-btn" :class="{ sel: newTx.category === c.id }" @click="newTx.category = c.id">{{ c.icon }} {{ c.label }}</button></div></div>
        </div>
        <div class="modal-footer"><button class="btn-secondary" @click="showAdd = false">Abbrechen</button><button class="btn-primary" @click="addTransaction"><UIcon name="i-heroicons-check" /> Speichern</button></div>
      </div>
    </div>

    <!-- IMPORT MODAL -->
    <div v-if="showImport" class="modal-overlay" @click="showImport = false">
      <div class="modal-content modal-lg" @click.stop>
        <div class="modal-header"><h3><UIcon name="i-heroicons-arrow-up-tray" class="mi" /> JSON Import</h3><button class="modal-close" @click="showImport = false"><UIcon name="i-heroicons-x-mark" /></button></div>
        <div class="modal-body">
          <div class="import-info">
            <p>Kopiere die JSON-Vorlage und gib sie zusammen mit deinem Kontoauszug-Screenshot in <strong>Gemini</strong> ein. Gemini erstellt dir die JSON-Datei zum Importieren.</p>
            <button class="copy-template-btn" @click="copyTemplate"><UIcon name="i-heroicons-clipboard-document" /> Vorlage kopieren</button>
          </div>
          <div class="fg"><label>JSON einfügen</label><textarea v-model="importJson" class="finput json-input" rows="8" placeholder='[{"title":"Supermarkt","amount":45.50,"type":"expense","category":"food","date":"2026-03-28"}]'></textarea></div>
          <p v-if="importError" class="err-msg">{{ importError }}</p>
          <p v-if="importSuccess" class="success-msg">{{ importSuccess }}</p>
        </div>
        <div class="modal-footer"><button class="btn-secondary" @click="showImport = false">Schließen</button><button class="btn-primary" @click="importTransactions"><UIcon name="i-heroicons-arrow-up-tray" /> Importieren</button></div>
      </div>
    </div>
  </div>
</template>

<script setup>
const transactions = ref([]);
const budgets = ref({});
const savingsGoals = ref([]);
const recurringTxs = ref([]);

const showAdd = ref(false);
const showImport = ref(false);
const tab = ref('list');
const currentMonth = ref(new Date().getMonth());
const currentYear = ref(new Date().getFullYear());
const importJson = ref('');
const importError = ref('');
const importSuccess = ref('');

const newGoal = ref({ title: '', target: null });
const newRec = ref({ title: '', amount: null, type: 'expense', category: 'other' });

const expenseCategories = [
  { id: 'food', label: 'Essen', icon: '🍔', color: '#ff6b6b' },
  { id: 'transport', label: 'Transport', icon: '🚌', color: '#4facfe' },
  { id: 'entertainment', label: 'Freizeit', icon: '🎮', color: '#a29bfe' },
  { id: 'school', label: 'Schule', icon: '📚', color: '#ffd93d' },
  { id: 'sport', label: 'Sport', icon: '🏋️', color: '#10b981' },
  { id: 'clothes', label: 'Kleidung', icon: '👕', color: '#ff9ff3' },
  { id: 'tech', label: 'Technik', icon: '💻', color: '#54a0ff' },
  { id: 'other', label: 'Sonstiges', icon: '📌', color: '#636e72' },
];
const incomeCategories = [
  { id: 'salary', label: 'Gehalt', icon: '💼', color: '#10b981' },
  { id: 'gift', label: 'Geschenk', icon: '🎁', color: '#ffd93d' },
  { id: 'other_income', label: 'Sonstiges', icon: '💰', color: '#4facfe' },
];
const allCats = [...expenseCategories, ...incomeCategories];
const getCatIcon = (id) => allCats.find(c => c.id === id)?.icon || '📌';

const newTx = ref({ title: '', amount: null, type: 'expense', category: 'food', date: new Date().toISOString().split('T')[0] });
const monthLabel = computed(() => `${['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'][currentMonth.value]} ${currentYear.value}`);
const monthTransactions = computed(() => transactions.value.filter(tx => { const d = new Date(tx.date); return d.getMonth() === currentMonth.value && d.getFullYear() === currentYear.value; }).sort((a, b) => b.date.localeCompare(a.date)));
const monthlyIncome = computed(() => monthTransactions.value.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0));
const monthlyExpenses = computed(() => monthTransactions.value.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0));
const monthlyBalance = computed(() => monthlyIncome.value - monthlyExpenses.value);

const getCatSpent = (catId) => monthTransactions.value.filter(t => t.category === catId && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
const getBudgetPct = (catId) => { const b = budgets.value[catId]; if (!b) return 0; return Math.min(100, (getCatSpent(catId) / b) * 100); };

const categoryBreakdown = computed(() => {
  const total = monthlyExpenses.value || 1;
  return expenseCategories.map(c => ({ ...c, amount: getCatSpent(c.id), pct: (getCatSpent(c.id) / total) * 100 })).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);
});

const formatMoney = (v) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);
const formatTxDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
const changeMonth = (dir) => { currentMonth.value += dir; if (currentMonth.value > 11) { currentMonth.value = 0; currentYear.value++; } if (currentMonth.value < 0) { currentMonth.value = 11; currentYear.value--; } };

const addTransaction = () => {
  if (!newTx.value.title.trim() || !newTx.value.amount) return;
  transactions.value.push({ id: Date.now().toString(), ...JSON.parse(JSON.stringify(newTx.value)) });
  saveAll(); showAdd.value = false;
  newTx.value = { title: '', amount: null, type: 'expense', category: 'food', date: new Date().toISOString().split('T')[0] };
};
const deleteTx = (id) => { transactions.value = transactions.value.filter(t => t.id !== id); saveAll(); };

// --- Savings Goals ---
const addSavingsGoal = () => {
  if (!newGoal.value.title.trim() || !newGoal.value.target) return;
  savingsGoals.value.push({ id: Date.now().toString(), title: newGoal.value.title, target: newGoal.value.target, current: 0 });
  saveAll();
  newGoal.value = { title: '', target: null };
};
const deleteGoal = (id) => { savingsGoals.value = savingsGoals.value.filter(g => g.id !== id); saveAll(); };
const depositGoal = (id, amount) => {
  if (isNaN(amount) || amount <= 0) return;
  const g = savingsGoals.value.find(x => x.id === id);
  if (g) {
    g.current += amount;
    // Log negative transaction from budget conceptually? Not implemented unless requested, keep it separate for now.
    saveAll();
  }
};

// --- Recurring ---
const addRecurring = () => {
  if (!newRec.value.title.trim() || !newRec.value.amount) return;
  const nextD = new Date();
  nextD.setMonth(nextD.getMonth() + 1); // defaulting to next month same day
  recurringTxs.value.push({
    id: Date.now().toString(),
    title: newRec.value.title,
    amount: newRec.value.amount,
    type: newRec.value.type,
    category: newRec.value.category,
    interval: 'monthly',
    nextDate: nextD.toISOString().split('T')[0]
  });
  saveAll();
  newRec.value = { title: '', amount: null, type: 'expense', category: 'other' };
};
const deleteRecurring = (id) => { recurringTxs.value = recurringTxs.value.filter(r => r.id !== id); saveAll(); };

const processRecurring = () => {
  const today = new Date().toISOString().split('T')[0];
  let changed = false;
  recurringTxs.value.forEach(r => {
    while (r.nextDate <= today) {
      transactions.value.push({
        id: Date.now().toString() + Math.random(),
        title: r.title,
        amount: r.amount,
        type: r.type,
        category: r.category,
        date: r.nextDate,
        isRecurring: true
      });
      // Add a month
      const nd = new Date(r.nextDate);
      nd.setMonth(nd.getMonth() + 1);
      r.nextDate = nd.toISOString().split('T')[0];
      changed = true;
    }
  });
  if (changed) saveAll();
};

const copyTemplate = () => {
  const template = `Bitte konvertiere meinen Kontoauszug in dieses JSON-Format. Jede Transaktion braucht:
- "title": Beschreibung der Transaktion
- "amount": Betrag als Zahl (immer positiv)
- "type": "expense" für Ausgaben, "income" für Einnahmen
- "category": Eine dieser Kategorien: food, transport, entertainment, school, sport, clothes, tech, other, salary, gift, other_income
- "date": Datum im Format YYYY-MM-DD

Beispiel:
[
  {"title":"Rewe Einkauf","amount":45.50,"type":"expense","category":"food","date":"2026-03-28"},
  {"title":"Taschengeld","amount":50.00,"type":"income","category":"gift","date":"2026-03-01"}
]

Hier ist mein Kontoauszug:`;
  navigator.clipboard.writeText(template);
  alert('Vorlage kopiert! Füge sie in Gemini zusammen mit deinem Kontoauszug-Screenshot ein.');
};

const importTransactions = () => {
  importError.value = ''; importSuccess.value = '';
  try {
    const data = JSON.parse(importJson.value);
    if (!Array.isArray(data)) throw new Error('Muss ein Array sein');
    let count = 0;
    data.forEach(item => {
      if (item.title && item.amount && item.type && item.date) {
        transactions.value.push({ id: Date.now().toString() + Math.random(), title: item.title, amount: Math.abs(item.amount), type: item.type, category: item.category || 'other', date: item.date });
        count++;
      }
    });
    saveAll(); importSuccess.value = `${count} Transaktionen importiert!`; importJson.value = '';
  } catch (e) { importError.value = 'Ungültiges JSON: ' + e.message; }
};

const saveAll = () => {
  localStorage.setItem('finance_transactions', JSON.stringify(transactions.value));
  localStorage.setItem('finance_budgets', JSON.stringify(budgets.value));
  localStorage.setItem('finance_savings', JSON.stringify(savingsGoals.value));
  localStorage.setItem('finance_recurring', JSON.stringify(recurringTxs.value));
};

const load = () => {
  const t = localStorage.getItem('finance_transactions'); if (t) transactions.value = JSON.parse(t);
  const b = localStorage.getItem('finance_budgets'); if (b) budgets.value = JSON.parse(b);
  const s = localStorage.getItem('finance_savings'); if (s) savingsGoals.value = JSON.parse(s);
  const r = localStorage.getItem('finance_recurring'); if (r) recurringTxs.value = JSON.parse(r);
  processRecurring();
};
onMounted(load);
</script>

<style scoped>
.finance-container { min-height:100vh; background:linear-gradient(135deg,#0f0f1e 0%,#1a1a2e 50%,#16213e 100%); padding:2rem; color:white; }
.top-bar { display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; }
.top-actions { display:flex; gap:0.5rem; }
.back-btn,.action-btn { display:inline-flex; align-items:center; gap:0.5rem; padding:0.6rem 1.2rem; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:12px; color:rgba(255,255,255,0.8); cursor:pointer; font-size:0.9rem; }
.back-btn:hover,.action-btn:hover { background:rgba(255,255,255,0.12); }
.add-btn { display:inline-flex; align-items:center; gap:0.5rem; padding:0.6rem 1.2rem; background:linear-gradient(135deg,#4facfe,#00f2fe); border:none; border-radius:12px; color:white; font-weight:600; cursor:pointer; font-size:0.9rem; }
.add-btn.sm { font-size:0.8rem; padding:0.55rem 1rem; border-radius:10px; }
.page-title { display:flex; align-items:center; gap:0.75rem; font-size:2.2rem; font-weight:700; margin:0 0 2rem; background:linear-gradient(135deg,#fff,#ffd93d); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
.title-icon { width:2.5rem; height:2.5rem; }

.balance-cards { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; margin-bottom:1.5rem; }
.balance-card { display:flex; align-items:center; gap:1rem; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:1.25rem; }
.bc-icon { font-size:1.8rem; }
.bc-label { color:rgba(255,255,255,0.5); font-size:0.75rem; }
.bc-val { font-size:1.3rem; font-weight:700; }
.balance-card.income .bc-val { color:#10b981; }
.balance-card.expense .bc-val { color:#ff6b6b; }
.bc-val.pos { color:#10b981; }
.bc-val.neg { color:#ff6b6b; }

.month-nav { display:flex; align-items:center; justify-content:center; gap:1.5rem; margin-bottom:1.5rem; }
.month-nav button { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:8px; color:white; cursor:pointer; padding:0.4rem; }
.month-nav span { font-weight:600; font-size:1.1rem; }

.tabs { display:flex; gap:0.4rem; margin-bottom:1.5rem; background:rgba(255,255,255,0.04); border-radius:12px; padding:4px; flex-wrap:wrap;}
.tabs button { flex:1; padding:0.65rem; border-radius:10px; background:none; border:none; color:rgba(255,255,255,0.5); cursor:pointer; font-size:0.85rem; transition:all 0.2s; min-width:100px; text-align:center;}
.tabs button.active { background:rgba(255,217,61,0.2); color:#ffd93d; font-weight:600;}
.tab-content { animation:fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

.tx-item { display:flex; align-items:center; gap:0.75rem; padding:0.75rem 1rem; background:rgba(255,255,255,0.04); border-radius:12px; margin-bottom:0.4rem; border-left:3px solid transparent;}
.tx-item.expense { border-left-color: rgba(255,107,107,0.3); }
.tx-item.income { border-left-color: rgba(16,185,129,0.3); }
.tx-cat-icon { font-size:1.3rem; }
.tx-body { flex:1; } .tx-title { display:block; font-size:0.9rem; } .tx-meta { font-size:0.7rem; color:rgba(255,255,255,0.35); display:flex; gap:0.5rem; align-items:center;}
.tx-amount { font-weight:700; font-size:0.95rem; } .tx-amount.income { color:#10b981; } .tx-amount.expense { color:#ff6b6b; }
.tx-del { background:none; border:none; color:rgba(255,255,255,0.15); cursor:pointer; }
.tx-del:hover { color:#ff6b6b; }
.rec-badge { background:rgba(79,172,254,0.15); color:#4facfe; padding:2px 6px; border-radius:4px; font-size:0.6rem; font-weight:600; }

.budget-row { margin-bottom:1rem; } .budget-header { display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:0.3rem; }
.budget-spent { color:rgba(255,255,255,0.5); font-size:0.8rem; }
.budget-bar { height:8px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden; margin-bottom:0.3rem; }
.budget-fill { height:100%; background:linear-gradient(90deg,#4facfe,#00f2fe); border-radius:4px; transition:width 0.5s; }
.budget-fill.over { background:linear-gradient(90deg,#ff6b6b,#ee5a24); }
.budget-set { display:flex; align-items:center; gap:0.5rem; }

.section-title { font-size:1rem; font-weight:600; margin:0 0 1rem; color:rgba(255,255,255,0.8); }
.pie-row { display:flex; align-items:center; gap:0.5rem; margin-bottom:0.6rem; font-size:0.85rem; }
.pie-icon { font-size:1rem; } .pie-label { min-width:70px; } .pie-bar { flex:1; height:8px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden; }
.pie-fill { height:100%; border-radius:4px; } .pie-val { min-width:70px; text-align:right; color:rgba(255,255,255,0.7); } .pie-pct { min-width:35px; text-align:right; color:rgba(255,255,255,0.4); }

.add-box { background:rgba(255,255,255,0.03); padding:1rem; border-radius:12px; margin-bottom:1.5rem; border:1px solid rgba(255,255,255,0.08); }
.add-box h4 { margin:0 0 0.8rem; font-size:0.9rem; color:#4facfe; }

.savings-card { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:1.25rem; margin-bottom:1rem; }
.sc-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem; }
.sc-header h3 { margin:0; font-size:1.1rem; }
.sc-progress { margin-bottom:1rem; }
.sc-bar { height:8px; background:rgba(255,255,255,0.08); border-radius:4px; overflow:hidden; margin-bottom:0.4rem;}
.sc-fill { height:100%; background:linear-gradient(90deg,#10b981,#34d399); transition:width 0.4s; }
.sc-txt { font-size:0.8rem; color:rgba(255,255,255,0.6); }
.sc-actions { display:flex; gap:0.5rem; align-items:center; }
.sc-btn { background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.3); color:#10b981; padding:0.4rem 0.8rem; border-radius:8px; font-size:0.8rem; cursor:pointer; }
.sc-btn:hover { background:rgba(16,185,129,0.25); }

.import-info { background:rgba(79,172,254,0.08); border:1px solid rgba(79,172,254,0.2); border-radius:12px; padding:1rem; margin-bottom:1rem; }
.import-info p { margin:0 0 0.75rem; font-size:0.85rem; color:rgba(255,255,255,0.7); line-height:1.5; }
.copy-template-btn { display:flex; align-items:center; gap:0.4rem; padding:0.5rem 1rem; background:rgba(79,172,254,0.15); border:1px solid rgba(79,172,254,0.3); border-radius:8px; color:#4facfe; cursor:pointer; font-size:0.85rem; }
.json-input { font-family:monospace; font-size:0.8rem; resize:vertical; }
.err-msg { color:#ff6b6b; font-size:0.8rem; margin:0.5rem 0; }
.success-msg { color:#10b981; font-size:0.8rem; margin:0.5rem 0; }
.text-muted { color:rgba(255,255,255,0.4); }

.empty { display:flex; flex-direction:column; align-items:center; gap:0.5rem; padding:3rem; color:rgba(255,255,255,0.3); }
.empty svg { width:3rem; height:3rem; }

.modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:1000; padding:1rem; }
.modal-content { background:#1a1a2e; border-radius:16px; max-width:550px; width:100%; max-height:90vh; overflow-y:auto; border:1px solid rgba(255,217,61,0.2); }
.modal-content.modal-lg { max-width:650px; }
.modal-header { display:flex; justify-content:space-between; align-items:center; padding:1.5rem; border-bottom:1px solid rgba(255,255,255,0.1); }
.modal-header h3 { display:flex; align-items:center; gap:0.5rem; margin:0; font-size:1.1rem; }
.mi { width:1.25rem; height:1.25rem; color:#ffd93d; }
.modal-close { width:2rem; height:2rem; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:white; cursor:pointer; }
.modal-body { padding:1.5rem; } .modal-footer { display:flex; gap:1rem; padding:1.5rem; border-top:1px solid rgba(255,255,255,0.1); justify-content:flex-end; }
.fg { margin-bottom:1rem; } .fg label { display:block; color:rgba(255,255,255,0.6); font-size:0.8rem; margin-bottom:0.4rem; }
.finput { width:100%; padding:0.65rem 0.9rem; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:10px; color:white; font-size:0.9rem; outline:none; box-sizing:border-box; }
.finput:focus { border-color:#ffd93d; } .finput::placeholder { color:rgba(255,255,255,0.3); }
.finput.xs { max-width:100px; padding:0.4rem 0.6rem; font-size:0.8rem; }
.finput.sm { max-width:140px; }
.opt-row { display:flex; gap:0.4rem; flex-wrap:wrap; }
.opt-btn { padding:0.4rem 0.7rem; border-radius:8px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.6); cursor:pointer; font-size:0.78rem; transition:all 0.2s; }
.opt-btn.sel { background:rgba(255,217,61,0.15); border-color:#ffd93d; color:#ffd93d; }
.btn-primary { display:flex; align-items:center; gap:0.5rem; padding:0.7rem 1.3rem; border-radius:10px; background:linear-gradient(135deg,#ffd93d,#f9ca24); color:#1a1a2e; font-weight:600; cursor:pointer; border:none; }
.btn-secondary { padding:0.7rem 1.3rem; border-radius:10px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:white; cursor:pointer; }

@media (max-width:768px) {
  .balance-cards { grid-template-columns:1fr; }
  .page-title { font-size:1.6rem; }
  .top-actions { flex-direction:column; gap:0.3rem; }
}
</style>
