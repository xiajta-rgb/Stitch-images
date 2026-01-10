<template>
  <div class="app-container">
    <h1>AIpic - 自媒体图片笔记工具</h1>
    
    <!-- 核心功能区 -->
    <div class="main-content">
      <!-- 左侧：图片拼图模块 -->
      <div class="puzzle-module">
        <h2>图片拼图</h2>
        
        <!-- 模板选择 -->
        <TemplateSelector 
          :templates="templates"
          :selectedTemplate="selectedTemplate"
          @select="selectTemplate"
        />
        
        <!-- 快速操作按钮 -->
        <QuickActions 
          @fileUpload="handleFileUpload"
          @resetCanvas="resetCanvas"
        />
        
        <!-- 画布容器 -->
        <CanvasContainer 
          :canvasWidth="canvasWidth"
          :canvasHeight="canvasHeight"
          :canvasBackgroundColor="canvasBackgroundColor"
          :showGrid="showGrid"
          :selectedObject="selectedObject"
          :uploadedImage="uploadedImage"
          :imageInfo="imageInfo"
          @updateBackgroundColor="updateCanvasBackground"
          @toggleGrid="toggleGrid"
          @canvasInitialized="handleCanvasInitialized"
        />
        
        <!-- 图层操作 -->
        <LayerOperations 
          :hasSelectedObject="!!selectedObject"
          @bringForward="bringForward"
          @sendBackward="sendBackward"
          @bringToFront="bringToFront"
          @sendToBack="sendToBack"
          @deleteSelectedObject="deleteSelectedObject"
        />
        
        <!-- 导出按钮 -->
        <ExportButtons 
          @export="exportCanvas"
        />
      </div>
      
      <!-- 右侧：AI文案生成模块 -->
      <AiModule 
        :apiKey="apiKey"
        :prompt="prompt"
        :isGenerating="isGenerating"
        :aiResult="aiResult"
        :errorMessage="errorMessage"
        @updateApiKey="updateApiKey"
        @updatePrompt="updatePrompt"
        @saveApiKey="saveApiKey"
        @testApiKey="testApiKey"
        @generateAiContent="generateAiContent"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import * as fabric from 'fabric';

// 导入组件
import TemplateSelector from './components/TemplateSelector.vue';
import QuickActions from './components/QuickActions.vue';
import CanvasContainer from './components/CanvasContainer.vue';
import LayerOperations from './components/LayerOperations.vue';
import ExportButtons from './components/ExportButtons.vue';
import AiModule from './components/AiModule.vue';

// 拼图模板定义
const templates = [
  { id: '3-grid', name: '3宫格', width: 600, height: 800, grid: { rows: 3, cols: 1, gap: 20, margin: 20 } },
  { id: '4-grid', name: '4宫格', width: 600, height: 600, grid: { rows: 2, cols: 2, gap: 20, margin: 20 } },
  { id: 'long', name: '长图', width: 600, height: 1200, grid: { rows: 4, cols: 1, gap: 20, margin: 20 } }
];

// 响应式数据
const selectedTemplate = ref('3-grid');
const canvasWidth = ref(600);
const canvasHeight = ref(800);
const apiKey = ref('');
const prompt = ref('为这张图片生成吸引人的自媒体文案');
const isGenerating = ref(false);
const aiResult = ref<any>(null);
const errorMessage = ref('');
const canvasBackgroundColor = ref('#ffffff');
const showGrid = ref(true);
const selectedObject = ref<any>(null);
const uploadedImage = ref('');
const imageInfo = ref({ name: '', type: '', size: 0 });

// Fabric.js 画布实例
let fabricCanvas: fabric.Canvas | null = null;

