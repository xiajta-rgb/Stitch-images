<template>
  <div class="export-buttons-container">
    <h3>导出选项</h3>
    <div class="export-buttons">
      <button @click="exportCanvas('jpg', 'original')">
        <span class="icon">📸</span> JPG原图
      </button>
      <button @click="exportCanvas('png', 'original')">
        <span class="icon">🖼️</span> PNG原图
      </button>
      <button @click="exportCanvas('jpg', 'standard')">
        <span class="icon">📱</span> JPG标清
      </button>
      <button @click="exportCanvas('png', 'standard')">
        <span class="icon">💻</span> PNG标清
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// 组件事件
const emit = defineEmits<{
  (e: 'export', format: 'jpg' | 'png', quality: 'original' | 'standard'): void;
}>();

// 导出画布
const exportCanvas = (format: 'jpg' | 'png', quality: 'original' | 'standard') => {
  emit('export', format, quality);
};
</script>

<style scoped>
.export-buttons-container {
  margin-top: 12px;
  padding: 10px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
}

.export-buttons-container h3 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.export-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.export-buttons button {
  padding: 6px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #666;
}

.export-buttons button:hover {
  background: #f8f9fa;
  border-color: #3366ff;
  color: #3366ff;
}

.export-buttons .icon {
  font-size: 13px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .export-buttons {
    justify-content: space-between;
  }
}
</style>