<template>
  <div class="weather-page">
    <div class="page-header">
      <button class="back-button" @click="navigateTo('/dashboard')">
        <UIcon name="i-heroicons-arrow-left" />
        <span>Zurück</span>
      </button>
      <h1>
        <UIcon name="i-heroicons-cloud-sun" class="header-icon" />
        Wetter für {{ CITY }}
      </h1>
    </div>

    <!-- Error Message -->
    <div v-if="weatherError" class="error-card">
      <UIcon name="i-heroicons-alert-circle" class="error-icon" />
      <div>
        <h3>Fehler</h3>
        <p>{{ weatherError }}</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-card">
      <UIcon name="i-heroicons-loader-2" class="loading-icon" />
      <p>Wetterdaten werden geladen...</p>
    </div>

    <!-- Weather Content -->
    <div v-else-if="currentWeather" class="weather-content">
      <!-- Current Weather Card -->
      <div class="current-weather-card">
        <div class="current-header">
          <h2>Aktuelles Wetter</h2>
          <p class="last-updated">Aktualisiert: {{ lastUpdated }}</p>
        </div>
        
        <div class="current-main">
          <div class="current-icon">
            <UIcon :name="currentIcon" />
          </div>
          <div class="current-temp">
            <span class="temp-value">{{ currentWeather.current.temp_c }}°</span>
            <span class="temp-desc">{{ currentWeather.current.condition.text }}</span>
          </div>
        </div>

        <div class="current-details">
          <div class="detail-item">
            <UIcon name="i-heroicons-thermometer" />
            <span class="label">Gefühlt</span>
            <span class="value">{{ currentWeather.current.feelslike_c }}°C</span>
          </div>
          <div class="detail-item">
            <UIcon name="i-heroicons-droplets" />
            <span class="label">Luftfeuchtigkeit</span>
            <span class="value">{{ currentWeather.current.humidity }}%</span>
          </div>
          <div class="detail-item">
            <UIcon name="i-heroicons-wind" />
            <span class="label">Wind</span>
            <span class="value">{{ currentWeather.current.wind_kph }} km/h</span>
          </div>
          <div class="detail-item">
            <UIcon name="i-heroicons-gauge" />
            <span class="label">Luftdruck</span>
            <span class="value">{{ currentWeather.current.pressure_mb }} mb</span>
          </div>
          <div class="detail-item">
            <UIcon name="i-heroicons-eye" />
            <span class="label">Sicht</span>
            <span class="value">{{ currentWeather.current.vis_km }} km</span>
          </div>
          <div class="detail-item">
            <UIcon name="i-heroicons-cloud-rain" />
            <span class="label">Niederschlag</span>
            <span class="value">{{ currentWeather.current.precip_mm }} mm</span>
          </div>
        </div>
      </div>

      <!-- 3-Day Forecast -->
      <div class="forecast-section">
        <h2>
          <UIcon name="i-heroicons-calendar-days" />
          3-Tages-Vorhersage
        </h2>
        <div class="forecast-cards">
          <div v-for="day in forecastData?.forecast.forecastday" :key="day.date" class="forecast-card">
            <div class="forecast-date">
              <span class="day-name">{{ formatDate(day.date) }}</span>
              <span class="date">{{ formatShortDate(day.date) }}</span>
            </div>
            <div class="forecast-icon">
              <UIcon :name="getWeatherIcon(day.day.condition.code, true)" />
            </div>
            <div class="forecast-condition">
              {{ day.day.condition.text }}
            </div>
            <div class="forecast-temp">
              <span class="temp-max">
                <UIcon name="i-heroicons-arrow-up" />
                {{ Math.round(day.day.maxtemp_c) }}°
              </span>
              <span class="temp-min">
                <UIcon name="i-heroicons-arrow-down" />
                {{ Math.round(day.day.mintemp_c) }}°
              </span>
            </div>
            <div class="forecast-details">
              <div class="detail-row">
                <UIcon name="i-heroicons-cloud-rain" />
                <span>{{ day.day.daily_chance_of_rain }}%</span>
              </div>
              <div class="detail-row">
                <UIcon name="i-heroicons-wind" />
                <span>{{ Math.round(day.day.maxwind_kph) }} km/h</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Hourly Forecast for Today -->
      <div class="hourly-section">
        <h2>
          <UIcon name="i-heroicons-clock" />
          Stündliche Vorhersage (Heute)
        </h2>
        <div class="hourly-scroll">
          <div v-for="hour in todayHourly" :key="hour.time" class="hourly-card">
            <div class="hour-time">{{ formatTime(hour.time) }}</div>
            <div class="hour-icon">
              <UIcon :name="getWeatherIcon(hour.condition.code, hour.is_day === 1)" />
            </div>
            <div class="hour-temp">{{ Math.round(hour.temp_c) }}°</div>
            <div class="hour-rain">
              <UIcon name="i-heroicons-droplets" />
              {{ hour.chance_of_rain }}%
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const config = useRuntimeConfig();

