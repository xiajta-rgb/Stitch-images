<template>
  <div class="gallery-page">
    <div class="page-header">
      <div class="header-left">
        <h2>图库管理</h2>
        <span class="record-count">{{ records.length }} 条记录</span>
      </div>
      <button @click="addNewRow" class="btn-primary">
        <span class="btn-icon">+</span> 新增图片
      </button>
    </div>

    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-checkbox">
              <input type="checkbox" @change="toggleSelectAll" :checked="isAllSelected" />
            </th>
            <th class="col-preview">
              <span class="th-content" @click="refreshSelectedPreviews" :class="{ loading: refreshingPreviews }" :title="refreshingPreviews ? '刷新中...' : '刷新选中的预览图'">
                预览
                <span v-if="selectedIds.length > 0 && !refreshingPreviews" class="refresh-badge">{{ selectedIds.length }}</span>
                <svg class="refresh-icon" :class="{ spinning: refreshingPreviews }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                </svg>
              </span>
            </th>
            <th class="col-name">
              <span class="th-content" @click="toggleSort('name')">
                名称
                <span class="sort-icon" v-if="sortField === 'name'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </span>
            </th>
            <th class="col-tags">标签</th>
            <th class="col-url">图片URL</th>
            <th class="col-time">
              <span class="th-content" @click="toggleSort('timestamp')">
                创建时间
                <span class="sort-icon" v-if="sortField === 'timestamp'">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </span>
            </th>
            <th class="col-action">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="sortedRecords.length === 0">
            <td colspan="7" class="empty-cell">
              <div class="empty-state-wrapper">
                <div class="empty-image-box">
                  <svg class="empty-svg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="8" y="12" width="48" height="40" rx="4" stroke="#d9d9d9" stroke-width="2"/>
                    <circle cx="24" cy="28" r="5" stroke="#d9d9d9" stroke-width="2"/>
                    <path d="M8 44L20 34L30 42L40 32L56 46" stroke="#d9d9d9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <p class="empty-title">暂无图片数据</p>
                <p class="empty-description">点击右上角「新增图片」按钮添加您的第一张图片</p>
              </div>
            </td>
          </tr>
          <tr
            v-for="record in sortedRecords"
            :key="record.id"
            :class="{ editing: editingId === record.id, selected: selectedIds.includes(record.id) }"
            @mouseenter="hoveredId = record.id"
            @mouseleave="hoveredId = null"
          >
            <td class="col-checkbox">
              <input type="checkbox" v-model="selectedIds" :value="record.id" />
            </td>
            <td class="col-preview">
              <div class="preview-cell" @click="previewImage(record)">
                <img v-if="record.dataURL" :src="record.dataURL" :alt="record.name" @error="handleImageError" />
                <div v-else class="no-image">暂无</div>
                <div class="preview-overlay">🔍</div>
              </div>
            </td>
            <td class="col-name">
              <input
                v-if="editingId === record.id"
                v-model="editingRow.name"
                class="edit-input"
                placeholder="输入图片名称"
              />
              <span v-else class="name-text" :title="record.name || '未命名'">
                {{ record.name || '未命名' }}
              </span>
            </td>
            <td class="col-tags">
              <div v-if="editingId === record.id" class="tags-edit">
                <input
                  v-model="editingRow.tagInput"
                  placeholder="输入标签回车添加"
                  class="edit-input tag-input"
                  @keydown.enter.prevent="addTagToEditing"
                />
                <div class="tags-preview">
                  <span v-for="(tag, i) in editingRow.tags" :key="i" class="tag">
                    {{ tag }}<span @click="removeTagFromEditing(i)" class="tag-remove">×</span>
                  </span>
                </div>
              </div>
              <div v-else class="tags-display">
                <span v-for="(tag, i) in record.tags" :key="i" class="tag" @click="filterByTag(tag)">{{ tag }}</span>
                <span v-if="!record.tags?.length" class="empty-text">-</span>
              </div>
            </td>
            <td class="col-url">
              <input
                v-if="editingId === record.id"
                v-model="editingRow.sourceUrl"
                class="edit-input"
                placeholder="输入图片URL"
              />
              <a
                v-else-if="record.sourceUrl"
                :href="record.sourceUrl"
                target="_blank"
                class="url-link"
                :title="record.sourceUrl"
              >
                {{ truncateUrl(record.sourceUrl) }}
              </a>
              <span v-else class="empty-text">-</span>
            </td>
            <td class="col-time">
              <span class="time-text">{{ formatTime(record.timestamp) }}</span>
            </td>
            <td class="col-action">
              <div v-if="editingId === record.id" class="action-btns">
                <button @click="saveRow(record.id)" class="btn-action btn-save">保存</button>
                <button @click="cancelEdit" class="btn-action btn-cancel">取消</button>
              </div>
              <div v-else class="action-btns">
                <button @click="startEdit(record)" class="btn-action btn-edit">编辑</button>
                <button @click="deleteRow(record.id)" class="btn-action btn-delete">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="selectedIds.length > 0" class="batch-bar">
      <span class="batch-info">
        <span class="batch-icon">✓</span>
        已选择 <strong>{{ selectedIds.length }}</strong> 项
      </span>
      <div class="batch-actions">
        <button @click="clearSelection" class="btn-action btn-cancel">取消选择</button>
        <button @click="deleteSelected" class="btn-action btn-delete">批量删除</button>
      </div>
    </div>

    <div v-if="previewModal.show" class="preview-modal" @click="previewModal.show = false">
      <img :src="previewModal.url" :alt="previewModal.name" class="preview-full-image" />
      <button class="preview-close">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, watch, onMounted } from 'vue';
