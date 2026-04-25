<template>
  <div class="canvas-container" ref="canvasContainer">
    <!-- 画布头部 -->
    <div class="canvas-header">
      <span>画布操作</span>
    </div>
    
    <!-- 画布设置 -->
    <div class="canvas-settings">
      <label>背景色:</label>
      <input
        type="color"
        :value="props.canvasBackgroundColor"
        @change="updateBackgroundColor"
      />
      <label>
        <input
          type="checkbox"
          :checked="props.showGrid"
          @change="toggleGrid"
        />
        显示网格
      </label>
      <label>
        <input
          type="checkbox"
          :checked="noGap"
          @change="toggleNoGap"
        />
        无间距
      </label>
      <label>
        宫位线粗细:
        <input
          type="range"
          :value="gridLineWidth"
          @input="updateGridLineWidth"
          min="0.5"
          max="5"
          step="0.5"
        />
        <span>{{ gridLineWidth }}px</span>
      </label>
      <label>
        宫格间距:
        <input
          type="range"
          :value="gridGap"
          @input="updateGridGap"
          min="0"
          max="50"
          step="5"
          :disabled="noGap"
        />
        <span>{{ gridGap }}px</span>
      </label>
      <label>
        边缘间距:
        <input
          type="range"
          :value="gridMargin"
          @input="updateGridMargin"
          min="0"
          max="100"
          step="5"
          :disabled="noGap"
        />
        <span>{{ gridMargin }}px</span>
      </label>
    </div>
    
    <!-- 主Canvas元素作为背景 -->
    <canvas
      ref="canvas"
      :width="props.canvasWidth"
      :height="props.canvasHeight"
      style="position: relative; z-index: 1;"
    ></canvas>
    
    <!-- 宫格容器，用于放置独立的宫格Canvas -->
    <div class="grid-canvas-container" ref="gridCanvasContainer" style="position: absolute; top: 0; left: 0; z-index: 2;"></div>
    
    <!-- 导出预览 -->
    <div class="export-preview">
      <div class="export-preview-header">
        <h4>导出预览</h4>
        <div class="export-actions">
          <select class="export-select" @change="handleExportFormatChange">
            <option value="jpg-original">JPG原图</option>
            <option value="png-original">PNG原图</option>
            <option value="jpg-standard">JPG标清</option>
            <option value="png-standard">PNG标清</option>
          </select>
          <button
            class="export-btn icon-only"
            @click="triggerExport"
            title="导出图片"
          >
            ↓
          </button>
        </div>
        <button
          class="generate-preview-btn"
          @click="generateExportPreview"
        >
          生成预览
        </button>
      </div>
      <!-- 隐藏导出预览canvas，直接生成预览记录 -->
      <canvas ref="exportPreviewCanvas" class="export-preview-canvas" style="display: none;"></canvas>
    </div>
    
    <!-- 预览记录 -->
    <div class="preview-records" v-if="previewRecords.length > 0">
      <div class="preview-records-header">
        <h4>预览记录</h4>
      </div>
      <div class="preview-records-list">
        <div class="preview-record-item" v-for="(record, index) in previewRecords" :key="record.id">
          <div class="preview-record-info">
            <span class="preview-record-id">图{{ index + 1 }}</span>
            <span class="preview-record-time">{{ record.timestamp.toLocaleString() }}</span>
          </div>
          <canvas 
            class="preview-record-canvas" 
            :width="100" 
            :height="(100 * props.canvasHeight) / props.canvasWidth"
            :data-record-id="record.id"
          ></canvas>
          <button 
            class="download-btn" 
            @click="downloadImage(record.dataURL, `${record.id}.jpg`)"
          >
            下载原图
          </button>
        </div>
      </div>
    </div>
    
    <!-- 画布底部 -->
    <div class="canvas-footer">
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import { useGridConfig } from '../composables/useGridConfig';
import { useImageProcessor, type ImageState } from '../composables/useImageProcessor';
import { usePreviewRecords, type PreviewRecord as PreviewRecordType } from '../composables/usePreviewRecords';
import { generateUniqueId } from '../utils';

const {
  gridLineWidth,
  gridGap,
  gridMargin,
  noGap,
  updateGridLineWidth: updateComposedGridLineWidth,
  updateGridGap: updateComposedGridGap,
  updateGridMargin: updateComposedGridMargin
} = useGridConfig();

const {
  cellImages,
  loadImageAsDataURL: loadComposedImageAsDataURL,
  setImageState: setComposedImageState,
  clearImageState: clearComposedImageState
} = useImageProcessor();

const {
  previewRecords,
  addPreviewRecord: addComposedPreviewRecord
} = usePreviewRecords();

