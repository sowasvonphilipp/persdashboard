<template>
  <div class="login-container" :class="{ 'fade-out': isAuthenticated }">
    <div class="login-card">
      <div class="card-glow"></div>
      
      <div class="greeting">
        <h1>{{ greeting }}, Philipp!</h1>
      </div>
      
      <div class="subtitle">
        <p>Sicheres Zugangsportal</p>
      </div>

      <div class="pin-section">
        <label class="pin-label">PIN-Code eingeben</label>
        <div class="pin-display" :class="{ shake: isError, error: isError }">
          <div
            v-for="i in 4"
            :key="i"
            class="pin-dot"
            :class="{ filled: pin.length >= i, error: isError }"
          ></div>
        </div>
        
        <transition name="error-fade">
          <div v-if="isError" class="error-message">
            <UIcon name="i-heroicons-alert-triangle" class="error-icon" />
            <span>Falscher PIN-Code. Bitte versuche es erneut.</span>
          </div>
        </transition>
        
        <transition name="success-fade">
          <div v-if="isAuthenticated" class="success-message">
            <UIcon name="i-heroicons-check" class="success-icon" />
            <span>Zugriff gewährt</span>
          </div>
        </transition>
      </div>

      <div class="pinpad">
        <div class="pinpad-row">
          <button class="pinpad-button" @click="addDigit('1')">1</button>
          <button class="pinpad-button" @click="addDigit('2')">2</button>
          <button class="pinpad-button" @click="addDigit('3')">3</button>
        </div>
        <div class="pinpad-row">
          <button class="pinpad-button" @click="addDigit('4')">4</button>
          <button class="pinpad-button" @click="addDigit('5')">5</button>
          <button class="pinpad-button" @click="addDigit('6')">6</button>
        </div>
        <div class="pinpad-row">
          <button class="pinpad-button" @click="addDigit('7')">7</button>
          <button class="pinpad-button" @click="addDigit('8')">8</button>
          <button class="pinpad-button" @click="addDigit('9')">9</button>
        </div>
        <div class="pinpad-row">
          <button class="pinpad-button clear" @click="clearPin">
            <UIcon name="i-heroicons-x-mark" />
          </button>
          <button class="pinpad-button" @click="addDigit('0')">0</button>
          <button class="pinpad-button delete" @click="deleteDigit">
            <UIcon name="i-heroicons-delete" />
          </button>
        </div>
      </div>
      
      <div class="footer-text">
        <p>Geschützt durch PIN-Authentifizierung</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const timeOfDay = useTimeOfDay();
const pin = ref('');
const isError = ref(false);
const isAuthenticated = ref(false);

const storedSettings = localStorage.getItem('app_settings');
const CORRECT_PIN = storedSettings ? (JSON.parse(storedSettings).pin || '2305') : '2305';

const greeting = computed(() => {
  switch (timeOfDay.value) {
    case 'morning':
      return 'Guten Morgen';
    case 'afternoon':
      return 'Guten Tag';
    case 'evening':
      return 'Guten Abend';
    default:
      return 'Hallo';
  }
});

const addDigit = (digit: string) => {
  if (pin.value.length < 4) {
    pin.value += digit;
    
    if (pin.value.length === 4) {
      checkPin();
    }
  }
};

const deleteDigit = () => {
  pin.value = pin.value.slice(0, -1);
  isError.value = false;
};

const clearPin = () => {
  pin.value = '';
  isError.value = false;
};

const checkPin = () => {
  if (pin.value === CORRECT_PIN) {
    isAuthenticated.value = true;
    setTimeout(() => {
      navigateTo('/dashboard');
    }, 1000);
  } else {
    isError.value = true;
    setTimeout(() => {
      pin.value = '';
      isError.value = false;
    }, 2000);
  }
};
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 50%, #16213e 100%);
  position: relative;
  overflow: hidden;
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.login-container::before {
  content: '';
  position: absolute;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(79, 172, 254, 0.05) 0%, transparent 70%);
  animation: pulse 8s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
  50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.8; }
}

