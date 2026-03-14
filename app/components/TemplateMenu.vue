<template>
  <UDropdownMenu
    v-slot="{ open }"
    :modal="false"
    :items="[{
      label: 'Dashboard',
      to: '/dashboard',
      icon: 'i-lucide-layout-dashboard',
      checked: true,
      type: 'checkbox'
    }, {
      label: 'Wetter',
      to: '/wetter',
      icon: 'i-lucide-cloud'
    }, {
      label: 'Termine',
      to: '/termine',
      icon: 'i-lucide-calendar'
    }, {
      label: 'Aufgaben',
      to: '/aufgaben',
      icon: 'i-lucide-check-square'
    }]"
    :content="{ align: 'start' }"
    :ui="{ content: 'min-w-fit' }"
    size="xs"
  >
    <UButton
      label="Navigation"
      variant="subtle"
      trailing-icon="i-lucide-chevron-down"
      size="xs"
      class="-mb-[6px] font-semibold rounded-full truncate"
      :class="[open && 'bg-primary/15']"
      :ui="{
        trailingIcon: ['transition-transform duration-200', open ? 'rotate-180' : undefined].filter(Boolean).join(' ')
      }"
    />
  </UDropdownMenu>
</template>
