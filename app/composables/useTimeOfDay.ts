import { ref, onMounted, onUnmounted } from 'vue';

export function useTimeOfDay() {
  const timeOfDay = ref<'morning' | 'afternoon' | 'evening' | 'night'>('morning');

  const updateTimeOfDay = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      timeOfDay.value = 'morning';
    } else if (hour >= 12 && hour < 18) {
      timeOfDay.value = 'afternoon';
    } else if (hour >= 18 && hour < 22) {
      timeOfDay.value = 'evening';
    } else {
      timeOfDay.value = 'night';
    }
  };

  let interval: NodeJS.Timeout;

  onMounted(() => {
    updateTimeOfDay();
    // Update every minute to keep it current
    interval = setInterval(updateTimeOfDay, 60000);
  });

  onUnmounted(() => {
    if (interval) {
      clearInterval(interval);
    }
  });

  return timeOfDay;
}