const downloadImage = (dataURL: string, filename: string) => {
  const link = document.createElement('a')
  link.href = dataURL
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 组件属性
const props = defineProps<{
  canvasWidth: number;
  canvasHeight: number;
  canvasBackgroundColor: string;
  showGrid: boolean;
  uploadedImage: string;
  imageInfo: {
    name: string;
    type: string;
    size: number;
  };
  gridConfig: {
    rows: number;
    cols: number;
  };
}>();

// 组件事件
const emit = defineEmits<{
  (e: 'updateBackgroundColor', color: string): void;
  (e: 'toggleGrid', show: boolean): void;
  (e: 'canvasInitialized', canvas: any): void;
  (e: 'updateGridLineWidth', width: number): void;
  (e: 'updateGridGap', gap: number): void;
  (e: 'updateGridMargin', margin: number): void;
  (e: 'gridCellClick', row: number, col: number): void;
  (e: 'drawImageToCell', row: number, col: number, dataURL: string): void;
  (e: 'export', format: 'jpg' | 'png', quality: 'original' | 'standard'): void;
}>();

// 响应式数据
const canvas = ref<HTMLCanvasElement>();
const canvasContainer = ref<HTMLDivElement>();
const gridCanvasContainer = ref<HTMLDivElement>();
const exportPreviewCanvas = ref<HTMLCanvasElement>();

// 导出相关
const pendingExportFormat = ref('');

const handleExportFormatChange = (e: Event) => {
  const target = e.target as HTMLSelectElement;
  pendingExportFormat.value = target.value;
  if (target.value) {
    const [format, quality] = target.value.split('-');
    emit('export', format as 'jpg' | 'png', quality as 'original' | 'standard');
    target.value = '';
  }
};

const triggerExport = () => {
  const format = pendingExportFormat.value || 'jpg-original';
  const [fmt, quality] = format.split('-');
  emit('export', fmt as 'jpg' | 'png', quality as 'original' | 'standard');
};

// 画布上下文
let ctx: CanvasRenderingContext2D | null = null;

// 宫格配置
let gridConfig = {
  rows: props.gridConfig.rows,
  cols: props.gridConfig.cols
};

// 监听 canvasWidth 和 canvasHeight 变化
watch([() => props.canvasWidth, () => props.canvasHeight], () => {
  nextTick(() => {
    initCanvas();
  });
});

// 监听 gridConfig 变化
watch(() => props.gridConfig, (newConfig) => {
  gridConfig.rows = newConfig.rows;
  gridConfig.cols = newConfig.cols;
  if ('gap' in newConfig) {
    gridGap.value = (newConfig as any).gap;
  }
  if (props.showGrid) {
    drawGridSystem();
  }
}, { deep: true });

// 宫格canvas数组
const cellCanvases: HTMLCanvasElement[][] = [];

// 初始化画布
const initCanvas = async () => {
  if (!canvas.value || !canvasContainer.value || !gridCanvasContainer.value) {
    console.error('canvas元素或容器不存在');
    return;
  }

  // 保存当前的cellImages数据
  const savedCellImages = cellImages.value.map(row => [...row]);

  try {
    // 1. 设置canvas元素的实际像素尺寸
    canvas.value.width = props.canvasWidth;
    canvas.value.height = props.canvasHeight;

    // 2. 设置canvas元素的CSS尺寸
    canvas.value.style.width = `${props.canvasWidth}px`;
    canvas.value.style.height = `${props.canvasHeight}px`;

    // 3. 获取画布上下文
    ctx = canvas.value.getContext('2d');
    if (!ctx) {
      throw new Error('无法获取画布上下文');
    }

    // 4. 设置gridCanvasContainer的尺寸和位置
    gridCanvasContainer.value.style.width = `${props.canvasWidth}px`;
    gridCanvasContainer.value.style.height = `${props.canvasHeight}px`;
    gridCanvasContainer.value.style.position = 'absolute';
    gridCanvasContainer.value.style.top = `${canvas.value.offsetTop}px`;
    gridCanvasContainer.value.style.left = `${canvas.value.offsetLeft}px`;

    // 5. 绘制画布背景
    drawCanvasBackground();

    // 6. 恢复cellImages数据
    if (savedCellImages.length > 0) {
      cellImages.value = savedCellImages;
    }

    // 7. 绘制宫格系统（会使用恢复的cellImages数据）
    if (props.showGrid) {
      drawGridSystem();
    }

    // 8. 触发画布初始化事件
    emit('canvasInitialized', { canvas: canvas.value, ctx });
    
  } catch (error) {
    console.error('初始化画布失败:', error);
  }
};

// 绘制画布背景
const drawCanvasBackground = () => {
  if (!ctx) return;
  
  ctx.fillStyle = props.canvasBackgroundColor;
  ctx.fillRect(0, 0, props.canvasWidth, props.canvasHeight);
};

// 删除宫格中的图片
const deleteCellImage = (row: number, col: number) => {
  clearComposedImageState(row, col);
  drawGridSystem();
};

// 绘制宫格系统
const drawGridSystem = () => {
  if (!ctx || !gridCanvasContainer.value) return;
  
  // 清除旧的宫格canvas和删除按钮
  gridCanvasContainer.value.innerHTML = '';
  cellCanvases.length = 0;
  
  // 使用props中的gridConfig
  const rows = props.gridConfig.rows;
  const cols = props.gridConfig.cols;
  
  // 计算宫格尺寸
  const totalGapWidth = (cols - 1) * gridGap.value;
  const totalGapHeight = (rows - 1) * gridGap.value;
  const availableWidth = props.canvasWidth - 2 * gridMargin.value;
  const availableHeight = props.canvasHeight - 2 * gridMargin.value;
  const cellWidth = (availableWidth - totalGapWidth) / cols;
  const cellHeight = (availableHeight - totalGapHeight) / rows;
  
  // 确保cellImages数组大小正确
  while (cellImages.value.length < rows) {
    cellImages.value.push([]);
  }
  
  // 绘制宫格边框和创建宫格canvas
  for (let row = 0; row < rows; row++) {
    cellCanvases[row] = [];
    
    while (cellImages.value[row].length < cols) {
      cellImages.value[row].push(null);
    }
    
    for (let col = 0; col < cols; col++) {
      // 计算宫格位置
      const x = gridMargin.value + col * cellWidth + col * gridGap.value;
      const y = gridMargin.value + row * cellHeight + row * gridGap.value;
      
      // 不再绘制宫格边框到主画布，改为通过CSS悬停效果显示
      
      // 创建宫格容器，用于放置canvas和删除按钮
      const cellContainer = document.createElement('div');
      cellContainer.style.position = 'absolute';
      cellContainer.style.left = `${x}px`;
      cellContainer.style.top = `${y}px`;
      cellContainer.style.width = `${cellWidth}px`;
      cellContainer.style.height = `${cellHeight}px`;
      cellContainer.style.zIndex = '3';
      cellContainer.style.border = `${gridLineWidth.value}px dashed #666`;
      cellContainer.style.boxSizing = 'border-box';
      cellContainer.style.transition = 'border-color 0.2s ease';
      
      // 创建宫格canvas
      const cellCanvas = document.createElement('canvas');
      cellCanvas.id = `cell-canvas-${row}-${col}`;
      cellCanvas.width = cellWidth;
      cellCanvas.height = cellHeight;
      cellCanvas.style.width = `${cellWidth}px`;
      cellCanvas.style.height = `${cellHeight}px`;
      cellCanvas.style.border = 'none';
      cellCanvas.style.outline = 'none';
      cellCanvas.style.cursor = 'pointer';
      cellCanvas.style.position = 'absolute';
      cellCanvas.style.left = '0';
      cellCanvas.style.top = '0';
      
      // 在canvas上绘制上传提示文字或已保存的图片
      const cellCtx = cellCanvas.getContext('2d');
      if (cellCtx) {
        const savedImage = cellImages.value[row][col];
        if (savedImage) {
          // 有保存的图片，绘制图片
          drawImageWithState(row, col, savedImage);
        } else {
          // 没有保存的图片，初始状态不绘制上传提示文字，只在悬停时显示
          cellCtx.clearRect(0, 0, cellWidth, cellHeight);
        }
      }
      
      // 添加图片交互功能
      if (cellImages.value[row][col]) {
        // 创建编辑容器，用于放置编辑点
        const editContainer = document.createElement('div');
        editContainer.className = 'edit-container';
        editContainer.style.position = 'absolute';
        editContainer.style.left = '0';
        editContainer.style.top = '0';
        editContainer.style.width = '100%';
        editContainer.style.height = '100%';
        editContainer.style.pointerEvents = 'none';
        
        // 保存当前的row和col，用于后续更新编辑点位置
        const currentRow = row;
        const currentCol = col;
        
        // 创建一个函数来更新编辑点位置
        const updateControlPoints = () => {
          const imageState = cellImages.value[currentRow][currentCol];
          if (!imageState) return;
          
          // 获取canvas元素
          const cellCanvas = cellCanvases[currentRow][currentCol];
          if (!cellCanvas) return;
          
          // 直接使用imageState中保存的图片尺寸
          const imgWidth = imageState.width;
          const imgHeight = imageState.height;
          const drawWidth = imgWidth * imageState.scale;
          const drawHeight = imgHeight * imageState.scale;
          const centerX = cellCanvas.width / 2;
          const centerY = cellCanvas.height / 2;
          
          // 计算四个角点的位置
          const corners = [
            { x: -drawWidth / 2 + imageState.x, y: -drawHeight / 2 + imageState.y }, // 左上角
            { x: drawWidth / 2 + imageState.x, y: -drawHeight / 2 + imageState.y }, // 右上角
            { x: drawWidth / 2 + imageState.x, y: drawHeight / 2 + imageState.y }, // 右下角
            { x: -drawWidth / 2 + imageState.x, y: drawHeight / 2 + imageState.y } // 左下角
          ];
          
          // 应用旋转变换
          const rotation = imageState.rotation * Math.PI / 180;
          const rotatedCorners = corners.map(corner => {
            const rotatedX = corner.x * Math.cos(rotation) - corner.y * Math.sin(rotation);
            const rotatedY = corner.x * Math.sin(rotation) + corner.y * Math.cos(rotation);
            return {
              x: rotatedX + centerX,
              y: rotatedY + centerY
            };
          });
          
          // 更新缩放控制点位置
          const cornerPoints = editContainer.querySelectorAll('.corner-point');
          cornerPoints.forEach((point, index) => {
            if (rotatedCorners[index]) {
              const cp = point as HTMLElement;
              cp.style.left = `${rotatedCorners[index].x - 5}px`;
              cp.style.top = `${rotatedCorners[index].y - 5}px`;
            }
          });
          
          // 更新旋转控制点位置
          const rotatePoint = editContainer.querySelector('.rotate-point') as HTMLElement;
          if (rotatePoint) {
            const topCorner = rotatedCorners[0];
            // 计算旋转控制点位置，位于图片顶部上方20px
            const dx = topCorner.x - centerX;
            const dy = topCorner.y - centerY;
            const length = Math.sqrt(dx * dx + dy * dy);
            const unitX = dx / length;
            const unitY = dy / length;
            const rotateX = centerX + unitX * (length + 20);
            const rotateY = centerY + unitY * (length + 20);
            rotatePoint.style.left = `${rotateX - 5}px`;
            rotatePoint.style.top = `${rotateY - 5}px`;
          }
        };
        
        // 创建四个角的缩放控制点
        const cornerPoints = [
          { cursor: 'nwse-resize' }, // 左上角
          { cursor: 'nesw-resize' }, // 右上角
          { cursor: 'nwse-resize' }, // 右下角
          { cursor: 'nesw-resize' } // 左下角
        ];
        
        cornerPoints.forEach((pointInfo, index) => {
          const controlPoint = document.createElement('div');
          controlPoint.className = 'control-point corner-point';
          controlPoint.style.position = 'absolute';
          controlPoint.style.width = '10px';
          controlPoint.style.height = '10px';
          controlPoint.style.backgroundColor = '#3366ff';
          controlPoint.style.border = '2px solid white';
          controlPoint.style.borderRadius = '50%';
          controlPoint.style.cursor = pointInfo.cursor;
          controlPoint.style.zIndex = '5';
          controlPoint.style.pointerEvents = 'auto';
          controlPoint.style.boxShadow = '0 0 0 1px rgba(0, 0, 0, 0.2)';
          
          // 添加缩放功能
          let isResizing = false;
          let startX = 0;
          let startY = 0;
          let startScale = 1;
          
          controlPoint.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isResizing = true;
            const rect = cellContainer.getBoundingClientRect();
            startX = e.clientX - rect.left;
            startY = e.clientY - rect.top;
            const imageState = cellImages.value[currentRow][currentCol];
            if (imageState) {
              startScale = imageState.scale;
            }
          });
          
          document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const rect = cellContainer.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;
            
            // 计算缩放比例
            const deltaX = Math.abs(currentX - cellCanvas.width / 2);
            const deltaY = Math.abs(currentY - cellCanvas.height / 2);
            const newScale = Math.max(0.1, Math.min(5, (deltaX + deltaY) / (cellCanvas.width + cellCanvas.height) * 4 * startScale));
            
            // 更新图片缩放
            const imageState = cellImages.value[currentRow][currentCol];
            if (imageState) {
              imageState.scale = newScale;
              
              // 重新绘制图片
              drawImageWithState(currentRow, currentCol, imageState);
              
              // 更新所有编辑点位置
              updateControlPoints();
            }
          });
          
          document.addEventListener('mouseup', () => {
            isResizing = false;
          });
          
          editContainer.appendChild(controlPoint);
        });
        
        // 创建旋转控制点
        const rotatePoint = document.createElement('div');
        rotatePoint.className = 'control-point rotate-point';
        rotatePoint.style.position = 'absolute';
        rotatePoint.style.width = '10px';
        rotatePoint.style.height = '10px';
        rotatePoint.style.backgroundColor = '#3366ff';
        rotatePoint.style.border = '2px solid white';
        rotatePoint.style.borderRadius = '50%';
        rotatePoint.style.cursor = 'grabbing';
        rotatePoint.style.zIndex = '5';
        rotatePoint.style.pointerEvents = 'auto';
        rotatePoint.style.boxShadow = '0 0 0 1px rgba(0, 0, 0, 0.2)';
        
        // 添加旋转功能
        let isRotating = false;
        let startAngle = 0;
        
        rotatePoint.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          isRotating = true;
          const rect = cellContainer.getBoundingClientRect();
          const centerX = rect.left + cellCanvas.width / 2;
          const centerY = rect.top + cellCanvas.height / 2;
          const mouseX = e.clientX;
          const mouseY = e.clientY;
          startAngle = Math.atan2(mouseY - centerY, mouseX - centerX);
        });
        
        document.addEventListener('mousemove', (e) => {
          if (!isRotating) return;
          
          const rect = cellContainer.getBoundingClientRect();
          const centerX = rect.left + cellCanvas.width / 2;
          const centerY = rect.top + cellCanvas.height / 2;
          const mouseX = e.clientX;
          const mouseY = e.clientY;
          const currentAngle = Math.atan2(mouseY - centerY, mouseX - centerX);
          
          // 计算旋转角度差
          const deltaAngle = currentAngle - startAngle;
          const deltaDegrees = deltaAngle * (180 / Math.PI);
          
          // 更新图片旋转
          const imageState = cellImages.value[currentRow][currentCol];
          if (imageState) {
            imageState.rotation = (imageState.rotation + deltaDegrees) % 360;
            
            // 重新绘制图片
            drawImageWithState(currentRow, currentCol, imageState);
            
            // 更新所有编辑点位置
            updateControlPoints();
          }
        });
        
        document.addEventListener('mouseup', () => {
          isRotating = false;
        });
        
        editContainer.appendChild(rotatePoint);
        
        // 拖动功能
        let isDragging = false;
        let lastX = 0;
        let lastY = 0;
        
        cellCanvas.addEventListener('mousedown', (e) => {
          isDragging = true;
          const rect = cellCanvas.getBoundingClientRect();
          lastX = e.clientX - rect.left;
          lastY = e.clientY - rect.top;
          cellCanvas.style.cursor = 'grabbing';
        });
        
        cellCanvas.addEventListener('mousemove', (e) => {
          if (!isDragging) return;
          
          const rect = cellCanvas.getBoundingClientRect();
          const currentX = e.clientX - rect.left;
          const currentY = e.clientY - rect.top;
          
          // 计算位移
          const deltaX = currentX - lastX;
          const deltaY = currentY - lastY;
          
          // 更新图片位置
          const imageState = cellImages.value[row][col];
          if (imageState) {
            imageState.x += deltaX;
            imageState.y += deltaY;
            
            // 重新绘制图片
            drawImageWithState(row, col, imageState);
            
            // 更新所有编辑点位置
            updateControlPoints();
            
            // 更新lastX和lastY
            lastX = currentX;
            lastY = currentY;
          }
        });
        
        cellCanvas.addEventListener('mouseup', () => {
          isDragging = false;
          cellCanvas.style.cursor = 'grab';
        });
        
        cellCanvas.addEventListener('mouseleave', () => {
          isDragging = false;
          cellCanvas.style.cursor = 'pointer';
        });
        
        // 滚轮缩放功能
        cellCanvas.addEventListener('wheel', (e) => {
          e.preventDefault();
          
          const imageState = cellImages.value[row][col];
          if (!imageState) return;
          
          // 计算缩放比例
          const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
          const newScale = Math.max(0.1, Math.min(5, imageState.scale * scaleFactor));
          
          // 更新图片缩放
          imageState.scale = newScale;
          
          // 重新绘制图片
          drawImageWithState(row, col, imageState);
          
          // 更新所有编辑点位置
          updateControlPoints();
        });
        
        // 右键旋转功能
        cellCanvas.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          
          const imageState = cellImages.value[row][col];
          if (!imageState) return;
          
          // 更新图片旋转
          imageState.rotation = (imageState.rotation + 90) % 360;
          
          // 重新绘制图片
          drawImageWithState(row, col, imageState);
          
          // 更新所有编辑点位置
          updateControlPoints();
        });
        
        // 添加到容器
        cellContainer.appendChild(editContainer);
        
        // 初始更新编辑点位置
        updateControlPoints();
      }
      
      // 为所有宫格添加点击事件，但是只有没有图片时才触发上传
      // 使用立即执行函数创建闭包，保存当前的row和col值
      (function(currentRow, currentCol) {
        cellCanvas.addEventListener('click', (e) => {
          // 如果点击的是删除按钮，不触发图库导入
          if ((e.target as HTMLElement).closest('.delete-btn')) {
            return;
          }
          // 点击宫格时，打开图库导入弹窗
          handleCellClick(currentRow, currentCol);
        });
      })(row, col);
      
      // 添加悬停效果
      cellContainer.addEventListener('mouseover', () => {
        // 显示宫格边框
        cellContainer.style.border = `${gridLineWidth.value}px solid #666666`;
        
        if (!cellImages.value[row][col]) {
          // 没有图片时，显示上传提示悬停效果
          const cellCtx = cellCanvas.getContext('2d');
          if (cellCtx) {
            // 绘制悬停背景
            cellCtx.fillStyle = 'rgba(220, 230, 255, 0.8)';
            cellCtx.fillRect(0, 0, cellWidth, cellHeight);
            
            // 绘制悬停文字
            cellCtx.fillStyle = '#3366ff';
            cellCtx.font = '14px Arial';
            cellCtx.textAlign = 'center';
            cellCtx.textBaseline = 'middle';
            cellCtx.fillText('点击上传图片', cellWidth / 2, cellHeight / 2);
          }
        } else {
          // 有图片时，显示删除按钮
          const deleteBtn = cellContainer.querySelector('.delete-btn') as HTMLElement;
          if (deleteBtn) {
            deleteBtn.style.display = 'block';
          }
        }
      });
      
      cellContainer.addEventListener('mouseout', () => {
        // 隐藏宫格边框
        cellContainer.style.border = 'none';
        
        if (!cellImages.value[row][col]) {
          // 没有图片时，清除上传提示
          const cellCtx = cellCanvas.getContext('2d');
          if (cellCtx) {
            // 清除canvas
            cellCtx.clearRect(0, 0, cellWidth, cellHeight);
          }
        } else {
          // 有图片时，隐藏删除按钮
          const deleteBtn = cellContainer.querySelector('.delete-btn') as HTMLElement;
          if (deleteBtn) {
            deleteBtn.style.display = 'none';
          }
        }
      });
      
      // 创建删除按钮
      const deleteBtn = document.createElement('div');
      deleteBtn.className = 'delete-btn';
      deleteBtn.innerHTML = '×';
      deleteBtn.style.position = 'absolute';
      deleteBtn.style.top = '5px';
      deleteBtn.style.right = '5px';
      deleteBtn.style.width = '20px';
      deleteBtn.style.height = '20px';
      deleteBtn.style.background = 'rgba(255, 0, 0, 0.8)';
      deleteBtn.style.color = 'white';
      deleteBtn.style.borderRadius = '50%';
      deleteBtn.style.display = 'none';
      deleteBtn.style.cursor = 'pointer';
      deleteBtn.style.zIndex = '4';
      deleteBtn.style.textAlign = 'center';
      deleteBtn.style.lineHeight = '20px';
      deleteBtn.style.fontSize = '16px';
      deleteBtn.style.fontWeight = 'bold';
      deleteBtn.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
      
      // 使用立即执行函数创建闭包，保存当前的row和col值
      (function(currentRow, currentCol) {
        // 添加删除按钮的点击事件
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation(); // 阻止事件冒泡，避免触发上传
          deleteCellImage(currentRow, currentCol);
        });
      })(row, col);
      
      // 如果有图片，添加编辑控制点
      if (cellImages.value[row][col]) {
        // 创建编辑容器，用于放置编辑点
        const editContainer = document.createElement('div');
        editContainer.className = 'edit-container';
        editContainer.style.position = 'absolute';
        editContainer.style.left = '0';
        editContainer.style.top = '0';
        editContainer.style.width = '100%';
        editContainer.style.height = '100%';
        editContainer.style.pointerEvents = 'none';
        
        // 保存当前的row和col，用于后续更新编辑点位置
        const currentRow = row;
        const currentCol = col;
        
        // 创建一个函数来更新编辑点位置
        const updateControlPoints = () => {
          const imageState = cellImages.value[currentRow][currentCol];
          if (!imageState) return;
          
          // 获取canvas元素
          const cellCanvas = cellCanvases[currentRow][currentCol];
          if (!cellCanvas) return;
          
          // 直接使用imageState中保存的图片尺寸
          const imgWidth = imageState.width;
          const imgHeight = imageState.height;
          const drawWidth = imgWidth * imageState.scale;
          const drawHeight = imgHeight * imageState.scale;
          const centerX = cellCanvas.width / 2;
          const centerY = cellCanvas.height / 2;
          
          // 计算四个角点的位置
          const corners = [
            { x: -drawWidth / 2 + imageState.x, y: -drawHeight / 2 + imageState.y }, // 左上角
            { x: drawWidth / 2 + imageState.x, y: -drawHeight / 2 + imageState.y }, // 右上角
            { x: drawWidth / 2 + imageState.x, y: drawHeight / 2 + imageState.y }, // 右下角
            { x: -drawWidth / 2 + imageState.x, y: drawHeight / 2 + imageState.y } // 左下角
          ];
          
          // 应用旋转变换
          const rotation = imageState.rotation * Math.PI / 180;
          const rotatedCorners = corners.map(corner => {
            const rotatedX = corner.x * Math.cos(rotation) - corner.y * Math.sin(rotation);
            const rotatedY = corner.x * Math.sin(rotation) + corner.y * Math.cos(rotation);
            return {
              x: rotatedX + centerX,
              y: rotatedY + centerY
            };
          });
          
          // 更新缩放控制点位置
          const cornerPoints = editContainer.querySelectorAll('.corner-point');
          cornerPoints.forEach((point, index) => {
            if (rotatedCorners[index]) {
              const cp = point as HTMLElement;
              cp.style.left = `${rotatedCorners[index].x - 5}px`;
              cp.style.top = `${rotatedCorners[index].y - 5}px`;
            }
          });
          
          // 更新旋转控制点位置
          const rotatePoint = editContainer.querySelector('.rotate-point') as HTMLElement;
          if (rotatePoint) {
            const topCorner = rotatedCorners[0];
            // 计算旋转控制点位置，位于图片顶部上方20px
            const dx = topCorner.x - centerX;
            const dy = topCorner.y - centerY;
            const length = Math.sqrt(dx * dx + dy * dy);
            const unitX = dx / length;
            const unitY = dy / length;
            const rotateX = centerX + unitX * (length + 20);
            const rotateY = centerY + unitY * (length + 20);
            rotatePoint.style.left = `${rotateX - 5}px`;
            rotatePoint.style.top = `${rotateY - 5}px`;
          }
        };
        
        // 创建四个角的缩放控制点
        const cornerPoints = [
          { cursor: 'nwse-resize' }, // 左上角
          { cursor: 'nesw-resize' }, // 右上角
          { cursor: 'nwse-resize' }, // 右下角
          { cursor: 'nesw-resize' } // 左下角
        ];
        
        cornerPoints.forEach((pointInfo, index) => {
          const controlPoint = document.createElement('div');
          controlPoint.className = 'control-point corner-point';
          controlPoint.style.position = 'absolute';
          controlPoint.style.width = '10px';
          controlPoint.style.height = '10px';
          controlPoint.style.backgroundColor = '#3366ff';
          controlPoint.style.border = '2px solid white';
          controlPoint.style.borderRadius = '50%';
          controlPoint.style.cursor = pointInfo.cursor;
          controlPoint.style.zIndex = '5';
          controlPoint.style.pointerEvents = 'auto';
          controlPoint.style.boxShadow = '0 0 0 1px rgba(0, 0, 0, 0.2)';
          
          // 添加缩放功能
          let isResizing = false;
          let startX = 0;
          let startY = 0;
          let startScale = 1;
          
          controlPoint.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isResizing = true;
            const rect = cellContainer.getBoundingClientRect();
            startX = e.clientX - rect.left;
            startY = e.clientY - rect.top;
            const imageState = cellImages.value[currentRow][currentCol];
            if (imageState) {
              startScale = imageState.scale;
            }
          });
          
          document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const rect = cellContainer.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;
            
            // 计算缩放比例
            const deltaX = Math.abs(currentX - cellCanvas.width / 2);
            const deltaY = Math.abs(currentY - cellCanvas.height / 2);
            const newScale = Math.max(0.1, Math.min(5, (deltaX + deltaY) / (cellCanvas.width + cellCanvas.height) * 4 * startScale));
            
            // 更新图片缩放
            const imageState = cellImages.value[currentRow][currentCol];
            if (imageState) {
              imageState.scale = newScale;
              
              // 重新绘制图片
              drawImageWithState(currentRow, currentCol, imageState);
              
              // 更新所有编辑点位置
              updateControlPoints();
            }
          });
          
          document.addEventListener('mouseup', () => {
            isResizing = false;
          });
          
          editContainer.appendChild(controlPoint);
        });
        
        // 创建旋转控制点
        const rotatePoint = document.createElement('div');
        rotatePoint.className = 'control-point rotate-point';
        rotatePoint.style.position = 'absolute';
        rotatePoint.style.width = '10px';
        rotatePoint.style.height = '10px';
        rotatePoint.style.backgroundColor = '#3366ff';
        rotatePoint.style.border = '2px solid white';
        rotatePoint.style.borderRadius = '50%';
        rotatePoint.style.cursor = 'grabbing';
        rotatePoint.style.zIndex = '5';
        rotatePoint.style.pointerEvents = 'auto';
        rotatePoint.style.boxShadow = '0 0 0 1px rgba(0, 0, 0, 0.2)';
        
        // 添加旋转功能
        let isRotating = false;
        let startAngle = 0;
        
        rotatePoint.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          isRotating = true;
          const rect = cellContainer.getBoundingClientRect();
          const centerX = rect.left + cellCanvas.width / 2;
          const centerY = rect.top + cellCanvas.height / 2;
          const mouseX = e.clientX;
          const mouseY = e.clientY;
          startAngle = Math.atan2(mouseY - centerY, mouseX - centerX);
        });
        
        document.addEventListener('mousemove', (e) => {
          if (!isRotating) return;
          
          const rect = cellContainer.getBoundingClientRect();
          const centerX = rect.left + cellCanvas.width / 2;
          const centerY = rect.top + cellCanvas.height / 2;
          const mouseX = e.clientX;
          const mouseY = e.clientY;
          const currentAngle = Math.atan2(mouseY - centerY, mouseX - centerX);
          
          // 计算旋转角度差
          const deltaAngle = currentAngle - startAngle;
          const deltaDegrees = deltaAngle * (180 / Math.PI);
          
          // 更新图片旋转
          const imageState = cellImages.value[currentRow][currentCol];
          if (imageState) {
            imageState.rotation = (imageState.rotation + deltaDegrees) % 360;
            
            // 重新绘制图片
            drawImageWithState(currentRow, currentCol, imageState);
            
            // 更新所有编辑点位置
            updateControlPoints();
          }
        });
        
        document.addEventListener('mouseup', () => {
          isRotating = false;
        });
        
        editContainer.appendChild(rotatePoint);
        
        // 添加到容器
        cellContainer.appendChild(editContainer);
        
        // 初始更新编辑点位置
        updateControlPoints();
      }
      
      // 添加到容器
      cellContainer.appendChild(cellCanvas);
      cellContainer.appendChild(deleteBtn);
      
      // 添加到gridCanvasContainer和数组
      gridCanvasContainer.value.appendChild(cellContainer);
      cellCanvases[row][col] = cellCanvas;
    }
  }
};

