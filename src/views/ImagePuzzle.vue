<template>
  <div class="page-container">
    <!-- 右键菜单 -->
    <div 
      v-if="showContextMenu" 
      class="context-menu" 
      :style="{ left: menuX + 'px', top: menuY + 'px' }"
      @click.stop
    >
      <div class="menu-item" @click="bringToFront">向前置顶</div>
      <div class="menu-item" @click="sendToBack">向后置顶</div>
      <div class="menu-divider"></div>
      <div class="menu-item delete-item" @click="deleteImage">删除图片</div>
    </div>
    
    <!-- 头部操作区域 -->
    <HeaderControls
      :templates="templates"
      :resolutions="resolutions"
      :selectedTemplate="selectedTemplate"
      :selectedResolution="selectedResolution"
      :gridConfig="currentGridConfig"
      @selectTemplate="selectTemplate"
      @selectResolution="selectResolution"
      @updateGridConfig="updateGridConfig"
    />

    <!-- 画布容器 -->
    <CanvasContainer
      ref="canvasContainerRef"
      :canvasWidth="canvasWidth"
      :canvasHeight="canvasHeight"
      :canvasBackgroundColor="canvasBackgroundColor"
      :showGrid="showGrid"
      :uploadedImage="uploadedImage"
      :imageInfo="imageInfo"
      :gridConfig="currentGridConfig"
      @updateBackgroundColor="updateCanvasBackground"
      @toggleGrid="toggleGrid"
      @canvasInitialized="handleCanvasInitialized"
      @updateGridLineWidth="updateGridLineWidth"
      @updateGridGap="updateGridGap"
      @updateGridMargin="updateGridMargin"
      @gridCellClick="handleGridCellClick"
      @export="exportCanvas"
    />

    <!-- 隐藏的文件输入元素，用于分宫格上传 -->
    <input
      type="file"
      id="grid-file-input"
      accept="image/*"
      style="display: none;"
      @change="handleFileUpload"
    />

    <!-- 图库选择弹窗 -->
    <Transition name="modal-fade">
      <div v-if="showGalleryModal" class="modal-overlay" @click.self="showGalleryModal = false">
        <Transition name="modal-scale">
          <div class="modal-content gallery-select-modal">
            <div class="modal-header">
              <h3>从图库选择图片</h3>
              <button class="close-btn" @click="showGalleryModal = false">×</button>
            </div>
            <div class="gallery-search">
              <input
                v-model="gallerySearchKeyword"
                type="text"
                class="gallery-search-input"
                placeholder="搜索标签或名称..."
              />
            </div>
            <div class="gallery-list">
              <Transition name="gallery-fade" mode="out-in">
                <div v-if="filteredGalleryImages.length === 0" key="empty" class="empty-gallery">
                  <div v-if="gallerySearchKeyword">没有找到匹配的图片</div>
                  <div v-else>图库中暂无图片，请先在图库管理中添加</div>
                </div>
                <div v-else key="grid" class="gallery-grid">
                  <div
                    v-for="img in filteredGalleryImages"
                    :key="img.id"
                    class="gallery-item"
                    :class="{ selected: selectedGalleryIds.includes(img.id) }"
                    @click="toggleGallerySelect(img.id)"
                  >
                    <input type="radio" name="gallery-select" :checked="selectedGalleryIds.includes(img.id)" @click.stop />
                    <div class="img-preview">
                      <img v-if="getGalleryImgSrc(img)" :src="getGalleryImgSrc(img)" :alt="img.name" @error="handleGalleryImgError" />
                      <div v-else class="img-placeholder">暂无图片</div>
                    </div>
                    <div class="img-tags" v-if="img.tags?.length">
                      <span v-for="(tag, i) in img.tags.slice(0, 2)" :key="i" class="img-tag">{{ tag }}</span>
                    </div>
                    <div class="img-info">
                      <span class="img-name" :class="{ unnamed: !img.name }">{{ img.name || '未命名' }}</span>
                      <div class="img-info-tags" v-if="img.tags?.length">
                        <span v-for="(tag, i) in img.tags.slice(0, 2)" :key="i" class="img-info-tag">{{ tag }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
            <div class="modal-footer">
              <span class="select-count">已选择 {{ selectedGalleryIds.length }} 张</span>
              <button class="btn-cancel" @click="showGalleryModal = false">取消</button>
              <button class="btn-confirm" @click="importFromGallery" :disabled="selectedGalleryIds.length === 0">导入</button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, inject, computed } from 'vue';
