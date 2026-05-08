<template>
  <div class="header-controls">
    <div class="control-section">
      <div class="section-label">模板</div>
      <div class="template-grid">
        <div
          v-for="template in templates"
          :key="template.id"
          class="template-item"
          :class="{ active: selectedTemplate === template.id }"
          @click="selectTemplate(template)"
        >
          <div class="template-icon">
            <svg viewBox="0 0 40 40" fill="none">
              <template v-if="template.id === '3-grid'">
                <rect x="4" y="4" width="32" height="9" rx="1" fill="currentColor" opacity="0.3"/>
                <rect x="4" y="15" width="32" height="9" rx="1" fill="currentColor" opacity="0.5"/>
                <rect x="4" y="26" width="32" height="9" rx="1" fill="currentColor" opacity="0.7"/>
              </template>
              <template v-else-if="template.id === '4-grid'">
                <rect x="4" y="4" width="14" height="14" rx="1" fill="currentColor" opacity="0.3"/>
                <rect x="22" y="4" width="14" height="14" rx="1" fill="currentColor" opacity="0.5"/>
                <rect x="4" y="22" width="14" height="14" rx="1" fill="currentColor" opacity="0.7"/>
                <rect x="22" y="22" width="14" height="14" rx="1" fill="currentColor"/>
              </template>
              <template v-else-if="template.id === 'long'">
                <rect x="4" y="2" width="32" height="6" rx="1" fill="currentColor" opacity="0.2"/>
                <rect x="4" y="10" width="32" height="6" rx="1" fill="currentColor" opacity="0.35"/>
                <rect x="4" y="18" width="32" height="6" rx="1" fill="currentColor" opacity="0.5"/>
                <rect x="4" y="26" width="32" height="6" rx="1" fill="currentColor" opacity="0.65"/>
                <rect x="4" y="34" width="32" height="4" rx="1" fill="currentColor" opacity="0.8"/>
              </template>
            </svg>
          </div>
          <span class="template-name">{{ template.name }}</span>
        </div>
      </div>
    </div>

    <div class="control-divider"></div>

    <div class="control-section">
      <div class="section-label">自定义模板</div>
      <div class="custom-template-actions">
        <select class="custom-template-select" @change="onCustomTemplateChange">
          <option value="">选择已保存的模板...</option>
          <option v-for="t in customTemplates" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
        <button class="btn-save-template" @click="saveTemplate" title="保存当前配置为模板">💾 保存</button>
        <button class="btn-manage-templates" @click="manageTemplates" title="管理模板">⚙️ 管理</button>
      </div>
    </div>

    <div class="control-divider"></div>

    <div class="control-section">
      <div class="section-label">分辨率</div>
      <div class="resolution-options">
        <button
          v-for="res in resolutions"
          :key="res.id"
          class="resolution-btn"
          :class="{ active: selectedResolution === res.id }"
          @click="selectResolution(res)"
        >
          {{ res.name.split(' ')[0] }}
          <span class="res-size">{{ res.width }}×{{ res.height }}</span>
        </button>
      </div>
    </div>

    <div class="control-divider"></div>

    <div class="control-section">
      <div class="section-label">宫格微调</div>
      <div class="grid-adjustment">
        <div class="adjust-row">
          <label>行数</label>
          <div class="stepper">
            <button @click="adjustRows(-1)" :disabled="currentGridConfig.rows <= 1">−</button>
            <span class="stepper-value">{{ currentGridConfig.rows }}</span>
            <button @click="adjustRows(1)" :disabled="currentGridConfig.rows >= 6">+</button>
          </div>
        </div>
        <div class="adjust-row">
          <label>列数</label>
          <div class="stepper">
            <button @click="adjustCols(-1)" :disabled="currentGridConfig.cols <= 1">−</button>
            <span class="stepper-value">{{ currentGridConfig.cols }}</span>
            <button @click="adjustCols(1)" :disabled="currentGridConfig.cols >= 6">+</button>
          </div>
          <button class="btn-batch-import" @click="openBatchImport" title="批量导入图片到图库">📥 批量导入</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useTemplateManager, type PuzzleTemplate } from '../composables/useTemplateManager';

interface Template {
  id: string;
  name: string;
  width: number;
  height: number;
  grid: { rows: number; cols: number; gap: number; margin: number };
}

interface Resolution {
  id: string;
  name: string;
  width: number;
  height: number;
}

interface GridConfig {
  rows: number;
  cols: number;
  gap: number;
  margin: number;
}

const props = defineProps<{
  templates: Template[];
  resolutions: Resolution[];
  selectedTemplate: string;
  selectedResolution: string;
  gridConfig: GridConfig;
}>();