// 初始化画布
const initCanvas = () => {
  if (!fabricCanvas) {
    console.error('画布未初始化');
    return;
  }
  
  console.log('开始初始化画布');
  console.log('画布宽度:', canvasWidth.value);
  console.log('画布高度:', canvasHeight.value);
  console.log('画布背景色:', canvasBackgroundColor.value);
  
  // 清除旧画布
  fabricCanvas.clear();
  
  try {
    console.log('Fabric.js画布初始化完成:', fabricCanvas);
    
    // 监听对象选择事件
    fabricCanvas.on('selection:created', (e) => {
      console.log('对象选择创建:', e.selected[0]);
      selectedObject.value = e.selected[0];
    });
    
    fabricCanvas.on('selection:updated', (e) => {
      console.log('对象选择更新:', e.selected[0]);
      selectedObject.value = e.selected[0];
    });
    
    fabricCanvas.on('selection:cleared', () => {
      console.log('对象选择清除');
      selectedObject.value = null;
    });
    
    // 绘制网格辅助线
    if (showGrid.value) {
      console.log('绘制网格辅助线');
      drawGrid();
    }
    
    console.log('画布初始化完成');
    
  } catch (error) {
    console.error('初始化画布失败:', error);
  }
};

// 绘制网格辅助线和宫格容器
const drawGrid = () => {
  if (!fabricCanvas) return;
  
  const template = templates.find(t => t.id === selectedTemplate.value);
  if (!template) return;
  
  const { rows, cols, gap, margin } = template.grid;
  // 使用实际的画布尺寸来计算宫格大小
  const canvasWidth = fabricCanvas.width || template.width;
  const canvasHeight = fabricCanvas.height || template.height;
  
  // 重新计算宫格尺寸，确保宫格能够完整显示
  const totalGapWidth = (cols - 1) * gap;
  const totalGapHeight = (rows - 1) * gap;
  const availableWidth = canvasWidth - 2 * margin;
  const availableHeight = canvasHeight - 2 * margin;
  const cellWidth = (availableWidth - totalGapWidth) / cols;
  const cellHeight = (availableHeight - totalGapHeight) / rows;
  
  console.log('绘制网格:', rows, '行', cols, '列');
  console.log('画布尺寸:', canvasWidth, 'x', canvasHeight);
  console.log('可用空间:', availableWidth, 'x', availableHeight);
  console.log('宫格尺寸:', cellWidth, 'x', cellHeight);
  console.log('边距和间距:', margin, gap);
  console.log('总间距:', totalGapWidth, 'x', totalGapHeight);
  
  // 彻底清除所有旧的网格线和宫格容器
  // 先获取所有对象，然后再删除，避免遍历过程中修改数组
  const objectsToRemove = [];
  fabricCanvas.getObjects().forEach(obj => {
    if (obj.type === 'line' || (obj.type === 'rect' && obj.data && obj.data.isGridContainer)) {
      objectsToRemove.push(obj);
    }
  });
  
  // 删除所有标记的对象
  objectsToRemove.forEach(obj => {
    fabricCanvas!.remove(obj);
  });
  
  console.log('清除了', objectsToRemove.length, '个旧对象');
  
  // 为每个宫格创建容器背景
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const left = margin + col * (cellWidth + gap);
      const top = margin + row * (cellHeight + gap);
      
      console.log('创建宫格容器:', row, col, '位置:', left, top, '尺寸:', cellWidth, cellHeight);
      
      // 创建宫格容器背景
      const container = new fabric.Rect({
        left: left,
        top: top,
        width: cellWidth,
        height: cellHeight,
        fill: 'rgba(255, 255, 255, 0.8)', // 半透明白色背景
        // 移除边框，避免与网格线冲突
        stroke: 'transparent',
        strokeWidth: 0,
        selectable: false,
        evented: false,
        data: { isGridContainer: true } // 标记为宫格容器
      });
      fabricCanvas.add(container);
    }
  }
  
  // 绘制垂直线
  for (let i = 0; i <= cols; i++) {
    // 重新计算垂直线的位置，确保右边的线条能够完整显示
    const x = margin + i * (cellWidth + gap);
    console.log('绘制垂直线:', i, '位置:', x);
    // 垂直线的结束位置应该是画布的底部，而不是画布高度减去边距
    const line = new fabric.Line([x, 0, x, canvasHeight], {
      stroke: '#666666', // 更清晰的颜色
      strokeWidth: 1.5, // 稍微加粗，提高可见性
      selectable: false,
      evented: false // 确保线条不会干扰鼠标事件
    });
    fabricCanvas.add(line);
  }
  
  // 绘制水平线
  for (let i = 0; i <= rows; i++) {
    // 重新计算水平线的位置，确保底部的线条能够完整显示
    const y = margin + i * (cellHeight + gap);
    console.log('绘制水平线:', i, '位置:', y);
    // 水平线的结束位置应该是画布的右侧，而不是画布宽度减去边距
    const line = new fabric.Line([0, y, canvasWidth, y], {
      stroke: '#666666', // 更清晰的颜色
      strokeWidth: 1.5, // 稍微加粗，提高可见性
      selectable: false,
      evented: false // 确保线条不会干扰鼠标事件
    });
    fabricCanvas.add(line);
  }
  
  // 渲染画布
  fabricCanvas.renderAll();
  console.log('网格绘制完成，共创建', rows * cols, '个宫格容器');
};