import { ShowToastFunction, PreviewRecordsRef, UpdatePreviewRecordsFunction } from '../types';

// 注入全局预览记录状态
const globalPreviewRecords = inject<PreviewRecordsRef>('previewRecords');
const updateGlobalPreviewRecords = inject<UpdatePreviewRecordsFunction>('updatePreviewRecords');
const showToast = inject<ShowToastFunction>('showToast');

// 导入组件
import HeaderControls from '../components/HeaderControls.vue';
import CanvasContainer from '../components/CanvasContainer.vue';
import api from '../services/api';

// 预设画布分辨率
const resolutions = [
  { id: 'square-600', name: '正方形 600x600', width: 600, height: 600 },
  { id: 'rect-600-800', name: '矩形 600x800', width: 600, height: 800 },
  { id: 'rect-800-600', name: '矩形 800x600', width: 800, height: 600 },
  { id: 'long-600-1200', name: '长图 600x1200', width: 600, height: 1200 },
  { id: 'long-1200-600', name: '宽图 1200x600', width: 1200, height: 600 }
];

// 拼图模板定义
const templates = [
  { id: '3-grid', name: '3宫格', width: 600, height: 800, grid: { rows: 3, cols: 1, gap: 20, margin: 20 } },
  { id: '4-grid', name: '4宫格', width: 600, height: 600, grid: { rows: 2, cols: 2, gap: 20, margin: 20 } },
  { id: 'long', name: '长图', width: 600, height: 1200, grid: { rows: 4, cols: 1, gap: 20, margin: 20 } }
];

// 响应式数据 - 选中的分辨率
const selectedResolution = ref('rect-600-800');

// 响应式数据
const selectedTemplate = ref('3-grid');
const canvasWidth = ref(600);
const canvasHeight = ref(800);
const canvasBackgroundColor = ref('#ffffff');
const showGrid = ref(true);
const uploadedImage = ref('');
const imageInfo = ref({ name: '', type: '', size: 0 });
const gridLineWidth = ref(1.5);
const gridGap = ref(20); // 宫格间距，默认20px
const gridMargin = ref(20); // 宫格与画布边缘的间距，默认20px
// 右键菜单相关
const showContextMenu = ref(false);
const menuX = ref(0);
const menuY = ref(0);

// CanvasContainer组件引用
const canvasContainerRef = ref<any>(null);

// 当前宫格配置
const currentGridConfig = ref({ rows: 3, cols: 1, gap: 20, margin: 20 });

// 标志，用于确保initCanvas()函数只被调用一次
let isCanvasInitialized = false;

// 监听canvasContainerRef的previewRecords变化，更新全局状态
watch(
  () => canvasContainerRef.value?.previewRecords,
  (newRecords) => {
    if (newRecords && updateGlobalPreviewRecords) {
      // 确保传递的是数组本身，而不是ref对象
      const recordsArray = typeof newRecords === 'object' && 'value' in newRecords 
        ? newRecords.value 
        : newRecords;
      updateGlobalPreviewRecords(recordsArray);
    }
  },
  { deep: true, immediate: true }
);

// Canvas 实例
let canvasElement: HTMLCanvasElement | null = null;

// 当前选中的宫格索引，用于分宫格上传图片
let currentGridIndex: number | null = null;

