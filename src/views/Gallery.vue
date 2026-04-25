<template>
  <div class="gallery-page">
    <div class="page-header">
      <div class="header-left">
        <h2>图库管理</h2>
        <span class="record-count">{{ records.length }} 条记录</span>
      </div>
    </div>

    <!-- 搜索与筛选区域 -->
    <div class="search-filter-area">
      <div class="search-bar-row">
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索图片名称、URL或标签..."
            class="search-input"
          />
          <span class="search-icon">🔍</span>
        </div>
        
        <button @click="openBatchImportModal" class="btn-batch-import">
          <span class="btn-icon">📥</span> 批量导入URL
        </button>
        
        <button @click="addNewRow" class="btn-add-new">
          <span class="btn-icon">+</span> 新增图片
        </button>
      </div>
      
      <div class="filter-box">
        <div class="filter-header">
          <label class="filter-label">标签筛选：</label>
          <input
            v-model="tagSearchQuery"
            type="text"
            class="tag-search-input"
            placeholder="搜索标签..."
          />
        </div>
        <div class="tag-filter-options">
          <span
            class="tag-option-filter"
            :class="{ active: selectedFilterTag === null }"
            @click="selectedFilterTag = null"
          >
            全部 ({{ records.length }})
          </span>
          <span
            v-for="tag in filteredTags"
            :key="tag"
            class="tag-option-filter"
            :class="{ active: selectedFilterTag === tag }"
            @click="toggleFilterTag(tag)"
          >
            {{ tag }}
          </span>
          <span v-if="filteredTags.length === 0 && tagSearchQuery" class="no-tags-hint">
            没有找到匹配的标签
          </span>
        </div>
      </div>
    </div>

    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-checkbox">
              <input type="checkbox" @change="toggleSelectAll" :checked="isAllSelected" />
            </th>
            <th class="col-index">序号</th>
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
            <td colspan="8" class="empty-cell">
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
            v-for="record in paginatedRecords"
            :key="record.id"
            :class="{ editing: editingId === record.id, selected: selectedIds.includes(record.id) }"
            @mouseenter="hoveredId = record.id"
            @mouseleave="hoveredId = null"
          >
            <td class="col-checkbox">
              <input type="checkbox" v-model="selectedIds" :value="record.id" />
            </td>
            <td class="col-index">{{ getRecordIndex(record.id) }}</td>
            <td class="col-preview">
              <div class="preview-cell" @click="previewImage(record)">
                <img v-if="record.dataURL && record.dataURL.startsWith('data:')" :src="record.dataURL" :alt="record.name" @error="handleImageError" />
                <img v-else-if="record.sourceUrl" :src="record.sourceUrl" :alt="record.name" @error="handleImageError" />
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
                <div class="tag-input-row">
                  <input
                    v-model="editingRow.tagInput"
                    placeholder="输入标签回车添加"
                    class="edit-input tag-input"
                    @keydown.enter.prevent="addTagToEditing"
                  />
                  <button class="tag-selector-btn" @click.stop="toggleTagSelector" type="button">标签库 ▾</button>
                </div>
                <div class="tag-selector-popup" v-if="showTagSelector">
                  <div class="tag-category" v-for="cat in TAG_LIBRARY" :key="cat.name">
                    <div class="tag-category-name">{{ cat.name }}</div>
                    <div class="tag-options">
                      <span
                        v-for="tag in cat.tags"
                        :key="tag"
                        class="tag-option"
                        :class="{ selected: editingRow.tags.includes(tag) }"
                        @click="toggleTagFromLibrary(tag)"
                      >{{ tag }}</span>
                    </div>
                  </div>
                </div>
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

    <div class="pagination" v-if="totalPages > 0">
      <span class="pagination-info">
        显示 {{ paginationInfo.start }}-{{ paginationInfo.end }} 条，共 {{ paginationInfo.total }} 条
      </span>
      <div class="pagination-controls">
        <button @click="goToPage(1)" :disabled="currentPage === 1" class="page-btn">«</button>
        <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" class="page-btn">‹</button>
        <span class="page-numbers">
          <template v-for="page in visiblePages" :key="page">
            <button
              v-if="page !== '...'"
              @click="goToPage(page as number)"
              class="page-btn"
              :class="{ active: currentPage === page }"
            >{{ page }}</button>
            <span v-else class="page-ellipsis">...</span>
          </template>
        </span>
        <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages" class="page-btn">›</button>
        <button @click="goToPage(totalPages)" :disabled="currentPage === totalPages" class="page-btn">»</button>
      </div>
      <select v-model="pageSize" class="page-size-select">
        <option :value="10">10条/页</option>
        <option :value="20">20条/页</option>
        <option :value="50">50条/页</option>
      </select>
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

    <BatchImportModal
      ref="batchImportModalRef"
      @confirm="handleBatchImportConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, watch, onMounted } from 'vue';
