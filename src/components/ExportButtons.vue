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
import { defineEmits } from 'vue';

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
  margin-top: 20px;
  padding: 15px;
  background: white;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.export-buttons-container h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
}

.export-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.export-buttons button {
  padding: 10px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.export-buttons button:hover {
  background: #f0f0f0;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.export-buttons .icon {
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .export-buttons {
    justify-content: space-between;
  }
}
</style>