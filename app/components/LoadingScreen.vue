<template>
  <div class="loading-screen" :class="{ 'fade-out': !props.isVisible }">
    <div class="loading-content">
      <!-- Animated Logo/Icon -->
      <div class="logo-container">
        <div class="outer-ring"></div>
        <div class="middle-ring"></div>
        <div class="inner-ring"></div>
        <div class="center-icon">
          <UIcon name="i-lucide-sparkles" class="sparkle-icon" />
        </div>
      </div>

      <!-- Animated Text -->
      <div class="loading-text">
        <h1 class="app-title">
          <span class="letter" v-for="(letter, index) in 'Personal'" :key="'p-' + index" :style="{ animationDelay: `${index * 0.1}s` }">
            {{ letter }}
          </span>
          <span class="space">&nbsp;</span>
          <span class="letter" v-for="(letter, index) in 'Dashboard'" :key="'d-' + index" :style="{ animationDelay: `${(index + 8) * 0.1}s` }">
            {{ letter }}
          </span>
        </h1>
        <div class="loading-bar">
          <div class="loading-bar-fill"></div>
        </div>
        <p class="loading-message">{{ loadingMessage }}</p>
      </div>

      <!-- Floating Icons -->
      <div class="floating-icons">
        <div class="floating-icon" style="--delay: 0s; --duration: 3s; --x: -20px; --y: -30px;">
          <UIcon name="i-lucide-calendar" />
        </div>
        <div class="floating-icon" style="--delay: 0.5s; --duration: 4s; --x: 30px; --y: -40px;">
          <UIcon name="i-lucide-check-square" />
        </div>
        <div class="floating-icon" style="--delay: 1s; --duration: 3.5s; --x: -40px; --y: 20px;">
          <UIcon name="i-lucide-cloud" />
        </div>
        <div class="floating-icon" style="--delay: 1.5s; --duration: 4.5s; --x: 25px; --y: 35px;">
          <UIcon name="i-lucide-sun" />
        </div>
        <div class="floating-icon" style="--delay: 2s; --duration: 3.8s; --x: -15px; --y: -45px;">
          <UIcon name="i-lucide-zap" />
        </div>
      </div>

      <!-- Particle Effect -->
      <div class="particles">
        <div class="particle" v-for="i in 20" :key="i" :style="getParticleStyle(i)"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  isVisible: {
    type: Boolean,
    default: true
  }
});

const isLoading = ref(props.isVisible);
const loadingMessage = ref('Wird geladen...');

const messages = [
  'Wird geladen...',
  'Daten werden synchronisiert...',
  'Fast fertig...',
  'Gleich geht\'s los...'
];

let messageIndex = 0;
let messageInterval;

watch(() => props.isVisible, (newVal) => {
  if (!newVal) {
    setTimeout(() => {
      isLoading.value = false;
    }, 300);
  }
});

onMounted(() => {
  // Animate loading messages
  messageInterval = setInterval(() => {
    messageIndex = (messageIndex + 1) % messages.length;
    loadingMessage.value = messages[messageIndex];
  }, 2000);
});

onUnmounted(() => {
  if (messageInterval) {
    clearInterval(messageInterval);
  }
});

const getParticleStyle = (index) => {
  const randomX = Math.random() * 100;
  const randomY = Math.random() * 100;
  const randomDelay = Math.random() * 2;
  const randomDuration = 2 + Math.random() * 3;
  const randomSize = 2 + Math.random() * 4;
  
  return {
    left: `${randomX}%`,
    top: `${randomY}%`,
    width: `${randomSize}px`,
    height: `${randomSize}px`,
    animationDelay: `${randomDelay}s`,
    animationDuration: `${randomDuration}s`
  };
};
</script>

<style scoped>
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 50%, #16213e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  opacity: 1;
  transition: opacity 0.5s ease;
}

.loading-screen.fade-out {
  opacity: 0;
  pointer-events: none;
}