// 处理宫格点击
const handleCellClick = (row: number, col: number) => {
  // 触发gridCellClick事件，由父组件处理文件选择
  emit('gridCellClick', row, col);
};

// 绘制图片到宫格canvas
const drawImageToCell = async (row: number, col: number, dataURL: string) => {
  const cleanDataURL = await loadComposedImageAsDataURL(dataURL);

  // 如果图片无法访问（返回空字符串），则不导入
  if (!cleanDataURL) {
    console.warn('图片无法访问，跳过导入');
    return;
  }

  // 加载图片获取原始尺寸
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    // 计算宫格尺寸，用于确定图片的初始缩放比例
    const rows = props.gridConfig.rows;
    const cols = props.gridConfig.cols;
    const totalGapWidth = (cols - 1) * gridGap.value;
    const totalGapHeight = (rows - 1) * gridGap.value;
    const availableWidth = props.canvasWidth - 2 * gridMargin.value;
    const availableHeight = props.canvasHeight - 2 * gridMargin.value;
    const cellWidth = (availableWidth - totalGapWidth) / cols;
    const cellHeight = (availableHeight - totalGapHeight) / rows;

    // 计算初始缩放比例，确保图片完全显示在宫格内，不会超出
    const imgWidth = img.width;
    const imgHeight = img.height;

    // 计算缩放比例，确保图片完全显示在宫格内，不会超出
    // 使用Math.min确保图片的宽和高都不会超过宫格的宽和高
    const scaleFactor = Math.min(cellWidth / imgWidth, cellHeight / imgHeight);

    // 限制最小缩放比例，确保图片不会太小
    // 这里设置最小缩放比例为0.8，确保图片有合适的大小
    const initialScale = Math.max(0.8, scaleFactor);

    // 获取当前宫格的图片状态，如果存在则保持原有状态，只更新dataURL和尺寸
    const currentState = cellImages.value[row]?.[col];
    const imageState = {
      dataURL: cleanDataURL,
      x: currentState ? currentState.x : 0,
      y: currentState ? currentState.y : 0,
      scale: currentState ? currentState.scale : initialScale,
      rotation: currentState ? currentState.rotation : 0,
      width: img.width,
      height: img.height
    };

    setComposedImageState(row, col, imageState);

    // 重新绘制宫格系统，确保图片正确显示，并且上传提示文字被隐藏
    drawGridSystem();

    // 滚动到画布容器顶部，确保图片可见
    nextTick(() => {
      if (gridCanvasContainer.value) {
        gridCanvasContainer.value.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  };
  img.src = cleanDataURL;
};

// 根据图片状态绘制图片
const drawImageWithState = (row: number, col: number, imageState: ImageState) => {
  const cellCanvas = cellCanvases[row]?.[col];
  if (!cellCanvas) return;
  
  const cellCtx = cellCanvas.getContext('2d');
  if (!cellCtx) return;
  
  // 创建图片对象
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    // 清除canvas
    cellCtx.clearRect(0, 0, cellCanvas.width, cellCanvas.height);

    // 直接使用imageState中保存的图片尺寸
    const drawWidth = imageState.width * imageState.scale;
    const drawHeight = imageState.height * imageState.scale;

    // 计算居中位置
    const centerX = cellCanvas.width / 2;
    const centerY = cellCanvas.height / 2;

    // 保存当前上下文状态
    cellCtx.save();

    // 移动到画布中心
    cellCtx.translate(centerX, centerY);

    // 应用旋转
    cellCtx.rotate(imageState.rotation * Math.PI / 180);

    // 绘制图片，以中心为原点
    cellCtx.drawImage(
      img,
      -drawWidth / 2 + imageState.x,
      -drawHeight / 2 + imageState.y,
      drawWidth,
      drawHeight
    );

    // 恢复上下文状态
    cellCtx.restore();
  };
  img.src = imageState.dataURL;
};

// 外部调用的绘制图片方法
defineExpose({
  drawImageToCell,
  get previewRecords() {
    return previewRecords.value;
  }
});

// 更新背景色
const updateBackgroundColor = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('updateBackgroundColor', target.value);
};