// 选择模板
const selectTemplate = (template: any) => {
  selectedTemplate.value = template.id;
  canvasWidth.value = template.width;
  canvasHeight.value = template.height;
  initCanvas();
};

// 处理文件上传
const handleFileUpload = (event: Event) => {
  console.log('文件上传事件触发');
  
  try {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    
    console.log('input元素:', input);
    console.log('files:', files);
    
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
    const { rows, cols, gap, margin } = template.grid;
    console.log('模板宫格布局:', rows, '行', cols, '列');
    
    // 计算每个宫格的尺寸，使用实际的画布尺寸
    const canvasWidth = fabricCanvas?.width || template.width;
    const canvasHeight = fabricCanvas?.height || template.height;
    
    // 重新计算宫格尺寸，确保与drawGrid函数使用相同的逻辑
    const totalGapWidth = (cols - 1) * gap;
    const totalGapHeight = (rows - 1) * gap;
    const availableWidth = canvasWidth - 2 * margin;
    const availableHeight = canvasHeight - 2 * margin;
    const cellWidth = (availableWidth - totalGapWidth) / cols;
    const cellHeight = (availableHeight - totalGapHeight) / rows;
    
    console.log('画布尺寸:', canvasWidth, 'x', canvasHeight);
    console.log('可用空间:', availableWidth, 'x', availableHeight);
    console.log('每个宫格尺寸:', cellWidth, 'x', cellHeight);
    console.log('边距和间距:', margin, gap);
    console.log('总间距:', totalGapWidth, 'x', totalGapHeight);
    
    // 计算宫格数量
    const totalCells = rows * cols;
    console.log('总宫格数量:', totalCells);
    
    // 限制文件数量不超过宫格数量
    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    const processFiles = validFiles.slice(0, totalCells);
    console.log('有效图片文件数量:', processFiles.length);
    
    if (processFiles.length === 0) {
      console.log('没有有效的图片文件');
      alert('请选择图片文件');
      return;
    }
    
    // 清空画布
    if (fabricCanvas) {
      console.log('清空画布');
      fabricCanvas.clear();
      
      // 重新绘制网格线
      if (showGrid.value) {
        drawGrid();
      }
    }
    
    // 处理每个文件
    processFiles.forEach((file, index) => {
      console.log('处理文件:', index + 1, file.name, file.type, file.size);
      
      // 计算图片在宫格中的位置
      const row = Math.floor(index / cols);
      const col = index % cols;
      console.log('图片位置:', row, '行', col, '列');
      
      // 计算图片的实际位置
      const left = margin + col * (cellWidth + gap) + cellWidth / 2;
      const top = margin + row * (cellHeight + gap) + cellHeight / 2;
      console.log('图片坐标:', left, top);
      
      // 使用FileReader读取文件为DataURL
      const reader = new FileReader();
      reader.onload = function(e) {
        const dataURL = e.target?.result as string;
        console.log('文件读取为DataURL成功，长度:', dataURL.length);
        
        // 使用Fabric.js添加图片
        if (fabricCanvas) {
          try {
            const imgElement = new Image();
            imgElement.onload = function() {
              console.log('HTML图片元素加载完成:', imgElement.width, 'x', imgElement.height);
              
              // 计算图片缩放比例，确保图片完全覆盖宫格
              const scaleX = cellWidth / imgElement.width;
              const scaleY = cellHeight / imgElement.height;
              const scale = Math.max(scaleX, scaleY); // 使用max确保图片完全覆盖宫格
              console.log('图片缩放比例:', scale);
              
              // 计算宫格边界
              const cellLeft = margin + col * (cellWidth + gap);
              const cellTop = margin + row * (cellHeight + gap);
              console.log('宫格边界:', cellLeft, cellTop, cellWidth, cellHeight);
              
              // 创建图片对象
              const fabricImg = new fabric.Image(imgElement, {
                left: left,
                top: top,
                originX: 'center',
                originY: 'center',
                angle: 0,
                scaleX: scale,
                scaleY: scale,
                hasControls: true,
                hasBorders: true,
                cornerSize: 10,
                transparentCorners: false,
                // 限制缩放范围，确保图片不会太小
                minScaleX: 0.5,
                minScaleY: 0.5
              });
              
              // 添加移动限制，确保图片只能在宫格内移动
              fabricImg.on('moving', function(e) {
                // 计算宫格边界
                const cellRight = cellLeft + cellWidth;
                const cellBottom = cellTop + cellHeight;
                
                // 计算图片边界
                const imgHalfWidth = (imgElement.width * this.scaleX) / 2;
                const imgHalfHeight = (imgElement.height * this.scaleY) / 2;
                
                // 限制移动范围
                if (this.left - imgHalfWidth < cellLeft) {
                  this.left = cellLeft + imgHalfWidth;
                }
                if (this.left + imgHalfWidth > cellRight) {
                  this.left = cellRight - imgHalfWidth;
                }
                if (this.top - imgHalfHeight < cellTop) {
                  this.top = cellTop + imgHalfHeight;
                }
                if (this.top + imgHalfHeight > cellBottom) {
                  this.top = cellBottom - imgHalfHeight;
                }
              });
              
              console.log('Fabric.js图片对象创建成功:', fabricImg);
              
              // 计算图片的最大缩放比例，确保图片不会超过宫格容器
              const maxScale = Math.min(
                (cellWidth * 0.95) / imgElement.width, // 留出5%的边距
                (cellHeight * 0.95) / imgElement.height
              );
              console.log('图片最大缩放比例:', maxScale);
              
              // 监听图片缩放事件，实时限制缩放范围
              fabricImg.on('scaling', function(e) {
                // 确保图片不会超过最大缩放限制
                if (this.scaleX > maxScale) {
                  this.scaleX = maxScale;
                  e.preventDefault(); // 阻止进一步缩放
                }
                if (this.scaleY > maxScale) {
                  this.scaleY = maxScale;
                  e.preventDefault(); // 阻止进一步缩放
                }
                // 确保图片的宽高比保持一致
                this.scaleY = this.scaleX;
                fabricCanvas.renderAll();
              });
              
              // 监听图片变换事件，确保缩放限制始终有效
              fabricImg.on('modified', function() {
                // 确保图片不会超过最大缩放限制
                if (this.scaleX > maxScale) {
                  this.scaleX = maxScale;
                }
                if (this.scaleY > maxScale) {
                  this.scaleY = maxScale;
                }
                // 确保图片的宽高比保持一致
                this.scaleY = this.scaleX;
                fabricCanvas.renderAll();
              });
              
              // 添加到画布
              fabricCanvas.add(fabricImg);
              console.log('图片添加到画布成功:', file.name);
              
              // 渲染画布
              fabricCanvas.renderAll();
            };
            
            imgElement.onerror = function(err) {
              console.error('HTML图片元素加载失败:', err);
            };
            
            imgElement.src = dataURL;
            
          } catch (error) {
            console.error('添加图片到画布失败:', error);
          }
        }
      };
      
      reader.onerror = function(err) {
        console.error('文件读取失败:', err);
      };
      
      reader.readAsDataURL(file);
    });
    
    console.log('批量上传处理完成');
    
  } catch (error) {
    console.error('处理文件上传时出错:', error);
    alert('处理文件上传时出错，请重试');
  }
};