import api from '../services/api';
const showToast = inject('showToast');
const openConfirm = inject('openConfirm');

interface PreviewRecord {
  id: string;
  dataURL: string;
  timestamp: Date | string;
  name?: string;
  tags?: string[];
  sourceUrl?: string;
}

const previewRecords = inject<{ value: PreviewRecord[] }>('previewRecords');
const updatePreviewRecords = inject<(records: PreviewRecord[]) => void>('updatePreviewRecords');

const records = computed(() => previewRecords?.value || []);
const selectedIds = ref<string[]>([]);
const editingId = ref<string | null>(null);
const hoveredId = ref<string | null>(null);
const sortField = ref<'name' | 'timestamp' | null>(null);
const sortOrder = ref<'asc' | 'desc'>('desc');
const loading = ref(false);
const refreshingPreviews = ref(false);

const editingRow = ref({ name: '', sourceUrl: '', tags: [] as string[], tagInput: '' });
const previewModal = ref({ show: false, url: '', name: '' });

const isAllSelected = computed(() => {
  return sortedRecords.value.length > 0 && selectedIds.value.length === sortedRecords.value.length;
});

const sortedRecords = computed(() => {
  if (!sortField.value) return records.value;
  return [...records.value].sort((a, b) => {
    let valA: any, valB: any;
    if (sortField.value === 'name') {
      valA = a.name || '';
      valB = b.name || '';
    } else {
      valA = new Date(a.timestamp).getTime();
      valB = new Date(b.timestamp).getTime();
    }
    if (sortOrder.value === 'asc') {
      return valA > valB ? 1 : -1;
    } else {
      return valA < valB ? 1 : -1;
    }
  });
});

watch(selectedIds, (newVal) => {
  if (newVal.length > 1) {
    selectedIds.value = newVal.slice(-1);
  }
});

// 从 API 刷新数据
const refreshData = async () => {
  loading.value = true;
  try {
    console.log('正在刷新数据...');
    const data = await api.getGallery();
    console.log('刷新到的数据:', data);
    if (updatePreviewRecords) {
      updatePreviewRecords(data.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      })));
    }
    console.log('刷新完成，当前 records:', records.value);
  } catch (error) {
    console.error('刷新数据失败:', error);
    if (showToast) {
      showToast('刷新数据失败', 'error');
    }
  } finally {
    loading.value = false;
  }
};

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = [];
  } else {
    selectedIds.value = sortedRecords.value.map(r => r.id);
  }
};