// 切换网格显示
const toggleGrid = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('toggleGrid', target.checked);
};

// 更新宫格线粗细
const updateGridLineWidth = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const width = parseFloat(target.value);
  gridLineWidth.value = width;
  emit('updateGridLineWidth', width);
  
  // 重新绘制宫格
  if (props.showGrid) {
    drawCanvasBackground();
    drawGridSystem();
  }
};

// 更新宫格间距
const updateGridGap = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const gap = parseFloat(target.value);
  gridGap.value = gap;
  emit('updateGridGap', gap);
  
  // 重新绘制宫格
  if (props.showGrid) {
    drawCanvasBackground();
    drawGridSystem();
  }
};

// 更新边缘间距
const updateGridMargin = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const margin = parseFloat(target.value);
  gridMargin.value = margin;
  emit('updateGridMargin', margin);
  
  // 重新绘制宫格
  if (props.showGrid) {
    drawCanvasBackground();
    drawGridSystem();
  }
};

// 切换无间距状态
const toggleNoGap = () => {
  noGap.value = !noGap.value;
  if (noGap.value) {
    // 选中无间距时，设置宫格间距和边缘间距为0
    gridGap.value = 0;
    gridMargin.value = 0;
  } else {
    // 取消选中时，恢复默认间距值（20px）
    gridGap.value = 20;
    gridMargin.value = 20;
  }
  // 触发事件通知父组件
  emit('updateGridGap', gridGap.value);
  emit('updateGridMargin', gridMargin.value);
  
  // 重新绘制宫格
  if (props.showGrid) {
    drawCanvasBackground();
    drawGridSystem();
  }
};

