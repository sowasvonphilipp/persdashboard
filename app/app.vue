<template>
  <div>
    <LoadingScreen :isVisible="isLoading" />
    <transition name="page" mode="out-in">
      <NuxtPage v-if="!isLoading" />
    </transition>
  </div>
</template>

<script setup>
const isLoading = ref(true);

onMounted(() => {
  // Simulate initial loading time
  setTimeout(() => {
    isLoading.value = false;
  }, 2500);
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