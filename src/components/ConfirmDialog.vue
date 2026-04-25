<template>
  <div v-if="show" class="confirm-overlay" @click.self="cancel">
    <div class="confirm-dialog">
      <div class="confirm-icon" :class="type">
        <span class="icon-emoji">{{ getIcon(type) }}</span>
      </div>
      <h3 class="confirm-title">{{ title }}</h3>
      <p class="confirm-message">{{ message }}</p>
      <div class="confirm-buttons">
        <button class="confirm-btn btn-cancel" @click="cancel">{{ cancelText }}</button>
        <button class="confirm-btn btn-confirm" @click="confirm" :class="type">{{ confirmText }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const show = ref(false);
const title = ref('确认');
const message = ref('确定要执行此操作吗？');
const type = ref<'warning' | 'success' | 'error' | 'info'>('warning');
const confirmText = ref('确定');
const cancelText = ref('取消');

let resolveCallback: ((value: boolean) => void) | null = null;

const getIcon = (t: string) => {
  const icons = {
    warning: '⚠️',
    success: '✓',
    error: '✕',
    info: 'ℹ️'
  };
  return icons[t as keyof typeof icons] || icons.warning;
};

const confirm = () => {
  show.value = false;
  if (resolveCallback) {
    resolveCallback(true);
    resolveCallback = null;
  }
};

const cancel = () => {
  show.value = false;
  if (resolveCallback) {
    resolveCallback(false);
    resolveCallback = null;
  }
};

const openConfirm = (
  msg: string,
  opts: {
    title?: string;
    type?: 'warning' | 'success' | 'error' | 'info';
    confirmText?: string;
    cancelText?: string;
  } = {}
) => {
  title.value = opts.title || '确认';
  message.value = msg;
  type.value = opts.type || 'warning';
  confirmText.value = opts.confirmText || '确定';
  cancelText.value = opts.cancelText || '取消';
  show.value = true;

  return new Promise<boolean>((resolve) => {
    resolveCallback = resolve;
  });
};

defineExpose({ openConfirm });
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeInOverlay 0.2s ease;
}

@keyframes fadeInOverlay {
  from { opacity: 0; }
  to { opacity: 1; }
}

.confirm-dialog {
  background: white;
  border-radius: 12px;
  padding: 28px 24px 20px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: slideInDialog 0.25s ease;
}

@keyframes slideInDialog {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.confirm-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

.confirm-icon.warning {
  background: #fff7e6;
}

.confirm-icon.success {
  background: #f6ffed;
}

.confirm-icon.error {
  background: #fff2f0;
}

.confirm-icon.info {
  background: #e6f7ff;
}

.icon-emoji {
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-title {
  margin: 0 0 8px;
  font-size: 18px;
  color: #262626;
  font-weight: 600;
}

.confirm-message {
  margin: 0 0 24px;
  color: #595959;
  font-size: 14px;
  line-height: 1.6;
}

.confirm-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.confirm-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel {
  background: #f5f5f5;
  color: #595959;
}

.btn-cancel:hover {
  background: #e8e8e8;
}

.btn-confirm {
  background: #3366ff;
  color: white;
}

.btn-confirm:hover {
  background: #254edb;
}

.btn-confirm.warning {
  background: #faad14;
}

.btn-confirm.warning:hover {
  background: #d48806;
}

.btn-confirm.error {
  background: #ff4d4f;
}

.btn-confirm.error:hover {
  background: #cf1322;
}

.btn-confirm.success {
  background: #52c41a;
}

.btn-confirm.success:hover {
  background: #389e0d;
}
</style>