// 生成导出预览
const generateExportPreview = async () => {
  if (!exportPreviewCanvas.value || !ctx) return;
  
  const previewCtx = exportPreviewCanvas.value.getContext('2d');
  if (!previewCtx) return;
  
  // 设置预览画布尺寸
  const previewWidth = 200;
  const previewHeight = (props.canvasHeight / props.canvasWidth) * previewWidth;
  
  exportPreviewCanvas.value.width = previewWidth;
  exportPreviewCanvas.value.height = previewHeight;
  
  // 清除预览画布
  previewCtx.clearRect(0, 0, previewWidth, previewHeight);
  
  try {
    // 1. 创建临时HTML5画布，用于生成纯净预览
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = props.canvasWidth;
    tempCanvas.height = props.canvasHeight;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) {
      throw new Error('无法获取临时画布上下文');
    }
    
    // 2. 绘制背景色
    tempCtx.fillStyle = props.canvasBackgroundColor;
    tempCtx.fillRect(0, 0, props.canvasWidth, props.canvasHeight);
    
    // 3. 计算宫格尺寸
    const rows = props.gridConfig.rows;
    const cols = props.gridConfig.cols;
    const totalGapWidth = (cols - 1) * gridGap.value;
    const totalGapHeight = (rows - 1) * gridGap.value;
    const availableWidth = props.canvasWidth - 2 * gridMargin.value;
    const availableHeight = props.canvasHeight - 2 * gridMargin.value;
    const cellWidth = (availableWidth - totalGapWidth) / cols;
    const cellHeight = (availableHeight - totalGapHeight) / rows;
    
    // 4. 同步绘制所有宫格图片
    // 使用Promise.all确保所有图片加载完成后再生成预览
    const drawPromises: Promise<void>[] = [];
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = gridMargin.value + col * cellWidth + col * gridGap.value;
        const y = gridMargin.value + row * cellHeight + row * gridGap.value;
        
        const savedImage = cellImages.value[row][col];
        if (savedImage) {
          const drawPromise = new Promise<void>((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              // 保存当前上下文状态
              tempCtx.save();

              // 1. 创建宫格裁剪路径，确保图片只在宫格内显示
              tempCtx.beginPath();
              tempCtx.rect(x, y, cellWidth, cellHeight);
              tempCtx.clip();

              // 2. 移动到宫格中心
              tempCtx.translate(x + cellWidth / 2, y + cellHeight / 2);

              // 3. 应用旋转
              tempCtx.rotate(savedImage.rotation * Math.PI / 180);

              // 4. 计算绘制尺寸
              const drawWidth = savedImage.width * savedImage.scale;
              const drawHeight = savedImage.height * savedImage.scale;

              // 5. 绘制图片
              tempCtx.drawImage(
                img,
                -drawWidth / 2 + savedImage.x,
                -drawHeight / 2 + savedImage.y,
                drawWidth,
                drawHeight
              );

              // 6. 恢复上下文状态
              tempCtx.restore();
              resolve();
            };
            img.onerror = () => {
              console.warn(`图片加载失败，跳过该图片: ${savedImage.dataURL}`);
              resolve();
            };
            img.src = savedImage.dataURL;
          });

          drawPromises.push(drawPromise);
        }
      }
    }
    
    // 5. 等待所有图片绘制完成
    await Promise.all(drawPromises);
    
    // 6. 绘制到隐藏的预览画布（保持兼容）
    previewCtx.drawImage(tempCanvas, 0, 0, previewWidth, previewHeight);
    
    // 7. 生成完整尺寸的预览数据URL
    const fullSizeDataURL = tempCanvas.toDataURL('image/jpeg', 1.0);
    
    // 8. 创建预览记录
    const newRecord: PreviewRecordType = {
      id: generateUniqueId(),
      dataURL: fullSizeDataURL,
      timestamp: new Date()
    };
    
    // 9. 添加到预览记录列表
    previewRecords.value.unshift(newRecord);
    
  } catch (error) {
    console.error('生成导出预览失败:', error);
  }
};