const toggleSort = (field: 'name' | 'timestamp') => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortOrder.value = 'desc';
  }
};

const filterByTag = (tag: string) => {
  console.log('Filter by tag:', tag);
};

const previewImage = (record: PreviewRecord) => {
  if (record.dataURL) {
    previewModal.value = { show: true, url: record.dataURL, name: record.name || '' };
  }
};

const addNewRow = async () => {
  if (!updatePreviewRecords) return;
  try {
    console.log('开始新增记录...');
    const newRecord = await api.addGallery({
      dataURL: '',
      name: '',
      tags: [],
      sourceUrl: ''
    });
    console.log('新增成功:', newRecord);
    await refreshData();
    console.log('刷新后 records:', records.value);
    setTimeout(() => {
      editingId.value = newRecord.id;
      editingRow.value = { name: '', sourceUrl: '', tags: [], tagInput: '' };
      console.log('进入编辑模式，editingId:', editingId.value);
    }, 100);
    if (showToast) {
      showToast('已新增图片记录，请编辑', 'success');
    }
  } catch (error) {
    console.error('添加记录失败:', error);
    if (showToast) {
      showToast('添加记录失败', 'error');
    }
  }
};

const startEdit = (record: PreviewRecord) => {
  editingId.value = record.id;
  editingRow.value = {
    name: record.name || '',
    sourceUrl: record.sourceUrl || '',
    tags: [...(record.tags || [])],
    tagInput: ''
  };
};

const cancelEdit = () => {
  editingId.value = null;
  editingRow.value = { name: '', sourceUrl: '', tags: [], tagInput: '' };
};

const saveRow = async (id: string) => {
  try {
    console.log('开始保存记录，id:', id);
    console.log('编辑内容:', editingRow.value);
    // 判断是新记录还是已存在的记录
    const existingRecord = records.value.find(r => r.id === id);
    console.log('现有记录:', existingRecord);
    
    const updateData = {
      name: editingRow.value.name,
      sourceUrl: editingRow.value.sourceUrl,
      tags: [...editingRow.value.tags],
      dataURL: (existingRecord?.dataURL || '') || editingRow.value.sourceUrl
    };
    
    console.log('要更新的数据:', updateData);
    
    const result = await api.updateGallery(id, updateData);
    console.log('更新结果:', result);
    
    await refreshData();
    editingId.value = null;
    editingRow.value = { name: '', sourceUrl: '', tags: [], tagInput: '' };
    if (showToast) {
      showToast('保存成功', 'success');
    }
  } catch (error) {
    console.error('保存失败:', error);
    if (showToast) {
      showToast('保存失败', 'error');
    }
  }
};

const deleteRow = async (id: string) => {
  if (!openConfirm) return;
  const confirmed = await openConfirm('确定删除该图片记录？', {
    title: '删除确认',
    type: 'warning',
    confirmText: '删除',
    cancelText: '取消'
  });
  if (confirmed) {
    try {
      await api.deleteGallery(id);
      await refreshData();
      selectedIds.value = selectedIds.value.filter(sid => sid !== id);
      if (showToast) {
        showToast('已删除图片记录', 'success');
      }
    } catch (error) {
      console.error('删除失败:', error);
      if (showToast) {
        showToast('删除失败', 'error');
      }
    }
  }
};

const deleteSelected = async () => {
  if (!openConfirm) return;
  const confirmed = await openConfirm(`确定删除选中的 ${selectedIds.value.length} 项记录？`, {
    title: '批量删除确认',
    type: 'error',
    confirmText: '删除',
    cancelText: '取消'
  });
  if (confirmed) {
    try {
      await api.batchDeleteGallery(selectedIds.value);
      await refreshData();
      selectedIds.value = [];
      if (showToast) {
        showToast('已批量删除成功', 'success');
      }
    } catch (error) {
      console.error('批量删除失败:', error);
      if (showToast) {
        showToast('批量删除失败', 'error');
      }
    }
  }
};