// 图库导入相关
const showGalleryModal = ref(false);
const selectedGalleryIds = ref<string[]>([]);
const galleryImages = computed(() => globalPreviewRecords?.value || []);
const gallerySearchKeyword = ref('');
const filteredGalleryImages = computed(() => {
  const keyword = gallerySearchKeyword.value.toLowerCase().trim();
  if (!keyword) return galleryImages.value;
  return galleryImages.value.filter(img => {
    const nameMatch = img.name?.toLowerCase().includes(keyword);
    const tagMatch = Array.isArray(img.tags) && img.tags.some((tag: string) => tag.toLowerCase().includes(keyword));
    return nameMatch || tagMatch;
  });
});
const getGalleryImgSrc = (img: any) => img.dataURL || img.sourceUrl || '';

const refreshGallery = async () => {
  try {
    const data = await api.getGallery();
    if (updateGlobalPreviewRecords) {
      updateGlobalPreviewRecords(data.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      })));
    }
  } catch (error) {
    console.error('刷新图库数据失败:', error);
  }
};

const handleGalleryImgError = (e: Event) => {
  const img = e.target as HTMLImageElement;
  img.style.display = 'none';
  img.parentElement?.querySelector('.img-placeholder')?.classList.add('show');
};

const toggleGallerySelect = (id: string) => {
  if (selectedGalleryIds.value.includes(id)) {
    selectedGalleryIds.value = [];
  } else {
    selectedGalleryIds.value = [id];
  }
};

const importFromGallery = () => {
  const selectedImages = galleryImages.value.filter(img => selectedGalleryIds.value.includes(img.id));
  if (selectedImages.length === 0) {
    return;
  }

  if (selectedImages.length === 1) {
    const dataURL = getGalleryImgSrc(selectedImages[0]);
    if (dataURL) {
      const rows = currentGridConfig.value.rows;
      const cols = currentGridConfig.value.cols;
      if (rows > 0 && cols > 0) {
        let targetRow = 0;
        let targetCol = 0;
        if (currentGridIndex !== null) {
          targetRow = Math.floor(currentGridIndex / cols);
          targetCol = currentGridIndex % cols;
        }
        drawImageToCellCanvas(targetRow, targetCol, dataURL);
        currentGridIndex = null;
      }
      if (showToast) {
        showToast(`已导入图片到画布`, 'success');
      }
    }
  } else {
    const rows = currentGridConfig.value.rows;
    const cols = currentGridConfig.value.cols;
    let cellIndex = 0;
    const totalCells = rows * cols;

    selectedImages.forEach((img) => {
      if (cellIndex >= totalCells) return;
      const row = Math.floor(cellIndex / cols);
      const col = cellIndex % cols;
      const dataURL = getGalleryImgSrc(img);
      if (dataURL) {
        drawImageToCellCanvas(row, col, dataURL);
      }
      cellIndex++;
    });

    if (showToast) {
      showToast(`已导入 ${Math.min(selectedImages.length, totalCells)} 张图片到宫格`, 'success');
    }
  }

  showGalleryModal.value = false;
  selectedGalleryIds.value = [];
};

// 初始化画布
const initCanvas = () => {
  // 如果画布已经初始化，就不再重复初始化
  if (isCanvasInitialized) {
    return;
  }

  try {
    isCanvasInitialized = true;
  } catch (error) {
    console.error('初始化画布失败:', error);
  }
};

// 绘制图片到宫格canvas
const drawImageToCellCanvas = (row: number, col: number, dataURL: string) => {
  // 使用CanvasContainer组件的drawImageToCell方法
  if (canvasContainerRef.value) {
    canvasContainerRef.value.drawImageToCell(row, col, dataURL);
  } else {
    console.error('CanvasContainer组件未初始化');
    // 降级处理：直接操作DOM
    const gridCanvasContainer = document.querySelector('.grid-canvas-container');
    if (!gridCanvasContainer) {
      console.error('未找到 gridCanvasContainer 元素');
      return;
    }
    
    // 获取对应的宫格canvas
    const cellCanvas = gridCanvasContainer.querySelector(`#cell-canvas-${row}-${col}`) as HTMLCanvasElement;
    if (!cellCanvas) {
      console.error(`未找到对应的宫格canvas: cell-canvas-${row}-${col}`);
      return;
    }
    
    // 创建图片对象
    const imgElement = new Image();
    imgElement.onload = function() {
      const ctx = cellCanvas.getContext('2d');
      if (!ctx) {
        console.error('无法获取canvas上下文');
        return;
      }

      ctx.clearRect(0, 0, cellCanvas.width, cellCanvas.height);

      const imgWidth = imgElement.width;
      const imgHeight = imgElement.height;
      const scale = Math.max(cellCanvas.width / imgWidth, cellCanvas.height / imgHeight);

      const drawWidth = imgWidth * scale;
      const drawHeight = imgHeight * scale;
      const offsetX = (cellCanvas.width - drawWidth) / 2;
      const offsetY = (cellCanvas.height - drawHeight) / 2;

      ctx.drawImage(imgElement, offsetX, offsetY, drawWidth, drawHeight);
    };
    
    imgElement.onerror = function(err) {
      console.error('HTML图片元素加载失败:', err);
    };
    
    imgElement.src = dataURL;
  }
};