// 重置画布
const resetCanvas = () => {
  initCanvas();
};

// 处理画布初始化
const handleCanvasInitialized = (canvas: fabric.Canvas) => {
  fabricCanvas = canvas;
  initCanvas();
};

// 更新画布背景色
const updateCanvasBackground = (color: string) => {
  canvasBackgroundColor.value = color;
  if (fabricCanvas) {
    // 在Fabric.js 7.1.0中，setBackgroundColor的用法可能有所不同
    // 我们直接重新创建画布来更新背景色
    const canvasElement = fabricCanvas.getElement();
    if (canvasElement) {
      // 保存当前画布上的所有对象
      const objects = fabricCanvas.getObjects();
      
      // 重新创建画布
      const newCanvas = new fabric.Canvas(canvasElement, {
        width: canvasWidth.value,
        height: canvasHeight.value,
        backgroundColor: color
      });
      
      // 复制所有对象到新画布
      objects.forEach(obj => {
        newCanvas.add(obj);
      });
      
      // 替换旧画布
      fabricCanvas.dispose();
      fabricCanvas = newCanvas;
      
      // 重新添加事件监听器
      fabricCanvas.on('selection:created', (e) => {
        selectedObject.value = e.selected[0];
      });
      
      fabricCanvas.on('selection:updated', (e) => {
        selectedObject.value = e.selected[0];
      });
      
      fabricCanvas.on('selection:cleared', () => {
        selectedObject.value = null;
      });
      
      // 重新绘制网格
      if (showGrid.value) {
        drawGrid();
      }
    }
  }
};

