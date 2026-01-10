<template>
  <div class="template-selector">
    <button 
      v-for="template in templates" 
      :key="template.id"
      :class="{ active: selectedTemplate === template.id }"
      @click="selectTemplate(template)"
    >
      {{ template.name }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

// 模板类型定义
interface Template {
  id: string;
  name: string;
  width: number;
  height: number;
  grid: {
    rows: number;
    cols: number;
    gap: number;
    margin: number;
  };
}

// 组件属性
const props = defineProps<{
  templates: Template[];
  selectedTemplate: string;
}>();

// 组件事件
const emit = defineEmits<{
  (e: 'select', template: Template): void;
}>();

// 选择模板
const selectTemplate = (template: Template) => {
  emit('select', template);
};
</script>

<style scoped>
.template-selector {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.template-selector button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.template-selector button.active {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .template-selector {
    flex-direction: column;
  }
}
</style>