// 监听背景色变化
watch(() => props.canvasBackgroundColor, (newColor) => {
  drawCanvasBackground();
  
  // 重新绘制宫格
  if (props.showGrid) {
    drawGridSystem();
  }
});

// 监听网格显示变化
watch(() => props.showGrid, (show) => {
  if (show) {
    drawGridSystem();
  } else {
    // 清除宫格canvas
    if (gridCanvasContainer.value) {
      gridCanvasContainer.value.innerHTML = '';
      cellCanvases.length = 0;
    }
    drawCanvasBackground();
  }
});

// 监听预览记录变化，绘制缩略图
watch(previewRecords, async (newRecords) => {
  if (newRecords.length > 0) {
    // 等待DOM更新后再绘制缩略图
    await nextTick();
    
    // 获取最新添加的记录
    const latestRecord = newRecords[0];
    
    // 找到对应的canvas元素
    const canvasElements = document.querySelectorAll(`canvas[data-record-id="${latestRecord.id}"]`);
    if (canvasElements.length > 0) {
      const canvas = canvasElements[0] as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // 加载图片并绘制到canvas
        const img = new Image();
        img.onload = () => {
          // 清除canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // 绘制图片到缩略图canvas
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = latestRecord.dataURL;
      }
    }
  }
}, { deep: true });

