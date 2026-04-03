<template>
  <div class="news-page">
    <!-- Sticky top bar -->
    <div class="top-bar">
      <NuxtLink to="/dashboard" class="back-btn">
        <UIcon name="i-heroicons-arrow-left" style="width:16px;height:16px" /> Dashboard
      </NuxtLink>
      <h1 class="page-title">📰 Nachrichten</h1>
      <div class="top-bar-right">
        <span class="results-badge" v-if="articles.length">{{ articles.length }}</span>
      </div>
    </div>

    <!-- Category pill bar -->
    <div class="cat-scroll-wrap">
      <div class="cat-scroll">
        <button
          v-for="cat in categories"
          :key="cat.value"
          class="cat-pill"
          :class="{ active: selectedCategory === cat.value }"
          @click="selectCategory(cat.value)"
        >
          {{ cat.emoji }} {{ cat.label }}
        </button>
      </div>
    </div>

    <!-- Search + date row -->
    <div class="search-row">
      <div class="search-box">
        <UIcon name="i-heroicons-magnifying-glass" style="width:16px;height:16px;flex-shrink:0" />
        <input v-model="searchQuery" type="text" placeholder="Suchen..." @input="onSearchInput" />
        <button v-if="searchQuery" class="clear-btn" @click="clearSearch">
          <UIcon name="i-heroicons-x-mark" style="width:14px;height:14px" />
        </button>
      </div>
      <div class="date-pills">
        <button
          v-for="range in dateRanges"
          :key="range.value"
          class="date-pill"
          :class="{ active: selectedDateRange === range.value }"
          @click="selectDateRange(range.value)"
        >
          {{ range.label }}
        </button>
      </div>
    </div>

    <div class="container">

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <UIcon name="i-heroicons-loader-2" class="spinning" />
        Nachrichten werden geladen...
      </div>

      <!-- Error State -->
      <div v-else-if="newsError" class="error-state">
        <UIcon name="i-heroicons-alert-circle" />
        {{ newsError }}
        <button class="retry-btn" @click="fetchNews">
          Erneut versuchen
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="articles.length === 0" class="empty-state">
        <UIcon name="i-heroicons-newspaper" />
        <p>Keine Artikel gefunden</p>
        <button class="retry-btn" @click="resetFilters">
          Filter zurücksetzen
        </button>
      </div>

      <!-- Articles Grid -->
      <div v-else class="articles-grid">
        <article 
          v-for="article in articles" 
          :key="article.url"
          class="article-card"
          @click="openArticle(article.url)"
        >
          <div v-if="article.urlToImage" class="article-image">
            <img :src="article.urlToImage" :alt="article.title" @error="handleImageError" />
          </div>
          <div class="article-content">
            <div class="article-meta">
              <span class="source">{{ article.source.name }}</span>
              <span class="date">{{ formatDate(article.publishedAt) }}</span>
            </div>
            <h3>{{ article.title }}</h3>
            <p class="description">{{ article.description }}</p>
            <div class="article-footer">
              <button class="read-more" @click.stop="openArticle(article.url)">
                Artikel lesen
                <UIcon name="i-heroicons-external-link" />
              </button>
            </div>
          </div>
        </article>
      </div>

      <!-- Load More -->
      <div v-if="articles.length > 0 && hasMore && !isLoading" class="load-more">
        <button class="load-more-btn" @click="loadMore">
          <UIcon name="i-heroicons-plus-circle" style="width:18px;height:18px" />
          Mehr laden
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const config = useRuntimeConfig();
const NEWS_API_KEY = '1ab37bb60011434a846cb415fe0f8eef';

// Data
const articles = ref([]);
const isLoading = ref(false);
const newsError = ref('');
const searchQuery = ref('');
const settings = JSON.parse(localStorage.getItem('app_settings') || '{}');
const selectedCategory = ref(settings.newsDefaultCategory || 'general');
const selectedDateRange = ref('today');
const currentPage = ref(1);
const pageSize = 20;
const hasMore = ref(true);
let searchTimeout = null;