// 绘制网格 - 调用 CanvasContainer 组件中的宫格系统
const drawGrid = () => {
};

// 选择模板
const selectTemplate = (template: any) => {
  selectedTemplate.value = template.id;
  canvasWidth.value = template.width;
  canvasHeight.value = template.height;
  gridGap.value = template.grid.gap;
  gridMargin.value = template.grid.margin;
  currentGridConfig.value = {
    rows: template.grid.rows,
    cols: template.grid.cols,
    gap: template.grid.gap,
    margin: template.grid.margin
  };
  resetCanvasSizeAndGrid();
  if (showToast) {
    showToast(`已切换到${template.name}模板`, 'success');
  }
};

const updateGridConfig = (config: any) => {
  currentGridConfig.value = {
    rows: config.rows,
    cols: config.cols,
    gap: config.gap,
    margin: config.margin || currentGridConfig.value.margin
  };
  gridGap.value = config.gap;
  if (canvasContainerRef.value?.updateGridConfig) {
    canvasContainerRef.value.updateGridConfig(currentGridConfig.value);
  }
  if (showToast) {
    showToast(`宫格已调整为 ${config.rows}×${config.cols}`, 'success');
  }
};

// 选择画布分辨率
const selectResolution = (resolution: any) => {
  selectedResolution.value = resolution.id;
  canvasWidth.value = resolution.width;
  canvasHeight.value = resolution.height;
  // 重置画布尺寸和网格，确保canvasElement的尺寸已经更新
  resetCanvasSizeAndGrid();
  if (showToast) {
    showToast(`分辨率已设置为 ${resolution.width}×${resolution.height}`, 'success');
  }
};

// 重置画布尺寸和网格
const resetCanvasSizeAndGrid = () => {
  if (!canvasElement) return;
  
  // 更新canvasElement的尺寸
  canvasElement.width = canvasWidth.value;
  canvasElement.height = canvasHeight.value;

  // 重新绘制网格
  if (showGrid.value) {
    drawGrid();
  }
};

