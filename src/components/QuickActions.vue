<template>
  <div class="quick-actions">
    <button @click="importFromGallery" class="btn-gallery">
      <span class="icon">🖼️</span> 从图库导入
    </button>
    <button @click="resetCanvas" class="btn-reset">
      <span class="icon">🔄</span> 重置画布
    </button>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'importFromGallery'): void;
  (e: 'resetCanvas'): void;
}>();

const importFromGallery = () => {
  emit('importFromGallery');
};

const resetCanvas = () => {
  emit('resetCanvas');
};
</script>

<style scoped>
.quick-actions {
  display: flex;
  gap: 6px;
  margin-bottom: 0;
  align-items: center;
}

.quick-actions button {
  padding: 7px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #666;
}

.quick-actions button:hover {
  background: #f8f9fa;
  border-color: #3366ff;
  color: #3366ff;
}

.btn-gallery {
  background: #3366ff;
  color: white;
  border: none;
}

.btn-gallery:hover {
  background: #254edb;
}
</style>