// Categories
const categories = [
  { value: 'general', label: 'Allgemein', emoji: '🗞️' },
  { value: 'technology', label: 'Tech', emoji: '💻' },
  { value: 'business', label: 'Wirtschaft', emoji: '📈' },
  { value: 'health', label: 'Gesundheit', emoji: '🏥' },
  { value: 'sports', label: 'Sport', emoji: '⚽' },
  { value: 'entertainment', label: 'Unterhaltung', emoji: '🎬' },
  { value: 'science', label: 'Wissenschaft', emoji: '🔬' },
];

// Date ranges
const dateRanges = [
  { value: 'today', label: 'Heute' },
  { value: 'week', label: 'Diese Woche' },
  { value: 'month', label: 'Dieser Monat' }
];

// Methods
const selectCategory = (category) => {
  selectedCategory.value = category;
  currentPage.value = 1;
  articles.value = [];
  fetchNews();
};

const selectDateRange = (range) => {
  selectedDateRange.value = range;
  currentPage.value = 1;
  articles.value = [];
  fetchNews();
};

const onSearchInput = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    articles.value = [];
    fetchNews();
  }, 500);
};

const clearSearch = () => {
  searchQuery.value = '';
  currentPage.value = 1;
  articles.value = [];
  fetchNews();
};

const resetFilters = () => {
  selectedCategory.value = 'general';
  selectedDateRange.value = 'today';
  searchQuery.value = '';
  currentPage.value = 1;
  articles.value = [];
  fetchNews();
};

const getDateRange = () => {
  const today = new Date();
  const from = new Date();
  
  switch (selectedDateRange.value) {
    case 'today':
      from.setDate(today.getDate() - 1);
      break;
    case 'week':
      from.setDate(today.getDate() - 7);
      break;
    case 'month':
      from.setMonth(today.getMonth() - 1);
      break;
  }
  
  return from.toISOString().split('T')[0];
};

const fetchNews = async () => {
  try {
    isLoading.value = true;
    newsError.value = '';
    
    const fromDate = getDateRange();
    let params = {
      pageSize,
      page: currentPage.value,
    };
    
    if (searchQuery.value.trim()) {
      params.q = searchQuery.value.trim();
      params.from = fromDate;
    } else {
      params.category = selectedCategory.value;
    }
    
    const response = await $fetch('/api/news', { params });
    
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
      
      if (currentPage.value === 1) {
        articles.value = filtered;
      } else {
        articles.value = [...articles.value, ...filtered];
      }
      
      hasMore.value = filtered.length === pageSize;
      
      if (articles.value.length === 0) {
        newsError.value = 'Keine Artikel gefunden';
      }
    } else {
      newsError.value = 'Nachrichten nicht verfügbar';
    }
  } catch (error) {
    console.error('Fehler beim Abrufen der Nachrichten:', error);
    
    if (error.status === 401 || error.status === 403) {
      newsError.value = 'API-Schlüssel ungültig';
    } else if (error.status === 426) {
      newsError.value = 'API-Upgrade erforderlich';
    } else if (error.status === 429) {
      newsError.value = 'Zu viele Anfragen - bitte später erneut versuchen';
    } else {
      newsError.value = 'Fehler beim Laden der Nachrichten';
    }
  } finally {
    isLoading.value = false;
  }
};

const loadMore = () => {
  currentPage.value++;
  fetchNews();
};

const openArticle = (url) => {
  window.open(url, '_blank');
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 60) {
    return `vor ${diffMins} Min.`;
  } else if (diffHours < 24) {
    return `vor ${diffHours} Std.`;
  } else if (diffDays === 1) {
    return 'Gestern';
  } else if (diffDays < 7) {
    return `vor ${diffDays} Tagen`;
  } else {
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
  }
};

const handleImageError = (e) => {
  e.target.style.display = 'none';
};

// Initialize
onMounted(() => {
  fetchNews();
});
</script>

<style scoped>
.news-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 50%, #16213e 100%);
  color: white;
  padding-bottom: 4rem;
}

/* ── Top Bar ───────────────────────────────────── */
.top-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(15,15,30,0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(79,172,254,0.15);
  position: sticky;
  top: 0;
  z-index: 100;
}
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  background: rgba(79,172,254,0.1);
  border: 1px solid rgba(79,172,254,0.25);
  border-radius: 10px;
  color: #4facfe;
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
}
.page-title {
  flex: 1;
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: white;
}
.top-bar-right { display:flex; align-items:center; }
.results-badge {
  font-size: 0.72rem;
  padding: 0.15rem 0.5rem;
  background: rgba(79,172,254,0.15);
  border: 1px solid rgba(79,172,254,0.3);
  border-radius: 20px;
  color: #4facfe;
  font-weight: 600;
}