// 处理文件上传
const handleFileUpload = (event: Event) => {
  try {
    let files: FileList | null = null;

    if (event.target && (event.target as HTMLInputElement).files) {
      const input = event.target as HTMLInputElement;
      files = input.files;
    } else {
      return;
    }

    if (!files || files.length === 0) {
      return;
    }
    
    // 获取当前选中的模板
    const template = templates.find(t => t.id === selectedTemplate.value);
    if (!template) {
      console.error('未找到选中的模板');
      if (showToast) {
        showToast('未找到选中的模板，请先选择模板', 'warning');
      }
      return;
    }

    const { rows, cols } = template.grid;

    const totalCells = rows * cols;

    // 限制文件数量
    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

    const inputId = (event.target as HTMLInputElement).id;

    // 检查是否有有效的图片文件
    if (validFiles.length === 0) {
      if (showToast) {
        showToast('请选择图片文件', 'warning');
      }
      if (inputId === 'grid-file-input') {
        currentGridIndex = null; // 重置当前宫格索引
      }
      return;
    }
    
    // 检查是否是分宫格上传（通过input id判断）
    if (inputId === 'grid-file-input' && currentGridIndex !== null) {
      const file = validFiles[0];

      const row = Math.floor(currentGridIndex / cols);
      const col = currentGridIndex % cols;

      const fileInput = document.getElementById('grid-file-input') as HTMLInputElement;

      const reader = new FileReader();
      reader.onload = function(e) {
        const dataURL = e.target?.result as string;

        uploadedImage.value = dataURL;
        imageInfo.value = {
          name: file.name,
          type: file.type,
          size: file.size
        };

        drawImageToCellCanvas(row, col, dataURL);

        currentGridIndex = null;

        if (fileInput) {
          fileInput.value = '';
        }
      };
      
      reader.onerror = function(err) {
        console.error('文件读取失败:', err);
        currentGridIndex = null; // 重置当前宫格索引
        
        // 清除input的value，以便下次选择同一个文件时能触发change事件
        if (fileInput) {
          fileInput.value = '';
        }
      };
      
      reader.readAsDataURL(file);
    } else if (inputId === 'basicFileInput') {
      const processFiles = validFiles.slice(0, totalCells);

      if (processFiles.length === 0) {
        if (showToast) {
          showToast('请选择图片文件', 'warning');
        }
        return;
      }

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cellCanvas = document.getElementById(`cell-canvas-${row}-${col}`) as HTMLCanvasElement;
          if (cellCanvas) {
            const ctx = cellCanvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, cellCanvas.width, cellCanvas.height);
              ctx.fillStyle = 'rgba(245, 245, 245, 0.6)';
              ctx.fillRect(0, 0, cellCanvas.width, cellCanvas.height);
              ctx.fillStyle = '#666666';
              ctx.font = '14px Arial';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('点击上传图片', cellCanvas.width / 2, cellCanvas.height / 2);
            }
          }
        }
      }
      
      // 处理每个文件，每个宫格放一张图片
      processFiles.forEach((file, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;

        const reader = new FileReader();
        reader.onload = function(e) {
          const dataURL = e.target?.result as string;

          if (index === 0) {
            uploadedImage.value = dataURL;
            imageInfo.value = {
              name: file.name,
              type: file.type,
              size: file.size
            };
          }

          drawImageToCellCanvas(row, col, dataURL);
        };
        
        reader.onerror = function(err) {
          console.error('文件读取失败:', err);
        };
        
        reader.readAsDataURL(file);
      });
    } else {
      return;
    }

  } catch (error) {
    console.error('处理文件上传时出错:', error);
    if (showToast) {
      showToast('处理文件上传时出错，请重试', 'error');
    }
  }
};

// 处理画布初始化
const handleCanvasInitialized = (canvas: HTMLCanvasElement) => {
  // 保存新的画布实例引用
  canvasElement = canvas;

  canvasElement.width = canvasWidth.value;
  canvasElement.height = canvasHeight.value;

  if (showGrid.value) {
    drawGrid();
  }
};

// 处理宫格点击事件
const handleGridCellClick = async (row: number, col: number) => {
  currentGridIndex = row * currentGridConfig.value.cols + col;
  // 打开图库弹窗前先刷新数据并清空搜索
  gallerySearchKeyword.value = '';
  await refreshGallery();
  showGalleryModal.value = true;
};

// 更新画布背景色
const updateCanvasBackground = (color: string) => {
  canvasBackgroundColor.value = color;
  // 背景色更新由CanvasContainer组件处理
  // 重新绘制网格以确保视觉一致性
  if (showGrid.value) {
    drawGrid();
  }
};

// 切换网格显示/隐藏
const toggleGrid = (show: boolean) => {
  showGrid.value = show;
  
  // 获取画布容器
  const canvasContainer = document.querySelector('.canvas-container');
  if (!canvasContainer) return;
  
  // 清除所有旧的宫格canvas元素
  const oldCanvases = canvasContainer.querySelectorAll('canvas[id^="cell-canvas-"]');
  oldCanvases.forEach(canvas => canvas.remove());
  
  // 绘制网格线和宫格容器（如果需要）
  if (show) {
    drawGrid();
  }
};