// 生命周期钩子
onMounted(() => {
  initCanvas();
  nextTick(() => {
    if (props.showGrid) {
      drawGridSystem();
    }
  });
});
</script>

<style scoped>
.canvas-container {
  border: 1px solid #e8e8e8;
  background: white;
  margin: 0 auto 12px;
  overflow: auto;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  display: block;
  width: 100%;
  text-align: center;
  max-width: 100%;
  max-height: none;
  height: auto;
  position: relative;
}

canvas {
  display: block;
  background: white;
  margin: 6px auto;
  vertical-align: middle;
  position: relative;
  left: 0;
  top: 0;
  border: 1px solid #ddd;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.05);
  background-color: #ffffff;
}

.canvas-header {
  padding: 6px 10px;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
  font-size: 12px;
  font-weight: 500;
  color: #666;
}

/* 画布设置 */
.canvas-settings {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding: 8px 10px;
  background: #fafafa;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
  flex-wrap: wrap;
}

.canvas-settings label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}

.canvas-settings input[type="color"] {
  width: 28px;
  height: 22px;
  border: 1px solid #e0e0e0;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.canvas-settings input[type="color"]:hover {
  border-color: #3366ff;
  box-shadow: 0 0 0 1px rgba(51, 102, 255, 0.1);
}

