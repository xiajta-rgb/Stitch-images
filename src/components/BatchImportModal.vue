<template>
  <div v-if="visible" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content batch-import-modal">
      <div class="modal-header">
        <h3>批量导入图片URL</h3>
        <button class="close-btn" @click="closeModal">×</button>
      </div>
      <div class="batch-import-body">
        <div class="form-group">
          <label>选择标签</label>
          <div class="tag-selector-row">
            <div class="tag-category" v-for="cat in TAG_LIBRARY" :key="cat.name">
              <div class="tag-category-name">{{ cat.name }}</div>
              <div class="tag-options">
                <span
                  v-for="tag in cat.tags"
                  :key="tag"
                  class="tag-option"
                  :class="{ selected: selectedTags.includes(tag) }"
                  @click="toggleTag(tag)"
                >{{ tag }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label>图片URL（每行一个）</label>
          <textarea
            v-model="urls"
            class="url-textarea"
            placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg&#10;..."
          ></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button @click="closeModal" class="btn-action btn-cancel">取消</button>
        <button @click="confirmImport" class="btn-primary" :disabled="!urls.trim()">导入</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { TAG_LIBRARY } from '../types/tags';

const emit = defineEmits<{
  (e: 'confirm', data: { urls: string; tags: string[] }): void;
  (e: 'close'): void;
}>();

const visible = ref(true);
const urls = ref('');
const selectedTags = ref<string[]>([]);

const toggleTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag);
  if (index === -1) {
    selectedTags.value.push(tag);
  } else {
    selectedTags.value.splice(index, 1);
  }
};

const confirmImport = () => {
  emit('confirm', {
    urls: urls.value,
    tags: [...selectedTags.value]
  });
  closeModal();
};

const closeModal = () => {
  visible.value = false;
  urls.value = '';
  selectedTags.value = [];
  emit('close');
};

const open = () => {
  visible.value = true;
};

defineExpose({ open });
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

.modal-content {
  background: #fff;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.batch-import-modal {
  max-width: 700px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: #333;
}

.batch-import-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  font-size: 14px;
}

.tag-selector-row {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
}

.tag-category {
  margin-bottom: 12px;
}

.tag-category:last-child {
  margin-bottom: 0;
}

.tag-category-name {
  font-weight: 600;
  font-size: 13px;
  color: #333;
  margin-bottom: 6px;
}

.tag-options {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-option {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
  background: #f0f0f0;
  color: #666;
  transition: all 0.2s;
}

.tag-option:hover {
  background: #e0e0e0;
}

.tag-option.selected {
  background: #007bff;
  color: #fff;
}

.url-textarea {
  width: 100%;
  min-height: 150px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.btn-action {
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  border: 1px solid #ddd;
  background: #fff;
}

.btn-action.btn-cancel {
  color: #666;
}

.btn-action:hover {
  background: #f5f5f5;
}

.btn-primary {
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  border: none;
  background: #007bff;
  color: #fff;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>