// 导出画布
const exportCanvas = (format: 'jpg' | 'png', quality: 'original' | 'standard') => {
  // 获取CanvasContainer组件的DOM元素
  const canvasContainer = document.querySelector('.canvas-container');
  if (!canvasContainer) return;
  
  // 获取主canvas元素
  const mainCanvas = canvasContainer.querySelector('canvas');
  if (!mainCanvas) return;

  try {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = mainCanvas.width;
    tempCanvas.height = mainCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) throw new Error('无法获取临时画布上下文');
    
    // 2. 复制主canvas的背景色
    tempCtx.fillStyle = canvasBackgroundColor.value;
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // 3. 获取CanvasContainer组件实例，以便访问cellImages数组
    // 注意：这里需要确保canvasContainerRef已经正确引用了CanvasContainer组件
    if (canvasContainerRef.value) {
      // 计算宫格尺寸，用于确定每个宫格的位置
      const gridConfig = currentGridConfig.value;
      const rows = gridConfig.rows;
      const cols = gridConfig.cols;
      const totalGapWidth = (cols - 1) * gridGap.value;
      const totalGapHeight = (rows - 1) * gridGap.value;
      const availableWidth = mainCanvas.width - 2 * gridMargin.value;
      const availableHeight = mainCanvas.height - 2 * gridMargin.value;
      const cellWidth = (availableWidth - totalGapWidth) / cols;
      const cellHeight = (availableHeight - totalGapHeight) / rows;
      
      // 4. 遍历所有宫格，只绘制有图片的宫格
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          // 检查宫格中是否有图片
          // 注意：这里假设cellImages数组是CanvasContainer组件的一个属性
          // 实际实现中，可能需要通过事件或props将cellImages传递给父组件
          // 由于当前无法直接访问CanvasContainer组件的cellImages数组
          // 我们采用另一种方法：直接绘制宫格canvas，但确保只绘制有图片的宫格
          const cellCanvas = document.getElementById(`cell-canvas-${row}-${col}`) as HTMLCanvasElement;
          if (cellCanvas) {
            // 获取宫格canvas的位置
            const x = gridMargin.value + col * cellWidth + col * gridGap.value;
            const y = gridMargin.value + row * cellHeight + row * gridGap.value;
            
            // 绘制宫格canvas到临时画布
            tempCtx.drawImage(cellCanvas, x, y, cellWidth, cellHeight);
          }
        }
      }
    }
    
    // 5. 导出画布内容
    const qualityValue = quality === 'original' ? 1.0 : 0.7;
    const dataURL = tempCanvas.toDataURL(`image/${format}`, qualityValue);
    
    // 6. 转换为Blob并下载
    fetch(dataURL)
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `puzzle-${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error('下载文件时出错:', error);
        if (showToast) {
          showToast('下载文件时出错，请重试', 'error');
        }
      });
    
  } catch (error) {
    console.error('导出画布时出错:', error);
    if (showToast) {
      showToast('导出画布时出错，请重试', 'error');
    }
  }
};

// 更新宫格线粗细
const updateGridLineWidth = (width: number) => {
  gridLineWidth.value = width;
  if (canvasElement && showGrid.value) {
    drawGrid();
  }
};

// 更新宫格间距
const updateGridGap = (gap: number) => {
  gridGap.value = gap;
  if (canvasElement && showGrid.value) {
    drawGrid();
  }
};

// 更新边缘间距
const updateGridMargin = (margin: number) => {
  gridMargin.value = margin;
  if (canvasElement && showGrid.value) {
    drawGrid();
  }
};

// 右键菜单功能函数 - 暂时简化实现
const bringToFront = () => {
  // 纯Canvas API实现需要重新设计
  showContextMenu.value = false;
};

const sendToBack = () => {
  // 纯Canvas API实现需要重新设计
  showContextMenu.value = false;
};

const deleteImage = () => {
  // 纯Canvas API实现需要重新设计
  showContextMenu.value = false;
};

// 关闭右键菜单
const closeContextMenu = () => {
  showContextMenu.value = false;
};

// 生命周期钩子
onMounted(() => {
  // 初始化画布
  if (canvasElement) {
    initCanvas();
  }
  
  // 添加全局点击监听，点击其他地方关闭右键菜单
  document.addEventListener('click', closeContextMenu);
  
  // 禁用浏览器默认右键菜单
  document.addEventListener('contextmenu', (e) => {
    // 只在画布上禁用默认右键菜单
    if (e.target && (e.target as HTMLElement).tagName === 'CANVAS') {
      e.preventDefault();
    }
  });
});

// 组件卸载时清理事件监听器
onUnmounted(() => {
  document.removeEventListener('click', closeContextMenu);
});
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 快速操作按钮区域 */
.quick-actions-bar {
  margin-top: 10px;
}

/* 右键菜单样式 */
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  font-size: 14px;
  min-width: 120px;
  overflow: hidden;
  user-select: none;
}

.menu-item {
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #333;
}

.menu-item:hover {
  background: #f0f0f0;
}

.menu-item:active {
  transform: translateY(1px);
}

.menu-divider {
  height: 1px;
  background: #eee;
  margin: 2px 0;
}

.delete-item {
  color: #ff4d4f;
}

.delete-item:hover {
  background: #fff2f0;
  color: #ff7875;
}

/* 图库选择弹窗样式 */
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

.gallery-select-modal {
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

.gallery-search {
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}

.gallery-search-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.gallery-search-input:focus {
  outline: none;
  border-color: #3366ff;
  box-shadow: 0 0 0 3px rgba(51, 102, 255, 0.1);
}

.gallery-search-input::placeholder {
  color: #bbb;
}

.gallery-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  min-height: 300px;
}

.empty-gallery {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.gallery-item {
  position: relative;
  border: 2px solid #eee;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  min-height: 160px;
  height: 160px;
}

.gallery-item:hover {
  border-color: #3366ff;
}

.gallery-item.selected {
  border-color: #3366ff;
  background: #f0f5ff;
}

.gallery-item input[type="checkbox"] {
  position: absolute;
  top: 4px;
  left: 4px;
  z-index: 2;
  width: 16px;
  height: 16px;
}

.gallery-item .img-preview {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.gallery-item .img-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-item .img-placeholder {
  display: none;
  color: #ccc;
  font-size: 12px;
  text-align: center;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
}

.gallery-item .img-placeholder.show {
  display: flex;
}

.gallery-item .img-tags {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
  max-width: 80%;
  justify-content: flex-end;
}

.gallery-item .img-tag {
  background: rgba(51, 102, 255, 0.85);
  color: white;
  font-size: 9px;
  padding: 2px 4px;
  border-radius: 3px;
  max-width: 50px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gallery-item .img-info {
  padding: 6px 8px;
  background: white;
  border-top: 1px solid #eee;
  flex-shrink: 0;
  width: 100%;
}

.gallery-item .img-name {
  display: block;
  font-size: 12px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gallery-item .img-name.unnamed {
  color: #999;
  font-style: italic;
}

.gallery-item .img-info-tags {
  display: flex;
  gap: 4px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.gallery-item .img-info-tag {
  font-size: 10px;
  padding: 1px 4px;
  background: #f0f0f0;
  color: #666;
  border-radius: 3px;
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 20px;
  border-top: 1px solid #eee;
  background: #fafafa;
  border-radius: 0 0 8px 8px;
}

.select-count {
  margin-right: auto;
  color: #666;
  font-size: 13px;
}

.modal-footer button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f0f0f0;
  color: #666;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-confirm {
  background: #3366ff;
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  background: #254edb;
}

.btn-confirm:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 弹窗过渡效果 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-scale-enter-active {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.modal-scale-leave-active {
  transition: all 0.2s ease;
}

.modal-scale-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.modal-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.gallery-fade-enter-active,
.gallery-fade-leave-active {
  transition: all 0.3s ease;
}

.gallery-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.gallery-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