// 切换网格显示/隐藏
const toggleGrid = (show: boolean) => {
  showGrid.value = show;
  if (fabricCanvas) {
    // 清除所有网格线和宫格容器
    fabricCanvas.getObjects().forEach(obj => {
      if (obj.type === 'line' || obj.type === 'rect' && obj.data && obj.data.isGridContainer) {
        fabricCanvas!.remove(obj);
      }
    });
    
    // 绘制网格线和宫格容器（如果需要）
    if (show) {
      drawGrid();
    }
    
    fabricCanvas.renderAll();
  }
};

// 上移一层
const bringForward = () => {
  if (fabricCanvas && selectedObject.value) {
    fabricCanvas.bringForward(selectedObject.value);
    fabricCanvas.renderAll();
  }
};

// 下移一层
const sendBackward = () => {
  if (fabricCanvas && selectedObject.value) {
    fabricCanvas.sendBackwards(selectedObject.value);
    fabricCanvas.renderAll();
  }
};

// 移至顶层
const bringToFront = () => {
  if (fabricCanvas && selectedObject.value) {
    fabricCanvas.bringToFront(selectedObject.value);
    fabricCanvas.renderAll();
  }
};

// 移至底层
const sendToBack = () => {
  if (fabricCanvas && selectedObject.value) {
    fabricCanvas.sendToBack(selectedObject.value);
    fabricCanvas.renderAll();
  }
};

