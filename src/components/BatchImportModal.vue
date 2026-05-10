<template>
  <div v-if="visible" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content batch-import-modal">
      <div class="modal-header">
        <h3>批量导入图片</h3>
        <button class="close-btn" @click="closeModal">×</button>
      </div>
      <div class="batch-import-body">
        <div class="import-hint" v-if="maxCount && maxCount > 0">
          当前宫格配置最多可导入 <strong>{{ maxCount }}</strong> 张图片
        </div>

        <div class="tab-bar">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'gallery' }"
            @click="activeTab = 'gallery'"
          >从图库导入</button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'url' }"
            @click="activeTab = 'url'"
          >URL导入</button>
        </div>

        <div v-if="activeTab === 'gallery'" class="tab-content">
          <div class="gallery-grid" v-if="galleryImages && galleryImages.length > 0">
            <div
              v-for="img in galleryImages"
              :key="img.id"
              class="gallery-item"
              :class="{ selected: selectedIds.includes(img.id) }"
              @click="toggleSelect(img.id)"
            >
              <div class="gallery-thumb">
                <img
                  v-if="getImgSrc(img)"
                  :src="getImgSrc(img)"
                  @error="handleImgError"
                />
                <div v-else class="img-placeholder">无预览</div>
              </div>
              <div class="gallery-name" :title="img.name">{{ img.name || '未命名' }}</div>
              <div v-if="selectedIds.includes(img.id)" class="check-mark">{{ selectedIds.indexOf(img.id) + 1 }}</div>
            </div>
          </div>
          <div v-else class="empty-gallery">图库中暂无图片</div>
          <div class="select-info" v-if="selectedIds.length > 0">
            已选择 {{ selectedIds.length }} / {{ maxCount }} 张
          </div>
        </div>

        <div v-if="activeTab === 'url'" class="tab-content">
          <div class="form-group">
            <label>图片URL（每行一个）</label>
            <textarea
              v-model="urls"
              class="url-textarea"
              placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg&#10;..."
            ></textarea>
          </div>
          <div class="url-count" v-if="urlCount > 0">
            已输入 {{ urlCount }} 个URL
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button @click="closeModal" class="btn-action btn-cancel">取消</button>
        <button
          @click="confirmImport"
          class="btn-primary"
          :disabled="!canConfirm"
        >导入</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue';
import type { PreviewRecord, ShowToastFunction } from '../types';

const showToast = inject<ShowToastFunction>('showToast');

const props = defineProps<{
  maxCount?: number;
  galleryImages?: PreviewRecord[];
}>();

const emit = defineEmits<{
  (e: 'confirmFromGallery', ids: string[]): void;
  (e: 'confirmFromUrl', data: { urls: string }): void;
}>();

const visible = ref(false);
const activeTab = ref<'gallery' | 'url'>('gallery');
const urls = ref('');
const selectedIds = ref<string[]>([]);

const urlCount = computed(() => {
  return urls.value.split('\n').map(u => u.trim()).filter(u => u).length;
});

const canConfirm = computed(() => {
  if (activeTab.value === 'gallery') {
    return selectedIds.value.length > 0;
  }
  return urls.value.trim().length > 0;
});

const getImgSrc = (img: PreviewRecord) => {
  return (img.dataURL && img.dataURL.startsWith('data:')) ? img.dataURL : img.sourceUrl || '';
};

const handleImgError = (e: Event) => {
  const img = e.target as HTMLImageElement;
  img.style.display = 'none';
};

const toggleSelect = (id: string) => {
  const max = props.maxCount || 999;
  const index = selectedIds.value.indexOf(id);
  if (index !== -1) {
    selectedIds.value.splice(index, 1);
  } else if (selectedIds.value.length < max) {
    selectedIds.value.push(id);
  } else {
    if (showToast) showToast(`最多只能选择 ${max} 张图片`, 'warning');
  }
};

const confirmImport = () => {
  if (activeTab.value === 'gallery') {
    emit('confirmFromGallery', [...selectedIds.value]);
  } else {
    emit('confirmFromUrl', { urls: urls.value });
  }
};

const closeModal = () => {
  visible.value = false;
  urls.value = '';
  selectedIds.value = [];
  activeTab.value = 'gallery';
};

const open = () => {
  visible.value = true;
};

defineExpose({ open, closeModal });
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
  max-width: 700px;
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

.import-hint {
  padding: 10px 14px;
  background: #f0f5ff;
  border: 1px solid #d6e4ff;
  border-radius: 8px;
  font-size: 13px;
  color: #3366ff;
  margin-bottom: 16px;
}

.import-hint strong {
  font-weight: 600;
}

.tab-bar {
  display: flex;
  gap: 0;
  margin-bottom: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.tab-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  background: #f8f8f8;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

.tab-btn:first-child {
  border-right: 1px solid #ddd;
}

.tab-btn.active {
  background: #3366ff;
  color: #fff;
}

.tab-btn:hover:not(.active) {
  background: #eee;
}

.tab-content {
  min-height: 200px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 10px;
  max-height: 350px;
  overflow-y: auto;
  padding: 4px;
}

.gallery-item {
  position: relative;
  border: 2px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
  background: #fafafa;
}

.gallery-item:hover {
  border-color: #3366ff;
}

.gallery-item.selected {
  border-color: #3366ff;
  background: #f0f5ff;
}

.gallery-thumb {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.gallery-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.img-placeholder {
  font-size: 11px;
  color: #999;
}

.gallery-name {
  padding: 4px 6px;
  font-size: 11px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.check-mark {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: #3366ff;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.empty-gallery {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 14px;
}

.select-info {
  margin-top: 12px;
  font-size: 12px;
  color: #3366ff;
  text-align: right;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  font-size: 14px;
}

.url-textarea {
  width: 100%;
  min-height: 200px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
}

.url-textarea:focus {
  outline: none;
  border-color: #3366ff;
  box-shadow: 0 0 0 2px rgba(51, 102, 255, 0.1);
}

.url-count {
  font-size: 12px;
  color: #666;
  text-align: right;
  margin-top: 8px;
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
  background: #3366ff;
  color: #fff;
}

.btn-primary:hover {
  background: #254edb;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
