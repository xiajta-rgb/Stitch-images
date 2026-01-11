<template>
  <div class="app-container">
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
    
    <!-- 核心功能区 -->
    <div class="main-content">
      <!-- 左侧：图片拼图模块 -->
      <div class="puzzle-module">
        <h2>图片拼图</h2>
        
        <!-- 头部操作区域 -->
        <div class="puzzle-header">
          <!-- 模板选择 -->
          <TemplateSelector 
            :templates="templates"
            :selectedTemplate="selectedTemplate"
            @select="selectTemplate"
          />
          
          <!-- 画布分辨率选择 -->
          <div class="canvas-resolution">
            <label>画布分辨率:</label>
            <select 
              v-model="selectedResolution"
              @change="selectResolution"
            >
              <option 
                v-for="res in resolutions" 
                :key="res.id" 
                :value="res.id"
              >
                {{ res.name }}
              </option>
            </select>
          </div>
          
          <!-- 快速操作按钮 -->
          <QuickActions 
            @fileUpload="handleFileUpload"
            @resetCanvas="resetCanvas"
          />
        </div>
        
        <!-- 画布容器 -->
        <CanvasContainer 
          ref="canvasContainerRef"
          :canvasWidth="canvasWidth"
          :canvasHeight="canvasHeight"
          :canvasBackgroundColor="canvasBackgroundColor"
          :showGrid="showGrid"
          :selectedObject="selectedObject"
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
        />
        
        <!-- 隐藏的文件输入元素，用于分宫格上传 -->
        <input 
          type="file" 
          id="grid-file-input" 
          accept="image/*" 
          style="display: none;"
          @change="handleFileUpload"
        />
        

        
        <!-- 导出按钮 -->
        <ExportButtons 
          @export="exportCanvas"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, inject, nextTick } from 'vue';

// 注入全局预览记录状态
const globalPreviewRecords = inject('previewRecords');
const updateGlobalPreviewRecords = inject('updatePreviewRecords');

// 导入组件
import TemplateSelector from '../components/TemplateSelector.vue';
import QuickActions from '../components/QuickActions.vue';
import CanvasContainer from '../components/CanvasContainer.vue';
import ExportButtons from '../components/ExportButtons.vue';

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
let selectedImage: any = null;

// CanvasContainer组件引用
const canvasContainerRef = ref<any>(null);

// 当前宫格配置
const currentGridConfig = ref({ rows: 3, cols: 1 });

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

