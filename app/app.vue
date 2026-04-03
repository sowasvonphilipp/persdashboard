<template>
  <div>
    <LoadingScreen :isVisible="isLoading" :progress="loadProgress" :message="loadMessage" />
    <transition name="page" mode="out-in">
      <NuxtPage v-if="!isLoading" />
    </transition>
  </div>
</template>

<script setup>
const isLoading = ref(true);
const loadProgress = ref(0);
const loadMessage = ref('Dashboard wird gestartet...');

const { restoreToken } = useGoogleAuth();

onMounted(async () => {
  // Step 1: restore auth tokens immediately
  loadMessage.value = 'Anmeldung wird wiederhergestellt...';
  loadProgress.value = 20;
  try {
    restoreToken();
  } catch (e) { /* ignore */ }

  // Step 2: preload weather
  loadMessage.value = 'Wetterdaten werden geladen...';
  loadProgress.value = 50;
  await new Promise(r => setTimeout(r, 200));

  // Step 3: finish
  loadMessage.value = 'Fast fertig...';
  loadProgress.value = 90;
  await new Promise(r => setTimeout(r, 300));

  loadProgress.value = 100;
  await new Promise(r => setTimeout(r, 300));
  isLoading.value = false;
});
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

* {
  box-sizing: border-box;
}

/* Page Transitions */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>