const emit = defineEmits<{
  (e: 'selectTemplate', template: Template): void;
  (e: 'selectResolution', resolution: Resolution): void;
  (e: 'updateGridConfig', config: GridConfig): void;
  (e: 'saveTemplate'): void;
  (e: 'openTemplateManager'): void;
  (e: 'applyCustomTemplate', template: PuzzleTemplate): void;
  (e: 'openBatchImport'): void;
}>();

const { templates: customTemplates } = useTemplateManager();

const selectedTemplate = ref(props.selectedTemplate);
const selectedResolution = ref(props.selectedResolution);
const currentGridConfig = ref({ ...props.gridConfig });

watch(() => props.gridConfig, (newConfig) => {
  currentGridConfig.value = { ...newConfig };
}, { deep: true });

const selectTemplate = (template: Template) => {
  selectedTemplate.value = template.id;
  currentGridConfig.value = { ...template.grid };
  emit('selectTemplate', template);
};

const selectResolution = (resolution: Resolution) => {
  selectedResolution.value = resolution.id;
  emit('selectResolution', resolution);
};

const adjustRows = (delta: number) => {
  const newRows = Math.max(1, Math.min(6, currentGridConfig.value.rows + delta));
  currentGridConfig.value.rows = newRows;
  emit('updateGridConfig', { ...currentGridConfig.value });
};

const adjustCols = (delta: number) => {
  const newCols = Math.max(1, Math.min(6, currentGridConfig.value.cols + delta));
  currentGridConfig.value.cols = newCols;
  emit('updateGridConfig', { ...currentGridConfig.value });
};

const onCustomTemplateChange = (e: Event) => {
  const target = e.target as HTMLSelectElement;
  const templateId = target.value;
  if (!templateId) return;
  
  const template = customTemplates.value.find(t => t.id === templateId);
  if (template) {
    emit('applyCustomTemplate', template);
  }
  target.value = '';
};

const saveTemplate = () => {
  emit('saveTemplate');
};

const manageTemplates = () => {
  emit('openTemplateManager');
};

const openBatchImport = () => {
  emit('openBatchImport');
};
</script>

<style scoped>
.header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #fafbfc;
  border-radius: 6px;
  flex-wrap: wrap;
}

.control-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-label {
  font-size: 11px;
  color: #666;
  font-weight: 500;
  white-space: nowrap;
}

.control-divider {
  width: 1px;
  height: 28px;
  background: #e8e8e8;
}

.template-grid {
  display: flex;
  gap: 4px;
}

.template-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 10px;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 52px;
}

.template-item:hover {
  border-color: #3366ff;
}

.template-item.active {
  border-color: #3366ff;
  background: #f0f5ff;
}

.template-icon {
  width: 24px;
  height: 24px;
  color: #3366ff;
}

.template-icon svg {
  width: 100%;
  height: 100%;
}

.template-name {
  font-size: 10px;
  color: #333;
  font-weight: 500;
}

.template-item.active .template-name {
  color: #3366ff;
}

.resolution-options {
  display: flex;
  gap: 3px;
}

.resolution-btn {
  padding: 4px 8px;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  font-size: 11px;
  color: #333;
}

.resolution-btn:hover {
  border-color: #3366ff;
  color: #3366ff;
}

.resolution-btn.active {
  border-color: #3366ff;
  background: #3366ff;
  color: white;
}

.resolution-btn .res-size {
  font-size: 9px;
  opacity: 0.7;
}

.grid-adjustment {
  display: flex;
  gap: 8px;
  align-items: center;
}

.adjust-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.adjust-row label {
  font-size: 11px;
  color: #666;
}

.stepper {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
}

.stepper button {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  color: #666;
  transition: all 0.2s;
}

.stepper button:hover:not(:disabled) {
  background: #f0f5ff;
  color: #3366ff;
}

.stepper button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.stepper-value {
  min-width: 16px;
  text-align: center;
  font-size: 11px;
  font-weight: 500;
  color: #333;
}

.custom-template-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.custom-template-select {
  padding: 4px 8px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  font-size: 11px;
  background: white;
  color: #333;
  cursor: pointer;
  min-width: 140px;
}

.custom-template-select:focus {
  outline: none;
  border-color: #3366ff;
}

.btn-save-template,
.btn-manage-templates {
  padding: 4px 8px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  font-size: 11px;
  background: white;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-save-template:hover,
.btn-manage-templates:hover {
  border-color: #3366ff;
  color: #3366ff;
  background: #f0f5ff;
}

.btn-batch-import {
  padding: 4px 10px;
  border: 1px solid #3366ff;
  border-radius: 4px;
  font-size: 11px;
  background: #3366ff;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-batch-import:hover {
  background: #254edb;
  border-color: #254edb;
}



@media (max-width: 900px) {
  .header-controls {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .control-section {
    width: 100%;
    flex-wrap: wrap;
  }

  .control-divider {
    width: 100%;
    height: 1px;
  }

  .grid-adjustment {
    flex-wrap: wrap;
  }
}
</style>