.login-container.fade-out {
  opacity: 0;
  transform: scale(0.95);
}

.login-card {
  position: relative;
  background: rgba(26, 26, 46, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 3rem 2.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4),
              0 0 0 1px rgba(79, 172, 254, 0.1);
  max-width: 450px;
  width: 100%;
  animation: cardSlideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

@keyframes cardSlideIn {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(
    from 0deg,
    transparent,
    rgba(79, 172, 254, 0.15),
    transparent 60deg
  );
  animation: rotate 6s linear infinite;
  opacity: 0.6;
}

@keyframes rotate {
  100% { transform: rotate(360deg); }
}

.greeting h1 {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ffffff 0%, #4facfe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
  text-align: center;
  position: relative;
  z-index: 1;
  letter-spacing: -0.5px;
}

.subtitle {
  text-align: center;
  margin-bottom: 2.5rem;
  position: relative;
  z-index: 1;
}

.subtitle p {
  font-size: 0.9rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 0;
}

.pin-section {
  position: relative;
  z-index: 1;
  margin-bottom: 2rem;
}

.pin-label {
  display: block;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.pin-display {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  justify-content: center;
  animation: fadeInDown 0.5s ease;
}

.pin-display.shake {
  animation: shake 0.5s ease;
}

.pin-display.error .pin-dot {
  border-color: #ef4444;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
  20%, 40%, 60%, 80% { transform: translateX(10px); }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.pin-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(79, 172, 254, 0.3);
  background: transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.pin-dot.filled {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border-color: #4facfe;
  transform: scale(1.2);
  box-shadow: 0 0 20px rgba(79, 172, 254, 0.6);
}

.pin-dot.filled.error {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border-color: #ef4444;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.6);
}

.error-message,
.success-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-size: 0.9rem;
  margin-top: 1rem;
  font-weight: 500;
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.success-message {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #86efac;
}

.error-icon,
.success-icon {
  font-size: 1.1rem;
}

.error-fade-enter-active,
.error-fade-leave-active,
.success-fade-enter-active,
.success-fade-leave-active {
  transition: all 0.3s ease;
}

.error-fade-enter-from,
.error-fade-leave-to,
.success-fade-enter-from,
.success-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.pinpad {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  animation: fadeInUp 0.6s ease;
  position: relative;
  z-index: 1;
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

.pinpad-row {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.pinpad-button {
  width: 80px;
  height: 80px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  font-size: 2.5rem;
  font-weight: 300;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.pinpad-button::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(79, 172, 254, 0.1);
  transform: scale(0);
  transition: transform 0.3s ease;
}

.pinpad-button:hover::before {
  transform: scale(1);
}

.pinpad-button:hover {
  color: #4facfe;
  transform: scale(1.15);
  text-shadow: 0 0 20px rgba(79, 172, 254, 0.6);
}

.pinpad-button:active {
  transform: scale(0.9);
}

.pinpad-button:active::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(79, 172, 254, 0.3);
  animation: ripple 0.6s ease-out;
}

@keyframes ripple {
  to {
    transform: scale(2);
    opacity: 0;
  }
}

.pinpad-button.clear,
.pinpad-button.delete {
  font-size: 2rem;
  opacity: 0.7;
}

.pinpad-button.clear:hover,
.pinpad-button.delete:hover {
  color: #ef4444;
  opacity: 1;
  text-shadow: 0 0 20px rgba(239, 68, 68, 0.6);
}

.pinpad-button span {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.footer-text {
  margin-top: 2rem;
  text-align: center;
  position: relative;
  z-index: 1;
}

.footer-text p {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.3);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

@media (max-width: 640px) {
  .login-card {
    padding: 2rem 1.5rem;
  }
  
  .greeting h1 {
    font-size: 2rem;
  }
  
  .subtitle p {
    font-size: 0.8rem;
  }
  
  .pinpad-button {
    width: 70px;
    height: 70px;
    font-size: 2rem;
  }
  
  .pinpad-button.clear,
  .pinpad-button.delete {
    font-size: 1.5rem;
  }
}
</style>