// Configuration
const WEATHER_API_KEY = config.public.weatherApiKey;
const _s = localStorage.getItem('app_settings');
const CITY = _s ? (JSON.parse(_s).weatherCity || 'Leopoldshafen') : 'Leopoldshafen';

// State
const currentWeather = ref(null);
const forecastData = ref(null);
const weatherError = ref('');
const isLoading = ref(false);

// Computed
const lastUpdated = computed(() => {
  if (!currentWeather.value) return '';
  const date = new Date(currentWeather.value.current.last_updated);
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
});

const currentIcon = computed(() => {
  if (!currentWeather.value) return 'i-heroicons-thermometer';
  return getWeatherIcon(
    currentWeather.value.current.condition.code,
    currentWeather.value.current.is_day === 1
  );
});

const todayHourly = computed(() => {
  if (!forecastData.value) return [];
  return forecastData.value.forecast.forecastday[0].hour;
});

// Helper Functions
const getWeatherIcon = (code, isDay) => {
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
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  return days[date.getDay()];
};

const formatShortDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
};

const formatTime = (timeStr) => {
  const date = new Date(timeStr);
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
};

// Fetch Weather Data
const fetchWeather = async () => {
  if (!WEATHER_API_KEY) {
    weatherError.value = 'API-Schlüssel nicht konfiguriert';
    return;
  }

  try {
    isLoading.value = true;
    weatherError.value = '';
    
    // Fetch current weather and forecast
    const [current, forecast] = await Promise.all([
      $fetch(`https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${CITY}&lang=de&aqi=yes`),
      $fetch(`https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${CITY}&days=3&lang=de&aqi=no&alerts=no`)
    ]);
    
    currentWeather.value = current;
    forecastData.value = forecast;
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

// Lifecycle
onMounted(() => {
  fetchWeather();
});
</script>

<style scoped>
.weather-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 50%, #16213e 100%);
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
  animation: slideDown 0.6s ease;
}

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
  margin-bottom: 1.5rem;
}

.back-button:hover {
  background: rgba(79, 172, 254, 0.2);
  transform: translateX(-5px);
}

.page-header h1 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ffffff 0%, #4facfe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: #4facfe;
}