import api from '../services/api';
import { TAG_LIBRARY } from '../types/tags';
import { PreviewRecord, ShowToastFunction, OpenConfirmFunction, PreviewRecordsRef, UpdatePreviewRecordsFunction } from '../types';
import BatchImportModal from '../components/BatchImportModal.vue';

const showToast = inject<ShowToastFunction>('showToast');
const openConfirm = inject<OpenConfirmFunction>('openConfirm');

const previewRecords = inject<PreviewRecordsRef>('previewRecords');
const updatePreviewRecords = inject<UpdatePreviewRecordsFunction>('updatePreviewRecords');

const records = computed(() => previewRecords?.value || []);
const selectedIds = ref<string[]>([]);
const editingId = ref<string | null>(null);
const hoveredId = ref<string | null>(null);
const sortField = ref<'name' | 'timestamp' | null>(null);
const sortOrder = ref<'asc' | 'desc'>('desc');
const currentPage = ref(1);
const pageSize = ref(10);
const loading = ref(false);
const refreshingPreviews = ref(false);

const editingRow = ref({ name: '', sourceUrl: '', tags: [] as string[], tagInput: '' });
const previewModal = ref({ show: false, url: '', name: '' });
const showTagSelector = ref(false);
const batchImportModalRef = ref<InstanceType<typeof BatchImportModal> | null>(null);

// 搜索与筛选状态
const searchQuery = ref('');
const selectedFilterTag = ref<string | null>(null);
const tagSearchQuery = ref('');

const isAllSelected = computed(() => {
  return sortedRecords.value.length > 0 && selectedIds.value.length === sortedRecords.value.length;
});

// 提取所有已使用的标签（去重）
const allTags = computed(() => {
  const tagsSet = new Set<string>();
  records.value.forEach(record => {
    if (record.tags) {
      record.tags.forEach(tag => tagsSet.add(tag));
    }
  });
  return Array.from(tagsSet).sort();
});

// 根据搜索过滤标签
const filteredTags = computed(() => {
  if (!tagSearchQuery.value) return allTags.value;
  const query = tagSearchQuery.value.toLowerCase();
  return allTags.value.filter(tag => tag.toLowerCase().includes(query));
});

// 切换标签筛选
const toggleFilterTag = (tag: string) => {
  if (selectedFilterTag.value === tag) {
    selectedFilterTag.value = null;
  } else {
    selectedFilterTag.value = tag;
  }
};

const sortedRecords = computed(() => {
  // 1. 先筛选
  let filtered = records.value.filter(record => {
    // 标签筛选
    if (selectedFilterTag.value) {
      if (!record.tags || !record.tags.includes(selectedFilterTag.value)) {
        return false;
      }
    }
    // 搜索筛选
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase().trim();
      const nameMatch = record.name?.toLowerCase().includes(query);
      const urlMatch = record.sourceUrl?.toLowerCase().includes(query);
      const tagsMatch = record.tags?.some(tag => tag.toLowerCase().includes(query));
      if (!nameMatch && !urlMatch && !tagsMatch) {
        return false;
      }
    }
    return true;
  });

  // 2. 再排序
  if (sortField.value) {
    filtered = [...filtered].sort((a, b) => {
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
  }

  return filtered;
});

const getRecordIndex = (id: string): number => {
  const index = sortedRecords.value.findIndex(r => r.id === id);
  return index + 1 + (currentPage.value - 1) * pageSize.value;
};

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return sortedRecords.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(sortedRecords.value.length / pageSize.value);
});

const visiblePages = computed(() => {
  const pages: (number | string)[] = [];
  const total = totalPages.value;
  const current = currentPage.value;

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(total);
    } else if (current >= total - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = total - 4; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      for (let i = current - 1; i <= current + 1; i++) pages.push(i);
      pages.push('...');
      pages.push(total);
    }
  }
  return pages;
});

