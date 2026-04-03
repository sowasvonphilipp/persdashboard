<template>
  <div class="news-page">
    <div class="page-header">
      <div class="header-content">
        <NuxtLink to="/dashboard" class="back-btn">
          <UIcon name="i-heroicons-arrow-left" />
          Zurück
        </NuxtLink>
        <div>
          <h1>Nachrichten</h1>
          <p class="subtitle">Aktuelle News aus aller Welt</p>
        </div>
      </div>
    </div>

    <div class="container">
      <!-- Filters -->
      <div class="filters-section">
        <div class="filter-group">
          <label>Kategorie</label>
          <div class="filter-buttons">
            <button 
              v-for="cat in categories" 
              :key="cat.value"
              class="filter-btn"
              :class="{ active: selectedCategory === cat.value }"
              @click="selectCategory(cat.value)"
            >
              <UIcon :name="cat.icon" />
              {{ cat.label }}
            </button>
          </div>
        </div>

        <div class="filter-group">
          <label>Zeitraum</label>
          <div class="filter-buttons">
            <button 
              v-for="range in dateRanges" 
              :key="range.value"
              class="filter-btn"
              :class="{ active: selectedDateRange === range.value }"
              @click="selectDateRange(range.value)"
            >
              {{ range.label }}
            </button>
          </div>
        </div>

        <div class="filter-group search-group">
          <label>Suche</label>
          <div class="search-box">
            <UIcon name="i-heroicons-magnifying-glass" />
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Artikel durchsuchen..."
              @input="onSearchInput"
            />
            <button v-if="searchQuery" class="clear-btn" @click="clearSearch">
              <UIcon name="i-heroicons-x-mark" />
            </button>
          </div>
        </div>
      </div>

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
          <UIcon name="i-heroicons-plus-circle" />
          Mehr laden
        </button>
      </div>

      <!-- Results Count -->
      <div v-if="articles.length > 0" class="results-info">
        {{ articles.length }} Artikel geladen
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
const selectedCategory = ref('general');
const selectedDateRange = ref('today');
const currentPage = ref(1);
const pageSize = 20;
const hasMore = ref(true);
let searchTimeout = null;

// Categories
const categories = [
  { value: 'general', label: 'Allgemein', icon: 'i-heroicons-newspaper' },
  { value: 'technology', label: 'Technologie', icon: 'i-heroicons-cpu' },
  { value: 'business', label: 'Wirtschaft', icon: 'i-heroicons-trending-up' },
  { value: 'health', label: 'Gesundheit', icon: 'i-heroicons-heart-pulse' },
  { value: 'sports', label: 'Sport', icon: 'i-heroicons-trophy' },
  { value: 'entertainment', label: 'Unterhaltung', icon: 'i-heroicons-film' },
  { value: 'science', label: 'Wissenschaft', icon: 'i-heroicons-flask-conical' }
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
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  padding-bottom: 4rem;
}

.page-header {
  background: rgba(26, 26, 46, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 2px solid rgba(79, 172, 254, 0.2);
  padding: 2rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(79, 172, 254, 0.1);
  border: 2px solid rgba(79, 172, 254, 0.3);
  border-radius: 12px;
  color: #4facfe;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(79, 172, 254, 0.2);
  border-color: rgba(79, 172, 254, 0.5);
  transform: translateX(-4px);
}

.page-header h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  margin: 0.25rem 0 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.95rem;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.filters-section {
  background: rgba(26, 26, 46, 0.6);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 2px solid rgba(79, 172, 254, 0.2);
  padding: 2rem;
  margin-bottom: 2rem;
}

.filter-group {
  margin-bottom: 1.5rem;
}

.filter-group:last-child {
  margin-bottom: 0;
}

.filter-group label {
  display: block;
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.filter-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

.filter-btn.active {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border-color: #4facfe;
  color: white;
}

.filter-btn svg {
  width: 1rem;
  height: 1rem;
}

.search-group {
  max-width: 500px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.search-box:focus-within {
  border-color: #4facfe;
  background: rgba(79, 172, 254, 0.05);
}

.search-box svg {
  width: 1.25rem;
  height: 1.25rem;
  color: rgba(255, 255, 255, 0.5);
}

.search-box input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: white;
  font-size: 0.95rem;
}

.search-box input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 4rem 2rem;
  background: rgba(26, 26, 46, 0.6);
  border-radius: 20px;
  border: 2px solid rgba(79, 172, 254, 0.2);
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.1rem;
}

.error-state {
  border-color: rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.loading-state svg,
.error-state svg,
.empty-state svg {
  width: 3rem;
  height: 3rem;
  color: #4facfe;
}

.error-state svg {
  color: #ef4444;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.retry-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(79, 172, 254, 0.4);
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
}

.article-card {
  background: rgba(26, 26, 46, 0.6);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 2px solid rgba(79, 172, 254, 0.2);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.article-card:hover {
  transform: translateY(-6px);
  border-color: rgba(79, 172, 254, 0.4);
  box-shadow: 0 12px 40px rgba(79, 172, 254, 0.3);
}

.article-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
}

.article-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.article-card:hover .article-image img {
  transform: scale(1.05);
}

.article-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
}

.article-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.source {
  padding: 0.375rem 0.75rem;
  background: rgba(79, 172, 254, 0.2);
  border-radius: 6px;
  color: #4facfe;
  font-size: 0.8rem;
  font-weight: 600;
}

.date {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
}

.article-content h3 {
  color: white;
  font-size: 1.2rem;
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
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.article-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.read-more {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: rgba(79, 172, 254, 0.1);
  border: 1px solid rgba(79, 172, 254, 0.3);
  border-radius: 8px;
  color: #4facfe;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.read-more:hover {
  background: rgba(79, 172, 254, 0.2);
  border-color: #4facfe;
}

.read-more svg {
  width: 0.875rem;
  height: 0.875rem;
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 3rem;
}

.load-more-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.load-more-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(79, 172, 254, 0.4);
}

.load-more-btn svg {
  width: 1.25rem;
  height: 1.25rem;
}

.results-info {
  text-align: center;
  margin-top: 2rem;
  padding: 1rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .page-header {
    padding: 1.5rem 0;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .page-header h1 {
    font-size: 1.5rem;
  }

  .container {
    padding: 1rem;
  }

  .filters-section {
    padding: 1.5rem;
  }

  .filter-buttons {
    gap: 0.5rem;
  }

  .filter-btn {
    font-size: 0.85rem;
    padding: 0.5rem 1rem;
  }

  .articles-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
</style>