const clearSelection = () => {
  selectedIds.value = [];
};

const addTagToEditing = () => {
  const tag = editingRow.value.tagInput.trim();
  if (tag && !editingRow.value.tags.includes(tag)) {
    editingRow.value.tags.push(tag);
  }
  editingRow.value.tagInput = '';
};

const removeTagFromEditing = (index: number) => {
  editingRow.value.tags.splice(index, 1);
};

const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement;
  img.style.display = 'none';
};

const urlToDataURL = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error('网络请求失败');
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(blob);
    });
  } catch (corsError) {
    console.warn('CORS fetch failed, trying img crossOrigin method:', corsError);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          } else {
            reject(new Error('无法获取canvas上下文'));
          }
        } catch (e) {
          reject(new Error('图片转换失败，可能是CORS限制'));
        }
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = url;
    });
  }
};

const refreshSelectedPreviews = async () => {
  if (selectedIds.value.length === 0) {
    if (showToast) showToast('请先选择要刷新的图片', 'warning');
    return;
  }

  refreshingPreviews.value = true;
  let successCount = 0;
  let failCount = 0;

  for (const id of selectedIds.value) {
    const record = records.value.find(r => r.id === id);
    if (!record || !record.sourceUrl) continue;

    try {
      const dataURL = await urlToDataURL(record.sourceUrl);
      await api.updateGallery(id, { dataURL });
      successCount++;
    } catch (error) {
      console.error(`转换图片失败 ${record.sourceUrl}:`, error);
      failCount++;
    }
  }

  refreshingPreviews.value = false;

  if (successCount > 0) {
    await refreshData();
    if (showToast) showToast(`已刷新 ${successCount} 张图片`, 'success');
  }
  if (failCount > 0 && showToast) {
    showToast(`${failCount} 张图片刷新失败`, 'error');
  }
};

const truncateUrl = (url: string) => {
  if (!url) return '-';
  return url.length > 35 ? url.substring(0, 35) + '...' : url;
};