const paginationInfo = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value + 1;
  const end = Math.min(currentPage.value * pageSize.value, sortedRecords.value.length);
  return { start, end, total: sortedRecords.value.length };
});

const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
};

watch(() => sortedRecords.value.length, () => {
  if (currentPage.value > totalPages.value && totalPages.value > 0) {
    currentPage.value = totalPages.value;
  }
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
    const data = await api.getGallery();
    if (updatePreviewRecords) {
      updatePreviewRecords(data.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      })));
    }
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
  toggleFilterTag(tag);
};

const previewImage = (record: PreviewRecord) => {
  const imageUrl = (record.dataURL && record.dataURL.startsWith('data:'))
    ? record.dataURL
    : record.sourceUrl;
  if (imageUrl) {
    previewModal.value = { show: true, url: imageUrl, name: record.name || '' };
  }
};

const openBatchImportModal = () => {
  batchImportModalRef.value?.open();
};

const handleBatchImportConfirm = async (data: { urls: string; tags: string[] }) => {
  const lines = data.urls.split('\n').map(line => line.trim()).filter(line => line);
  if (lines.length === 0) {
    if (showToast) showToast('请输入至少一个URL', 'warning');
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (const url of lines) {
    try {
      await api.addGallery({
        sourceUrl: url,
        dataURL: url,
        name: extractFileName(url),
        tags: [...data.tags]
      });
      successCount++;
    } catch (error) {
      console.error(`导入失败 ${url}:`, error);
      failCount++;
    }
  }

  if (successCount > 0) {
    await refreshData();
    if (showToast) showToast(`成功导入 ${successCount} 个图片`, 'success');
  }
  if (failCount > 0 && showToast) {
    showToast(`${failCount} 个图片导入失败`, 'error');
  }
};

const extractFileName = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const fileName = pathname.split('/').pop() || '';
    return fileName.replace(/[?#].*/, '') || '未命名';
  } catch {
    return '未命名';
  }
};

const addNewRow = async () => {
  if (!updatePreviewRecords) return;
  try {
    const newRecord = await api.addGallery({
      dataURL: '',
      name: '',
      tags: [],
      sourceUrl: ''
    });
    await refreshData();
    setTimeout(() => {
      editingId.value = newRecord.id;
      editingRow.value = { name: '', sourceUrl: '', tags: [], tagInput: '' };
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
    const existingRecord = records.value.find(r => r.id === id);

    if (!existingRecord) {
      if (showToast) {
        showToast('保存失败：记录不存在', 'error');
      }
      return;
    }

    const updateData = {
      name: editingRow.value.name || '未命名',
      sourceUrl: editingRow.value.sourceUrl,
      tags: [...editingRow.value.tags],
      dataURL: existingRecord?.dataURL || editingRow.value.sourceUrl || ''
    };

    await api.updateGallery(id, updateData);

    await refreshData();
    editingId.value = null;
    editingRow.value = { name: '', sourceUrl: '', tags: [], tagInput: '' };
    if (showToast) {
      showToast('保存成功', 'success');
    }
  } catch (error: any) {
    console.error('保存失败:', error);
    if (error?.message?.includes('404')) {
      if (showToast) {
        showToast('保存失败：该记录不存在，请刷新页面重试', 'error');
      }
    } else {
      if (showToast) {
        showToast('保存失败', 'error');
      }
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

const toggleTagSelector = () => {
  showTagSelector.value = !showTagSelector.value;
};

const toggleTagFromLibrary = (tag: string) => {
  const index = editingRow.value.tags.indexOf(tag);
  if (index === -1) {
    editingRow.value.tags.push(tag);
  } else {
    editingRow.value.tags.splice(index, 1);
  }
};

const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement;
  img.style.display = 'none';
};

const urlToDataURL = (url: string): Promise<string> => {
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
        reject(new Error('图片转换失败'));
      }
    };
    img.onerror = () => reject(new Error('图片加载失败，请检查URL是否可访问'));
    img.src = url;
  });
};

const refreshSelectedPreviews = async () => {
  if (selectedIds.value.length === 0) {
    if (showToast) showToast('请先选择要刷新的图片', 'warning');
    return;
  }

  if (!previewRecords) {
    if (showToast) showToast('数据加载异常', 'error');
    return;
  }

  refreshingPreviews.value = true;
  let successCount = 0;
  let failCount = 0;

  for (const id of selectedIds.value) {
    const record = records.value.find(r => r.id === id);
    if (!record) continue;

    const sourceUrl = record.sourceUrl || (record as any).url;
    if (!sourceUrl) {
      failCount++;
      continue;
    }

    try {
      const dataURL = await urlToDataURL(sourceUrl);

      const idx = previewRecords.value.findIndex(r => r.id === id);
      if (idx !== -1) {
        previewRecords.value[idx] = {
          ...previewRecords.value[idx],
          dataURL
        };
      }

      await api.updateGallery(id, { dataURL });
      successCount++;
    } catch (error) {
      console.error(`转换图片失败 ${sourceUrl}:`, error);
      failCount++;
    }
  }

  refreshingPreviews.value = false;

  if (successCount > 0) {
    if (showToast) showToast(`已刷新 ${successCount} 张图片`, 'success');
  }
  if (failCount > 0 && showToast) {
    showToast(`${failCount} 张图片刷新失败，可能是CORS限制或URL无效`, 'error');
  }
};

const truncateUrl = (url: string) => {
  if (!url) return '-';
  return url.length > 35 ? url.substring(0, 35) + '...' : url;
};

const formatTime = (date: string | Date) => {
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
  overflow: visible !important;
  position: relative;
  z-index: 1;
}

.page-header {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  margin-bottom: 12px !important;
  padding-bottom: 12px !important;
  border-bottom: 1px solid #f0f0f0 !important;
  position: relative !important;
  z-index: 100 !important;
  min-height: 60px !important;
  width: 100% !important;
  overflow: visible !important;
  flex-wrap: nowrap !important;
  gap: 12px !important;
}

.header-left {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  flex-shrink: 1 !important;
  min-width: fit-content !important;
  overflow: visible !important;
}

/* 搜索与筛选区域 */
.search-filter-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.search-bar-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 250px;
  max-width: 500px;
}