// 删除选中对象
const deleteSelectedObject = () => {
  if (fabricCanvas && selectedObject.value) {
    fabricCanvas.remove(selectedObject.value);
    selectedObject.value = null;
    fabricCanvas.renderAll();
  }
};

// 导出画布
const exportCanvas = (format: 'jpg' | 'png', quality: 'original' | 'standard') => {
  if (!fabricCanvas) return;
  
  const qualityValue = quality === 'original' ? 1.0 : 0.7;
  const dataURL = fabricCanvas.toDataURL({
    format: format,
    quality: qualityValue
  });
  
  // 转换为Blob并下载
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
    });
};

// 更新API Key
const updateApiKey = (key: string) => {
  apiKey.value = key;
};

// 更新提示词
const updatePrompt = (newPrompt: string) => {
  prompt.value = newPrompt;
};

// 保存API Key到LocalStorage
const saveApiKey = () => {
  localStorage.setItem('zhipu_thinking_api_key', apiKey.value);
};

// 测试API Key连接
const testApiKey = () => {
  // 这里可以实现API Key测试逻辑
  alert('API Key测试功能待实现');
};

// 生成AI文案
const generateAiContent = async () => {
  if (!fabricCanvas || isGenerating.value) return;
  
  try {
    isGenerating.value = true;
    errorMessage.value = '';
    
    // 导出画布为Base64
    const imageData = fabricCanvas.toDataURL({
      format: 'png',
      quality: 0.8
    });
    
    // 构造请求参数
    const requestData = {
      imageData,
      prompt: prompt.value,
      provider: 'glm-4.6v-flash',
      apiKey: apiKey.value || '6bb4ba583aa140b58d4206c0c17a7c7d.lczAd2j0sPl0rHBD'
    };
    
    // 调用后端API
    // 注意：这里需要替换为实际的后端API地址
    // const response = await fetch('/api/ai/analyze', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(requestData)
    // });
    // 
    // if (!response.ok) {
    //   throw new Error('API调用失败');
    // }
    // 
    // const result = await response.json();
    // aiResult.value = result;
    
    // 模拟API响应
    setTimeout(() => {
      aiResult.value = {
        aiThinking: '我需要分析这张图片的内容，然后生成吸引人的自媒体文案。图片中展示了一个拼图作品，包含多个图片元素，整体布局美观。我将从视觉效果、内容主题和情感共鸣三个方面来生成文案。',
        aiResult: '【拼图美学】\n\n一张好的拼图，不仅是图片的组合，更是故事的串联。\n\n今天用AIpic工具制作了这组拼图，每一张图片都承载着不同的回忆与情感。\n\n🌟 亮点：\n• 专业的布局设计，让整体视觉更加协调\n• 高清画质，细节清晰可见\n• 一键生成文案，省时又省力\n\n如果你也喜欢用图片记录生活，不妨试试AIpic，让创作变得更加简单高效！\n\n#自媒体工具 #图片编辑 #AI文案 #生活记录'
      };
      isGenerating.value = false;
    }, 2000);
    
  } catch (error) {
    errorMessage.value = '生成文案失败，请检查API Key是否正确';
    isGenerating.value = false;
  }
};

// 初始化API Key
const initApiKey = () => {
  // 优先级：LocalStorage > 环境变量 > 默认值
  const storedKey = localStorage.getItem('zhipu_thinking_api_key');
  const envKey = import.meta.env.VITE_ZHIPU_THINKING_API_KEY;
  const defaultKey = '6bb4ba583aa140b58d4206c0c17a7c7d.lczAd2j0sPl0rHBD';
  
  apiKey.value = storedKey || envKey || defaultKey;
};

// 生命周期钩子
onMounted(() => {
  initApiKey();
});
</script>

<style scoped>
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.main-content {
  display: flex;
  gap: 30px;
}

.puzzle-module {
  flex: 1;
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

h2 {
  color: #555;
  margin-bottom: 20px;
  font-size: 18px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }
}
</style>