const formatTime = (date: Date) => {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 组件挂载时刷新数据
onMounted(() => {
  console.log('Gallery 组件挂载，刷新数据');
  refreshData();
});
</script>

<style scoped>
.gallery-page {
  width: 100%;
  background: #ffffff;
  border-radius: 6px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
  border: 1px solid #e8e8e8;
  padding: 16px;
  box-sizing: border-box;
  overflow: hidden;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-header h2 {
  margin: 0;
  font-size: 18px;
  color: #1a1a1a;
  font-weight: 600;
}

.record-count {
  padding: 4px 10px;
  background: #f0f5ff;
  color: #3366ff;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #3366ff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: #254edb;
}

.btn-icon {
  font-size: 16px;
  font-weight: bold;
}

.table-container {
  background: white;
  border-radius: 6px;
  overflow-x: auto;
  overflow-y: visible;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table th,
.data-table td {
  padding: 12px 12px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
}

.data-table th {
  background: #fafbfc;
  font-weight: 500;
  color: #666;
  font-size: 13px;
  border-bottom: 1px solid #e8e8e8;
}

.th-content {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  user-select: none;
}

.th-content:hover {
  color: #3366ff;
}

.sort-icon {
  color: #3366ff;
}

.col-checkbox { width: 50px; text-align: center; }
.col-preview { width: 80px; text-align: center; }

.col-preview .th-content {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.col-preview .refresh-badge {
  background: #3366ff;
  color: white;
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 8px;
  min-width: 16px;
  text-align: center;
}

.col-preview .refresh-icon {
  width: 14px;
  height: 14px;
  color: #3366ff;
  transition: transform 0.3s ease;
}

.col-preview .th-content:hover .refresh-icon {
  transform: rotate(180deg);
}

.col-preview .th-content.loading {
  cursor: wait;
}

.col-preview .refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.col-name { min-width: 150px; }
.col-tags { min-width: 180px; }
.col-url { min-width: 180px; }
.col-time { width: 160px; }
.col-action { width: 130px; }

.data-table tbody tr {
  transition: all 0.2s ease;
}

.data-table tbody tr:hover {
  background: #fafbfc;
}

.data-table tbody tr.selected {
  background: #f0f5ff;
}

.data-table tbody tr.editing {
  background: #fffbe6;
}

.empty-cell {
  text-align: center;
  padding: 80px 20px !important;
  border-bottom: none !important;
}

.empty-state-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-image-box {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border-radius: 50%;
  margin-bottom: 8px;
}

.empty-svg {
  width: 40px;
  height: 40px;
}

.empty-title {
  font-size: 15px;
  color: #262626;
  margin: 0;
  font-weight: 500;
}

.empty-description {
  font-size: 13px;
  color: #8c8c8c;
  margin: 0;
}

.preview-cell {
  width: 50px;
  height: 50px;
  overflow: hidden;
  border-radius: 6px;
  background: #f5f5f5;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s;
}

.preview-cell:hover {
  transform: scale(1.05);
}

.preview-cell:hover .preview-overlay {
  opacity: 1;
}

.preview-cell img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-cell .no-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ccc;
  font-size: 11px;
  background: #f8f8f8;
}

.preview-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  border-radius: 6px;
  font-size: 16px;
}

.name-text {
  display: block;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.edit-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  transition: border-color 0.2s;
  box-sizing: border-box;
  line-height: 1.4;
}

.edit-input:focus {
  outline: none;
  border-color: #3366ff;
  box-shadow: 0 0 0 3px rgba(51, 102, 255, 0.1);
}

.tags-edit {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tag-input {
  margin-bottom: 0;
}

.tags-preview,
.tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px 8px;
  background: linear-gradient(135deg, #e6f0ff 0%, #d4e4ff 100%);
  color: #3366ff;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.tag:hover {
  background: linear-gradient(135deg, #d4e4ff 0%, #c4d4ef 100%);
}

.tag-remove {
  cursor: pointer;
  font-weight: bold;
  margin-left: 2px;
  opacity: 0.7;
}

.tag-remove:hover {
  opacity: 1;
  color: #ff4d4f;
}

.empty-text {
  color: #ccc;
}

.url-link {
  color: #3366ff;
  text-decoration: none;
  font-size: 12px;
  transition: color 0.2s;
}

.url-link:hover {
  color: #254edb;
  text-decoration: underline;
}

.time-text {
  color: #888;
  font-size: 13px;
}

.action-btns {
  display: flex;
  gap: 6px;
}

.btn-action {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save {
  background: #3366ff;
  color: white;
}

.btn-save:hover {
  background: #254edb;
}

.btn-cancel {
  background: #f0f0f0;
  color: #666;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-edit {
  background: #f0f5ff;
  color: #3366ff;
}

.btn-edit:hover {
  background: #e0e8ff;
}

.btn-delete {
  background: #fff2f0;
  color: #ff4d4f;
}

.btn-delete:hover {
  background: #ffccc7;
}

.batch-bar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 12px 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 14px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid #f0f0f0;
  z-index: 100;
}

.batch-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #333;
}

.batch-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: #3366ff;
  color: white;
  border-radius: 50%;
  font-size: 11px;
}

.batch-actions {
  display: flex;
  gap: 8px;
}

.preview-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  cursor: pointer;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.preview-full-image {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.preview-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 24px;
  cursor: pointer;
  transition: background 0.2s;
}

.preview-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .table-container {
    overflow-x: auto;
  }

  .data-table {
    min-width: 900px;
  }

  .batch-bar {
    left: 16px;
    right: 16px;
    transform: none;
    flex-direction: column;
    gap: 12px;
  }

  .batch-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