.loading-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
  max-width: 600px;
}

/* Logo Animation */
.logo-container {
  position: relative;
  width: 150px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.outer-ring,
.middle-ring,
.inner-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid;
  border-color: transparent;
  animation: rotate 3s linear infinite;
}

.outer-ring {
  width: 150px;
  height: 150px;
  border-top-color: #4facfe;
  border-right-color: #00f2fe;
  animation-duration: 3s;
}

.middle-ring {
  width: 110px;
  height: 110px;
  border-bottom-color: #43e97b;
  border-left-color: #38f9d7;
  animation-duration: 2s;
  animation-direction: reverse;
}

.inner-ring {
  width: 70px;
  height: 70px;
  border-top-color: #fa709a;
  border-right-color: #fee140;
  animation-duration: 1.5s;
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.center-icon {
  position: relative;
  z-index: 1;
  animation: pulse 2s ease-in-out infinite;
}

.sparkle-icon {
  width: 3rem;
  height: 3rem;
  color: white;
  filter: drop-shadow(0 0 10px rgba(79, 172, 254, 0.8));
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

/* Text Animation */
.loading-text {
  text-align: center;
  width: 100%;
}

.app-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  margin: 0 0 1.5rem 0;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}

.letter {
  display: inline-block;
  animation: wave 1.5s ease-in-out infinite;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

@keyframes wave {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-10px) scale(1.1);
  }
}

.loading-bar {
  width: 100%;
  height: 4px;
  background: rgba(79, 172, 254, 0.2);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.loading-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 50%, #43e97b 100%);
  background-size: 200% 100%;
  animation: loading 2s ease-in-out infinite;
  border-radius: 2px;
}

@keyframes loading {
  0% {
    width: 0%;
    background-position: 0% 0%;
  }
  50% {
    width: 70%;
    background-position: 100% 0%;
  }
  100% {
    width: 100%;
    background-position: 200% 0%;
  }
}

.loading-message {
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
  margin: 0;
  animation: fade 2s ease-in-out infinite;
}

@keyframes fade {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

/* Floating Icons */
.floating-icons {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  height: 400px;
  pointer-events: none;
}

.floating-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.3;
  animation: float var(--duration) ease-in-out infinite;
  animation-delay: var(--delay);
}

.floating-icon svg {
  width: 100%;
  height: 100%;
  color: #4facfe;
  filter: drop-shadow(0 0 5px rgba(79, 172, 254, 0.5));
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 0.3;
  }
  25% {
    transform: translate(var(--x), var(--y)) rotate(90deg);
    opacity: 0.6;
  }
  50% {
    transform: translate(calc(var(--x) * 1.5), calc(var(--y) * 0.5)) rotate(180deg);
    opacity: 0.3;
  }
  75% {
    transform: translate(calc(var(--x) * 0.5), calc(var(--y) * 1.5)) rotate(270deg);
    opacity: 0.6;
  }
}

/* Particles */
.particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.particle {
  position: absolute;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 50%;
  opacity: 0;
  animation: particleFloat 5s ease-in-out infinite;
}

@keyframes particleFloat {
  0% {
    transform: translateY(100vh) scale(0);
    opacity: 0;
  }
  10% {
    opacity: 0.8;
  }
  90% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(-100vh) scale(1);
    opacity: 0;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .logo-container {
    width: 120px;
    height: 120px;
  }

  .outer-ring {
    width: 120px;
    height: 120px;
  }

  .middle-ring {
    width: 90px;
    height: 90px;
  }

  .inner-ring {
    width: 60px;
    height: 60px;
  }

  .sparkle-icon {
    width: 2.5rem;
    height: 2.5rem;
  }

  .app-title {
    font-size: 2rem;
  }

  .floating-icons {
    width: 300px;
    height: 300px;
  }

  .floating-icon {
    width: 30px;
    height: 30px;
  }
}
</style>