.btn-batch-import {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #3366ff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-batch-import:hover {
  background: #254edb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(51, 102, 255, 0.3);
}

.btn-add-new {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #52c41a;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-add-new:hover {
  background: #389e0d;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);
}

.search-input {
  width: 100%;
  padding: 12px 44px 12px 16px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: #3366ff;
  box-shadow: 0 0 0 3px rgba(51, 102, 255, 0.1);
}

.search-icon {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: #999;
}

.filter-box {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
}

.filter-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  flex-shrink: 0;
}

.tag-search-input {
  padding: 6px 12px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  font-size: 13px;
  width: 150px;
  outline: none;
  transition: border-color 0.2s;
}

.tag-search-input:focus {
  border-color: #3366ff;
}

.tag-filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.tag-option-filter {
  padding: 6px 14px;
  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

.tag-option-filter:hover {
  border-color: #3366ff;
  color: #3366ff;
  background: #f0f5ff;
}

.tag-option-filter.active {
  background: #3366ff;
  color: white;
  border-color: #3366ff;
}

.no-tags-hint {
  color: #999;
  font-size: 13px;
  font-style: italic;
  padding: 6px 14px;
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

.btn-primary:disabled {
  background: #a0a0a0;
  cursor: not-allowed;
}

.btn-secondary {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
  padding: 10px 18px !important;
  min-width: 130px !important;
  background: #f0f5ff !important;
  color: #3366ff !important;
  border: 1px solid #3366ff !important;
  border-radius: 6px !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  flex-shrink: 0 !important;
  position: relative !important;
  z-index: 1000 !important;
  opacity: 1 !important;
  visibility: visible !important;
  overflow: visible !important;
}

.btn-secondary:hover {
  background: #e0e8ff !important;
  border-color: #254edb !important;
  color: #254edb !important;
}

.header-actions {
  display: flex !important;
  gap: 12px !important;
  flex-shrink: 0 !important;
  z-index: 1000 !important;
  position: relative !important;
  align-items: center !important;
  min-width: fit-content !important;
  overflow: visible !important;
  width: auto !important;
  flex-wrap: nowrap !important;
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
.col-index { width: 60px; text-align: center; color: #999; font-size: 12px; }
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

.tag-input-row {
  display: flex;
  gap: 4px;
}

.tag-input-row .edit-input {
  flex: 1;
}

.tag-selector-btn {
  padding: 6px 10px;
  background: #f0f0f0;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}

.tag-selector-btn:hover {
  background: #e8e8e8;
}

.tag-selector-popup {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 12px;
}

.tag-category {
  margin-bottom: 12px;
}

.tag-category:last-child {
  margin-bottom: 0;
}

.tag-category-name {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 6px;
  padding-bottom: 4px;
  border-bottom: 1px solid #f0f0f0;
}

.tag-options {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-option {
  padding: 4px 8px;
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}

.tag-option:hover {
  background: #e8e8e8;
}

.tag-option.selected {
  background: #3366ff;
  border-color: #3366ff;
  color: white;
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

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
  margin-top: 8px;
}

.pagination-info {
  color: #666;
  font-size: 13px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #e8e8e8;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  border-color: #3366ff;
  color: #3366ff;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-btn.active {
  background: #3366ff;
  border-color: #3366ff;
  color: white;
}

.page-ellipsis {
  padding: 0 4px;
  color: #999;
}

.page-size-select {
  margin-left: 16px;
  padding: 6px 10px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  font-size: 13px;
  background: white;
  cursor: pointer;
}

.page-numbers {
  display: flex;
  align-items: center;
  gap: 4px;
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

.batch-import-modal {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.batch-import-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.batch-import-body .form-group {
  margin-bottom: 16px;
}

.batch-import-body .form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.tag-selector-row {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 10px;
}

.tag-selector-row .tag-category {
  margin-bottom: 10px;
}

.tag-selector-row .tag-category-name {
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}

.tag-selector-row .tag-options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-selector-row .tag-option {
  padding: 4px 10px;
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-selector-row .tag-option:hover {
  border-color: #3366ff;
}

.tag-selector-row .tag-option.selected {
  background: #3366ff;
  color: white;
  border-color: #3366ff;
}

.url-textarea {
  width: 100%;
  min-height: 150px;
  padding: 10px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  font-size: 13px;
  font-family: monospace;
  resize: vertical;
}

.url-textarea:focus {
  outline: none;
  border-color: #3366ff;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
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
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
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
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  line-height: 1;
}

.close-btn:hover {
  color: #333;
}

.batch-import-modal {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.batch-import-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.batch-import-body .form-group {
  margin-bottom: 20px;
}

.batch-import-body .form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.tag-selector-row {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 12px;
}

.tag-selector-row .tag-category {
  margin-bottom: 14px;
}

.tag-selector-row .tag-category:last-child {
  margin-bottom: 0;
}

.tag-selector-row .tag-category-name {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tag-selector-row .tag-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-selector-row .tag-option {
  padding: 6px 14px;
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-selector-row .tag-option:hover {
  border-color: #3366ff;
  background: #f0f5ff;
}

.tag-selector-row .tag-option.selected {
  background: #3366ff;
  color: white;
  border-color: #3366ff;
}

.url-textarea {
  width: 100%;
  min-height: 150px;
  padding: 12px 14px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  font-size: 13px;
  font-family: monospace;
  resize: vertical;
  line-height: 1.6;
}

.url-textarea:focus {
  outline: none;
  border-color: #3366ff;
  box-shadow: 0 0 0 3px rgba(51, 102, 255, 0.1);
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 固定备用按钮（确保100%可见） */
.backup-fixed-btn {
  position: fixed !important;
  top: 80px !important;
  right: 20px !important;
  z-index: 99999 !important;
  padding: 12px 20px !important;
  background: #3366ff !important;
  color: white !important;
  border: none !important;
  border-radius: 8px !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  box-shadow: 0 4px 14px rgba(51, 102, 255, 0.4) !important;
  opacity: 1 !important;
  visibility: visible !important;
  display: block !important;
  min-width: 120px !important;
  white-space: nowrap !important;
  transition: all 0.2s !important;
}

.backup-fixed-btn:hover {
  background: #254edb !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 18px rgba(51, 102, 255, 0.5) !important;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column !important;
    gap: 12px !important;
    align-items: flex-start !important;
    width: 100% !important;
    overflow: visible !important;
    flex-wrap: nowrap !important;
  }

  .header-actions {
    width: 100% !important;
    justify-content: flex-start !important;
    overflow: visible !important;
  }

  .btn-secondary {
    min-width: auto !important;
    width: auto !important;
    display: inline-flex !important;
  }

  .table-container {
    overflow-x: auto;
  }

  .data-table {
    min-width: 900px;
  }

  .pagination {
    flex-direction: column;
    gap: 12px;
  }

  .pagination-controls {
    flex-wrap: wrap;
    justify-content: center;
  }

  .page-size-select {
    margin-left: 0;
    margin-top: 8px;
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