// 初始化画布
const initCanvas = () => {
  // 如果画布已经初始化，就不再重复初始化
  if (isCanvasInitialized) {
    console.log('画布已经初始化，不再重复初始化');
    return;
  }
  
  console.log('开始初始化画布');
  console.log('画布宽度:', canvasWidth.value);
  console.log('画布高度:', canvasHeight.value);
  console.log('画布背景色:', canvasBackgroundColor.value);
  
  try {
    console.log('画布初始化完成');
    
    // 设置标志，确保initCanvas()函数只被调用一次
    isCanvasInitialized = true;
    console.log('画布初始化完成');
    
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
      console.log('HTML图片元素加载完成:', imgElement.width, 'x', imgElement.height);
      
      // 获取canvas上下文
      const ctx = cellCanvas.getContext('2d');
      if (!ctx) {
        console.error('无法获取canvas上下文');
        return;
      }
      
      // 清除canvas
      ctx.clearRect(0, 0, cellCanvas.width, cellCanvas.height);
      
      // 计算缩放比例，确保图片完全覆盖canvas
      const imgWidth = imgElement.width;
      const imgHeight = imgElement.height;
      const scale = Math.max(cellCanvas.width / imgWidth, cellCanvas.height / imgHeight);
      
      // 计算图片绘制位置，居中显示
      const drawWidth = imgWidth * scale;
      const drawHeight = imgHeight * scale;
      const offsetX = (cellCanvas.width - drawWidth) / 2;
      const offsetY = (cellCanvas.height - drawHeight) / 2;
      
      // 绘制图片，超出canvas的部分会自动被裁剪
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
  // 宫格系统现在由 CanvasContainer 组件负责绘制
  console.log('宫格系统由 CanvasContainer 组件负责绘制');
};

// 选择模板
const selectTemplate = (template: any) => {
  selectedTemplate.value = template.id;
  // 更新canvasWidth.value和canvasHeight.value为模板的width和height值，确保宫格系统正确显示
  canvasWidth.value = template.width;
  canvasHeight.value = template.height;
  // 更新gridGap.value为模板的gap值，确保宫格系统正确显示
  gridGap.value = template.grid.gap;
  // 更新currentGridConfig为模板的grid配置
  currentGridConfig.value = {
    rows: template.grid.rows,
    cols: template.grid.cols
  };
  // 重置画布尺寸和网格，确保canvasElement的尺寸已经更新
  resetCanvasSizeAndGrid();
};

// 选择画布分辨率
const selectResolution = () => {
  const resolution = resolutions.find(r => r.id === selectedResolution.value);
  if (resolution) {
    canvasWidth.value = resolution.width;
    canvasHeight.value = resolution.height;
    // 重置画布尺寸和网格，确保canvasElement的尺寸已经更新
    resetCanvasSizeAndGrid();
  }
};

// 重置画布尺寸和网格
const resetCanvasSizeAndGrid = () => {
  if (!canvasElement) return;
  
  console.log('重置画布尺寸和网格');
  console.log('当前canvasWidth.value:', canvasWidth.value);
  console.log('当前canvasHeight.value:', canvasHeight.value);
  console.log('当前canvasElement宽度:', canvasElement.width);
  console.log('当前canvasElement高度:', canvasElement.height);
  
  // 更新canvasElement的尺寸
  canvasElement.width = canvasWidth.value;
  canvasElement.height = canvasHeight.value;
  
  // 重新绘制网格
  if (showGrid.value) {
    console.log('重新绘制网格辅助线');
    drawGrid();
  }
};

// 处理文件上传
const handleFileUpload = (event: Event) => {
  console.log('=== 文件上传事件触发 ===');
  
  try {
    let files: FileList | null = null;
    
    // 检查事件是否来自文件输入元素
    if (event.target && (event.target as HTMLInputElement).files) {
      // 来自QuickActions组件或drawGrid函数中的隐藏input
      const input = event.target as HTMLInputElement;
      files = input.files;
      console.log('input元素:', input);
      console.log('files:', files);
      console.log('input id:', input.id);
    } else {
      // 可能是其他类型的事件，直接返回
      console.log('事件不是来自文件输入元素');
      return;
    }
    
    if (!files || files.length === 0) {
      console.log('未选择文件');
      return;
    }
    
    console.log('文件上传:', files.length, '个文件');
    
    // 获取当前选中的模板
    const template = templates.find(t => t.id === selectedTemplate.value);
    if (!template) {
      console.error('未找到选中的模板');
      alert('未找到选中的模板，请先选择模板');
      return;
    }
    
    console.log('当前选中的模板:', template);
    const { rows, cols, gap } = template.grid;
    console.log('模板宫格布局:', rows, '行', cols, '列');
    
    // 画布初始化由CanvasContainer组件处理，无需额外检查
    
    // 使用响应式状态中的画布尺寸，确保与drawGrid函数保持一致
    const localCanvasWidth = canvasWidth.value;
    const localCanvasHeight = canvasHeight.value;
    
    // 重新计算宫格尺寸，确保与drawGrid函数使用相同的逻辑
    // 使用动态的gridGap.value，而不是模板中的固定gap值
    const currentGap = gridGap.value;
    // 使用独立的边缘间距设置，与drawGrid函数保持一致
    const margin = gridMargin.value;
    const totalGapWidth = (cols - 1) * currentGap;
    const totalGapHeight = (rows - 1) * currentGap;
    
    // 计算实际可用空间（减去边缘间距）
    const availableWidth = localCanvasWidth - 2 * margin;
    const availableHeight = localCanvasHeight - 2 * margin;
    
    // 宫格宽度 = (可用宽度 - 总间距宽度) / 列数
    const cellWidth = (availableWidth - totalGapWidth) / cols;
    const cellHeight = (availableHeight - totalGapHeight) / rows;
    
    // 验证宫格系统总尺寸是否等于画布尺寸
    const gridTotalWidth = cols * cellWidth + (cols - 1) * gridGap.value;
    const gridTotalHeight = rows * cellHeight + (rows - 1) * gridGap.value;
    
    console.log('画布尺寸:', localCanvasWidth, 'x', localCanvasHeight);
    console.log('宫格系统总尺寸:', gridTotalWidth, 'x', gridTotalHeight);
    console.log('每个宫格尺寸:', cellWidth, 'x', cellHeight);
    console.log('间距:', gridGap.value);
    console.log('总间距:', totalGapWidth, 'x', totalGapHeight);
    console.log('宫格系统是否完全填充画布:', gridTotalWidth === localCanvasWidth && gridTotalHeight === localCanvasHeight);
    
    // 计算宫格数量
    const totalCells = rows * cols;
    console.log('总宫格数量:', totalCells);
    
    // 限制文件数量
    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    console.log('有效图片文件数量:', validFiles.length);
    
    // 获取事件目标元素的id，用于区分不同的文件输入源
    const inputId = (event.target as HTMLInputElement).id;
    console.log('输入源ID:', inputId);
    
    // 检查是否有有效的图片文件
    if (validFiles.length === 0) {
      console.log('没有有效的图片文件');
      alert('请选择图片文件');
      if (inputId === 'grid-file-input') {
        currentGridIndex = null; // 重置当前宫格索引
      }
      return;
    }
    
    // 检查是否是分宫格上传（通过input id判断）
    if (inputId === 'grid-file-input' && currentGridIndex !== null) {
      // 分宫格上传：只处理第一个选择的文件，上传到指定宫格
      console.log('分宫格上传，宫格索引:', currentGridIndex);
      
      const file = validFiles[0]; // 只处理第一个文件
      console.log('处理单个文件:', file.name, file.type, file.size);
      
      // 计算指定宫格的位置
      const row = Math.floor(currentGridIndex / cols);
      const col = currentGridIndex % cols;
      console.log('图片位置:', row, '行', col, '列');
      
      // 获取fileInput元素，以便清除value
      const fileInput = document.getElementById('grid-file-input') as HTMLInputElement;
      
      // 使用FileReader读取文件为DataURL
      const reader = new FileReader();
      reader.onload = function(e) {
        const dataURL = e.target?.result as string;
        console.log('文件读取为DataURL成功，长度:', dataURL.length);
        
        // 更新图片预览信息
        uploadedImage.value = dataURL;
        imageInfo.value = {
          name: file.name,
          type: file.type,
          size: file.size
        };
        
        // 直接绘制图片到指定宫格画布
        drawImageToCellCanvas(row, col, dataURL);
        
        // 重置当前宫格索引
        currentGridIndex = null;
        
        // 清除input的value，以便下次选择同一个文件时能触发change事件
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
      // 批量上传：处理所有选择的文件，每个宫格放一张图片
      const processFiles = validFiles.slice(0, totalCells);
      console.log('批量上传，有效图片文件数量:', processFiles.length);
      
      if (processFiles.length === 0) {
        console.log('没有有效的图片文件');
        alert('请选择图片文件');
        return;
      }
      
      // 清空画布中的所有图片（保留网格线和上传区域）
      console.log('清空画布中的所有图片');
      // 直接清除所有宫格画布的内容
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cellCanvas = document.getElementById(`cell-canvas-${row}-${col}`) as HTMLCanvasElement;
          if (cellCanvas) {
            const ctx = cellCanvas.getContext('2d');
            if (ctx) {
              // 清除画布内容
              ctx.clearRect(0, 0, cellCanvas.width, cellCanvas.height);
              // 重新绘制上传提示文字
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
        console.log('处理文件:', index + 1, file.name, file.type, file.size);
        
        // 计算图片在宫格中的位置，确保每个宫格只能放一张图片
        const row = Math.floor(index / cols);
        const col = index % cols;
        const gridIndex = row * cols + col;
        console.log('图片位置:', row, '行', col, '列', '宫格索引:', gridIndex);
        
        // 使用FileReader读取文件为DataURL
        const reader = new FileReader();
        reader.onload = function(e) {
          const dataURL = e.target?.result as string;
          console.log('文件读取为DataURL成功，长度:', dataURL.length);
          
          // 更新图片预览信息（只更新第一个图片）
          if (index === 0) {
            uploadedImage.value = dataURL;
            imageInfo.value = {
              name: file.name,
              type: file.type,
              size: file.size
            };
          }
          
          // 直接绘制图片到指定宫格画布
          drawImageToCellCanvas(row, col, dataURL);
        };
        
        reader.onerror = function(err) {
          console.error('文件读取失败:', err);
        };
        
        reader.readAsDataURL(file);
      });
    } else {
      console.log('既不是分宫格上传也不是批量上传，忽略');
      return;
    }
    
    console.log('文件上传处理完成');
    
  } catch (error) {
    console.error('处理文件上传时出错:', error);
    alert('处理文件上传时出错，请重试');
  }
};

// 重置画布
const resetCanvas = () => {
  console.log('重置画布');
  
  // 获取画布容器
  const canvasContainer = document.querySelector('.canvas-container');
  if (canvasContainer) {
    // 清除所有旧的宫格canvas元素
    const oldCanvases = canvasContainer.querySelectorAll('canvas[id^="cell-canvas-"]');
    oldCanvases.forEach(canvas => canvas.remove());
    
    // 重新绘制网格和上传区域
    if (showGrid.value) {
      drawGrid();
    }
    
    console.log('画布已重置，所有图片已清空');
  }
};

// 处理画布初始化
const handleCanvasInitialized = (canvas: HTMLCanvasElement) => {
  // 保存新的画布实例引用
  canvasElement = canvas;
  
  console.log('画布初始化事件触发，更新canvasElement引用');
  console.log('新画布实例:', canvasElement);
  console.log('当前canvasWidth.value:', canvasWidth.value);
  console.log('当前canvasHeight.value:', canvasHeight.value);
  
  // 确保新画布实例的尺寸与canvasWidth.value和canvasHeight.value一致
  canvasElement.width = canvasWidth.value;
  canvasElement.height = canvasHeight.value;
  
  // 重新绘制网格，确保宫格系统正确显示
  if (showGrid.value) {
    console.log('重新绘制网格辅助线');
    drawGrid();
  }
};

// 处理宫格点击事件
const handleGridCellClick = (row: number, col: number) => {
  console.log('宫格点击:', row, col);
  // 保存当前宫格索引
  currentGridIndex = row * currentGridConfig.value.cols + col;
  // 触发文件选择
  const fileInput = document.getElementById('grid-file-input') as HTMLInputElement;
  if (fileInput) {
    fileInput.click();
  }
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
  
  console.log('开始导出画布，格式:', format, '质量:', quality);
  
  try {
    // 1. 创建临时画布，用于生成导出内容
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
        console.log('画布导出完成，已下载');
      })
      .catch(error => {
        console.error('下载文件时出错:', error);
        alert('下载文件时出错，请重试');
      });
    
  } catch (error) {
    console.error('导出画布时出错:', error);
    alert('导出画布时出错，请重试');
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
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow: auto;
}

.puzzle-module {
  background: #ffffff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: auto;
  height: auto;
  max-height: none;
  border: 1px solid #e0e0e0;
}

/* 头部区域 - 包含模板选择、分辨率和快速操作 */
.puzzle-header {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

/* 画布分辨率选择样式 */
.canvas-resolution {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 0;
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.canvas-resolution label {
  font-weight: 500;
  color: #666;
  font-size: 14px;
}

.canvas-resolution select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;
  min-width: 150px;
}

.canvas-resolution select:hover {
  border-color: #3366ff;
}

.canvas-resolution select:focus {
  border-color: #3366ff;
  box-shadow: 0 0 0 2px rgba(51, 102, 255, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .puzzle-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .canvas-resolution {
    justify-content: space-between;
  }
  
  .canvas-resolution select {
    min-width: auto;
  }
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
</style>
