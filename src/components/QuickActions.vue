<template>
  <div class="quick-actions">
    <!-- 文件上传按钮 -->
    <div class="file-upload-wrapper">
      <input 
        type="file" 
        id="basicFileInput"
        accept="image/*"
        multiple
        @change="handleFileUpload"
      />
      <label for="basicFileInput" class="file-upload-label">
        <span class="icon">📁</span> 导入图片
      </label>
    </div>
    <!-- 重置画布按钮 -->
    <button @click="resetCanvas">
      <span class="icon">🔄</span> 重置画布
    </button>
  </div>
</template>

<script setup lang="ts">
import { defineEmits } from 'vue';

// 组件事件
const emit = defineEmits<{
  (e: 'fileUpload', event: Event): void;
  (e: 'resetCanvas'): void;
}>();

// 处理文件上传
const handleFileUpload = (event: Event) => {
  emit('fileUpload', event);
};

// 重置画布
const resetCanvas = () => {
  emit('resetCanvas');
};
</script>

<style scoped>
.quick-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  align-items: center;
}

.quick-actions button {
  padding: 12px 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
}

.quick-actions button:hover {
  background: #f0f0f0;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* 文件上传包装器 */
.file-upload-wrapper {
  position: relative;
  display: inline-block;
}

.file-upload-wrapper input[type="file"] {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}

.file-upload-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: 1px solid #4CAF50;
  border-radius: 4px;
  background: #4CAF50;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
  z-index: 1;
}

.file-upload-label:hover {
  background: #45a049;
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
  transform: translateY(-1px);
}

.file-upload-label .icon {
  font-size: 18px;
}

.quick-actions .icon {
  font-size: 18px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .quick-actions {
    flex-direction: column;
  }
}
</style>