/* ── Category scroll ───────────────────────────── */
.cat-scroll-wrap {
  background: rgba(15,15,30,0.9);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  padding: 0.6rem 0;
}
.cat-scroll {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0 1rem;
  scrollbar-width: none;
}
.cat-scroll::-webkit-scrollbar { display: none; }
.cat-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.9rem;
  border-radius: 20px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.65);
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}
.cat-pill:hover { background: rgba(255,255,255,0.1); }
.cat-pill.active {
  background: linear-gradient(135deg,#4facfe,#00f2fe);
  border-color: #4facfe;
  color: white;
  font-weight: 600;
}

/* ── Search row ────────────────────────────────── */
.search-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.85rem;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 10px;
  transition: border-color 0.2s;
}
.search-box:focus-within { border-color: #4facfe; }
.search-box input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: white;
  font-size: 0.9rem;
  min-width: 0;
}
.search-box input::placeholder { color: rgba(255,255,255,0.35); }
.clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  background: rgba(255,255,255,0.1);
  border: none;
  border-radius: 5px;
  color: rgba(255,255,255,0.6);
  cursor: pointer;
}
.date-pills {
  display: flex;
  gap: 0.35rem;
  flex-shrink: 0;
}
.date-pill {
  padding: 0.45rem 0.7rem;
  border-radius: 8px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.6);
  font-size: 0.78rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}
.date-pill.active {
  background: rgba(79,172,254,0.15);
  border-color: #4facfe;
  color: #4facfe;
  font-weight: 600;
}

/* ── Container & states ─────────────────────────────────── */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  color: rgba(255,255,255,0.6);
  font-size: 0.95rem;
  text-align: center;
}
.error-state { color: #fca5a5; }
.loading-state svg, .error-state svg, .empty-state svg {
  width: 2.5rem; height: 2.5rem; color: #4facfe;
}
.error-state svg { color: #ef4444; }
.spinning { animation: spin 1s linear infinite; }
@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }

.retry-btn {
  padding: 0.6rem 1.2rem;
  background: rgba(79,172,254,0.15);
  border: 1px solid rgba(79,172,254,0.3);
  border-radius: 10px;
  color: #4facfe;
  font-weight: 600;
  cursor: pointer;
}

/* ── Articles grid ──────────────────────────────────────── */
.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.article-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s;
  display: flex;
  flex-direction: column;
}
.article-card:hover {
  transform: translateY(-3px);
  border-color: rgba(79,172,254,0.3);
}
.article-image {
  width: 100%;
  height: 160px;
  overflow: hidden;
  background: rgba(0,0,0,0.3);
}
.article-image img {
  width: 100%; height: 100%; object-fit: cover;
  transition: transform 0.4s;
}
.article-card:hover .article-image img { transform: scale(1.04); }

.article-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}
.article-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.source {
  padding: 0.2rem 0.6rem;
  background: rgba(79,172,254,0.15);
  border-radius: 6px;
  color: #4facfe;
  font-size: 0.72rem;
  font-weight: 600;
}
.date { color: rgba(255,255,255,0.4); font-size: 0.78rem; }

.article-content h3 {
  color: white;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.4;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.description {
  color: rgba(255,255,255,0.6);
  font-size: 0.82rem;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}
.article-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 0.6rem;
  border-top: 1px solid rgba(255,255,255,0.07);
}
.read-more {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.85rem;
  background: rgba(79,172,254,0.1);
  border: 1px solid rgba(79,172,254,0.25);
  border-radius: 7px;
  color: #4facfe;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

/* ── Load more ──────────────────────────────────────────── */
.load-more {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}
.load-more-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg,#4facfe,#00f2fe);
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

/* ── Mobile ─────────────────────────────────────────────── */
@media (max-width: 600px) {
  .articles-grid { grid-template-columns: 1fr; }
  .article-image { height: 130px; }
  .date-pills { display: none; }
}