.canvas-settings input[type="range"] {
  width: 60px;
  margin: 0 3px;
}

.canvas-settings input[type="checkbox"] {
  cursor: pointer;
}

/* 画布底部 */
.canvas-footer {
  padding: 6px 10px;
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
  font-size: 11px;
  color: #999;
  text-align: center;
  border-radius: 0 0 4px 4px;
}

/* 导出预览样式 */
.export-preview {
  padding: 10px;
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
  border-radius: 0 0 4px 4px;
  margin-top: 8px;
}

.export-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  flex-wrap: wrap;
  gap: 8px;
}

.export-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.export-btn {
  padding: 5px 10px;
  background: #3366ff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 3px;
}

.export-btn:hover {
  background: #254edb;
  transform: translateY(-1px);
}

.export-btn.icon-only {
  width: 28px;
  height: 28px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: normal;
  color: #666;
  background: transparent;
  border: 1px solid #ddd;
}

.export-btn.icon-only:hover {
  background: #f0f0f0;
  color: #333;
}

.export-select {
  padding: 5px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 11px;
  background: white;
  color: #333;
  cursor: pointer;
  min-width: 100px;
}

.export-select:focus {
  outline: none;
  border-color: #3366ff;
}

.export-preview h4 {
  margin: 0;
  color: #333;
  font-size: 12px;
  font-weight: 500;
}

.generate-preview-btn {
  padding: 4px 10px;
  background: #3366ff;
  color: white;
  border: none;
  border-radius: 3px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.generate-preview-btn:hover {
  background: #254edb;
  box-shadow: 0 1px 3px rgba(51, 102, 255, 0.2);
}

.generate-preview-btn:active {
  transform: translateY(1px);
}

.export-preview-canvas {
  border: 1px solid #e0e0e0;
  border-radius: 3px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  background: white;
  display: block;
  margin: 0 auto;
}

/* 图片预览 */
.image-preview {
  padding: 10px;
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
  border-radius: 0 0 4px 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .canvas-settings {
    flex-direction: column;
    align-items: stretch;
  }
  
  .canvas-settings label {
    justify-content: space-between;
  }
  
  .canvas-settings input[type="range"] {
    width: 100px;
  }
}

.image-preview h4 {
  margin-top: 0;
  margin-bottom: 6px;
  color: #333;
}

.image-preview img {
  margin-bottom: 6px;
  border: 1px solid #e0e0e0;
  border-radius: 3px;
}

.image-preview p {
  margin: 3px 0;
  font-size: 12px;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .canvas-settings {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* 预览记录样式 */
.preview-records {
  padding: 10px;
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
  border-radius: 0 0 4px 4px;
  margin-top: 8px;
}

.preview-records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.preview-records-header h4 {
  margin: 0;
  color: #333;
  font-size: 12px;
  font-weight: 500;
}

.preview-records-list {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 6px;
  flex-wrap: nowrap;
  scrollbar-width: thin;
  scrollbar-color: #ccc transparent;
}

.preview-records-list::-webkit-scrollbar {
  height: 4px;
}

.preview-records-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.preview-records-list::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 2px;
}

.preview-records-list::-webkit-scrollbar-thumb:hover {
  background: #999;
}

.preview-record-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  min-width: 140px;
}

.preview-record-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 6px;
  width: 100%;
}

.preview-record-id {
  font-size: 11px;
  color: #666;
  margin-bottom: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  text-align: center;
}

.preview-record-time {
  font-size: 10px;
  color: #999;
}

.preview-record-canvas {
  border: 1px solid #e0e0e0;
  border-radius: 3px;
  background: white;
  margin-bottom: 6px;
  display: block;
}

.download-btn {
  padding: 4px 10px;
  background: #3366ff;
  color: white;
  border: none;
  border-radius: 3px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
}

.download-btn:hover {
  background: #254edb;
  box-shadow: 0 1px 3px rgba(51, 102, 255, 0.2);
}

.download-btn:active {
  transform: translateY(1px);
}
</style>