<template>
  <div class="min-h-screen flex flex-col bg-default">
    <div
      class="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none"
    />
    <UHeader :toggle="false">
      <template #left>
        <span class="font-semibold text-highlighted"> Job Tracker </span>
      </template>
      <template #right>
        <UColorModeButton />
      </template>
    </UHeader>

    <UMain class="flex-1 flex items-center justify-center relative">
      <UContainer class="w-full max-w-md py-10">
        <slot />
      </UContainer>
    </UMain>
  </div>
</template>
