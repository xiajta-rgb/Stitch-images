<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="handleOverlayClick">
      <div class="modal-container" :class="[`modal-${size}`, customClass]" :style="customStyle">
        <div v-if="$slots.header || title" class="modal-header">
          <slot name="header">
            <h3 class="modal-title">{{ title }}</h3>
          </slot>
          <button v-if="closable" class="modal-close" @click="close">×</button>
        </div>
        <div class="modal-body" :class="{ 'no-padding': noPadding }">
          <slot></slot>
        </div>
        <div v-if="$slots.footer" class="modal-footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  size?: 'small' | 'medium' | 'large' | 'full'
  closable?: boolean
  closeOnOverlay?: boolean
  customClass?: string
  customStyle?: string
  noPadding?: boolean
}>(), {
  size: 'medium',
  closable: true,
  closeOnOverlay: true
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}>()

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    close()
  }
}

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-container {
  background: #fff;
  border-radius: 12px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-small {
  width: 90%;
  max-width: 400px;
}

.modal-medium {
  width: 90%;
  max-width: 600px;
}

.modal-large {
  width: 90%;
  max-width: 800px;
}

.modal-full {
  width: 95%;
  height: 90%;
  max-width: none;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  line-height: 1;
}

.modal-close:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.modal-body.no-padding {
  padding: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid #eee;
}
</style>