.error-card,
.loading-card {
  background: rgba(26, 26, 46, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  gap: 1rem;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.error-card {
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.error-icon {
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
}

.loading-card {
  border: 1px solid rgba(79, 172, 254, 0.3);
  color: #4facfe;
  justify-content: center;
}

.loading-icon {
  width: 2rem;
  height: 2rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

.weather-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  animation: fadeInUp 0.6s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.current-weather-card {
  background: rgba(26, 26, 46, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4),
              0 0 0 1px rgba(79, 172, 254, 0.1);
}

.current-header {
  margin-bottom: 2rem;
}

.current-header h2 {
  font-size: 1.8rem;
  color: white;
  margin-bottom: 0.5rem;
}

.last-updated {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
}

.current-main {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.current-icon {
  font-size: 5rem;
  color: #4facfe;
}

.current-icon svg {
  width: 5rem;
  height: 5rem;
}

.current-temp {
  display: flex;
  flex-direction: column;
}

.temp-value {
  font-size: 4rem;
  font-weight: 700;
  color: white;
  line-height: 1;
}

.temp-desc {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.5rem;
}

.current-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(79, 172, 254, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(79, 172, 254, 0.1);
}

.detail-item svg {
  width: 1.5rem;
  height: 1.5rem;
  color: #4facfe;
  flex-shrink: 0;
}

.detail-item .label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  flex: 1;
}

.detail-item .value {
  color: white;
  font-weight: 600;
}

.forecast-section,
.hourly-section {
  background: rgba(26, 26, 46, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4),
              0 0 0 1px rgba(79, 172, 254, 0.1);
}

.forecast-section h2,
.hourly-section h2 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.8rem;
  color: white;
  margin-bottom: 1.5rem;
}

.forecast-section h2 svg,
.hourly-section h2 svg {
  width: 1.8rem;
  height: 1.8rem;
  color: #4facfe;
}

.forecast-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.forecast-card {
  background: rgba(79, 172, 254, 0.05);
  border: 1px solid rgba(79, 172, 254, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.forecast-card:hover {
  transform: translateY(-5px);
  border-color: rgba(79, 172, 254, 0.3);
  box-shadow: 0 8px 24px rgba(79, 172, 254, 0.2);
}

.forecast-date {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

.day-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
}

.date {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
}

.forecast-icon {
  font-size: 3rem;
  color: #4facfe;
  margin: 1rem 0;
}

.forecast-icon svg {
  width: 3rem;
  height: 3rem;
}

.forecast-condition {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.forecast-temp {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.temp-max,
.temp-min {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.temp-max {
  color: #fca5a5;
}

.temp-min {
  color: #93c5fd;
}

.temp-max svg,
.temp-min svg {
  width: 1rem;
  height: 1rem;
}

.forecast-details {
  display: flex;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(79, 172, 254, 0.1);
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.detail-row svg {
  width: 1rem;
  height: 1rem;
  color: #4facfe;
}

.hourly-scroll {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 1rem;
}

.hourly-scroll::-webkit-scrollbar {
  height: 8px;
}

.hourly-scroll::-webkit-scrollbar-track {
  background: rgba(79, 172, 254, 0.05);
  border-radius: 4px;
}

.hourly-scroll::-webkit-scrollbar-thumb {
  background: rgba(79, 172, 254, 0.3);
  border-radius: 4px;
}

.hourly-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(79, 172, 254, 0.5);
}

.hourly-card {
  flex-shrink: 0;
  background: rgba(79, 172, 254, 0.05);
  border: 1px solid rgba(79, 172, 254, 0.1);
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
  min-width: 100px;
  transition: all 0.3s ease;
}

.hourly-card:hover {
  transform: translateY(-3px);
  border-color: rgba(79, 172, 254, 0.3);
}

.hour-time {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.hour-icon {
  font-size: 2rem;
  color: #4facfe;
  margin: 0.5rem 0;
}

.hour-icon svg {
  width: 2rem;
  height: 2rem;
}

.hour-temp {
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0.5rem 0;
}

.hour-rain {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
}

.hour-rain svg {
  width: 0.9rem;
  height: 0.9rem;
}

@media (max-width: 768px) {
  .weather-page {
    padding: 1rem;
  }

  .page-header h1 {
    font-size: 1.8rem;
  }

  .current-main {
    flex-direction: column;
    text-align: center;
  }

  .temp-value {
    font-size: 3rem;
  }

  .current-details {
    grid-template-columns: 1fr;
  }

  .forecast-cards {
    grid-template-columns: 1fr;
  }
}
</style>
