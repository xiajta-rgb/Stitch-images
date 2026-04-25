<template>
  <div class="toast-container">
    <TransitionGroup name="toast-list">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="toast.type"
      >
        <span class="toast-icon">{{ getIcon(toast.type) }}</span>
        <span class="toast-message">{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { ref, provide } from 'vue';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

const toasts = ref<Toast[]>([]);
let toastId = 0;

const showToast = (message: string, type: Toast['type'] = 'info') => {
  const id = ++toastId;
  toasts.value.push({ id, message, type });
  setTimeout(() => {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  }, 3000);
};

const getIcon = (type: Toast['type']) => {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  return icons[type] || icons.info;
};

provide('showToast', showToast);
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-size: 14px;
  animation: toastEnter 0.3s ease;
  min-width: 200px;
}

.toast.success {
  border-left: 4px solid #52c41a;
}

.toast.success .toast-icon {
  color: #52c41a;
}

.toast.error {
  border-left: 4px solid #ff4d4f;
}

.toast.error .toast-icon {
  color: #ff4d4f;
}

.toast.warning {
  border-left: 4px solid #faad14;
}

.toast.warning .toast-icon {
  color: #faad14;
}

.toast.info {
  border-left: 4px solid #1890ff;
}

.toast.info .toast-icon {
  color: #1890ff;
}

.toast-icon {
  font-size: 16px;
  font-weight: bold;
}

.toast-message {
  color: #333;
}

.toast-list-enter-active,
.toast-list-leave-active {
  transition: all 0.3s ease;
}

.toast-list-enter-from,
.toast-list-leave-to {
  opacity: 0;
  transform: translateX(100px);
}

@keyframes toastEnter {
  from {
    opacity: 0;
    transform: translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
