<template>
  <div class="canvas-container">
    <!-- 画布头部 -->
    <div class="canvas-header">
      <span>画布操作</span>
    </div>
    
    <!-- 画布设置 -->
    <div class="canvas-settings">
      <label>背景色:</label>
      <input 
        type="color" 
        :value="canvasBackgroundColor"
        @change="updateBackgroundColor"
      />
      <label>
        <input 
          type="checkbox" 
          :checked="showGrid"
          @change="toggleGrid"
        />
        显示网格
      </label>
    </div>
    
    <!-- Canvas元素 -->
    <canvas 
      ref="canvas" 
      :width="canvasWidth" 
      :height="canvasHeight"
    ></canvas>
    
    <!-- 图片预览 -->
    <div v-if="uploadedImage" class="image-preview">
      <h4>图片预览</h4>
      <img :src="uploadedImage" style="max-width: 100%; max-height: 300px;" />
      <p>文件名: {{ imageInfo.name }}</p>
      <p>类型: {{ imageInfo.type }}</p>
      <p>大小: {{ (imageInfo.size / 1024).toFixed(2) }} KB</p>
    </div>
    
    <!-- 画布底部 -->
    <div class="canvas-footer">
      <span v-if="selectedObject">已选择: {{ getSelectedObjectName(selectedObject) }}</span>
      <span v-else>请选择图片进行操作</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, onMounted, watch } from 'vue';
import * as fabric from 'fabric';

// 组件属性
const props = defineProps<{
  canvasWidth: number;
  canvasHeight: number;
  canvasBackgroundColor: string;
  showGrid: boolean;
  selectedObject: any;
  uploadedImage: string;
  imageInfo: {
    name: string;
    type: string;
    size: number;
  };
}>();

// 组件事件
const emit = defineEmits<{
  (e: 'updateBackgroundColor', color: string): void;
  (e: 'toggleGrid', show: boolean): void;
  (e: 'canvasInitialized', canvas: fabric.Canvas): void;
}>();

// 响应式数据
const canvas = ref<HTMLCanvasElement>();

// Fabric.js 画布实例
let fabricCanvas: fabric.Canvas | null = null;

// 初始化画布
const initCanvas = () => {
  if (!canvas.value) {
    console.error('canvas元素不存在');
    return;
  }
  
  // 清除旧画布
  if (fabricCanvas) {
    fabricCanvas.dispose();
    fabricCanvas = null;
  }
  
  try {
    // 创建新画布
    fabricCanvas = new fabric.Canvas(canvas.value, {
      width: props.canvasWidth,
      height: props.canvasHeight,
      backgroundColor: props.canvasBackgroundColor
    });
    
    console.log('Fabric.js画布创建成功:', fabricCanvas);
    
    // 触发画布初始化事件
    emit('canvasInitialized', fabricCanvas);
    
    // 绘制网格辅助线
    if (props.showGrid) {
      drawGrid();
    }
    
  } catch (error) {
    console.error('初始化画布失败:', error);
  }
};

// 绘制网格辅助线
const drawGrid = () => {
  if (!fabricCanvas) return;
  
  // 这里可以根据需要实现网格绘制逻辑
  // 实际的网格绘制可能需要根据模板布局来计算
};

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

// 获取选中对象名称
const getSelectedObjectName = (object: any) => {
  if (object) {
    if (object.type === 'image') {
      return '图片';
    }
    return object.type;
  }
  return '';
};

// 监听画布尺寸变化
watch([() => props.canvasWidth, () => props.canvasHeight], () => {
  initCanvas();
});

// 监听背景色变化
watch(() => props.canvasBackgroundColor, (newColor) => {
  if (fabricCanvas) {
    fabricCanvas.setBackgroundColor(newColor, fabricCanvas.renderAll.bind(fabricCanvas));
  }
});

// 监听网格显示变化
watch(() => props.showGrid, (show) => {
  if (fabricCanvas) {
    // 清除现有辅助线
    fabricCanvas.getObjects().forEach(obj => {
      if (obj.type === 'line') {
        fabricCanvas!.remove(obj);
      }
    });
    
    // 绘制网格线（如果需要）
    if (show) {
      drawGrid();
    }
    
    fabricCanvas.renderAll();
  }
});

// 生命周期钩子
onMounted(() => {
  initCanvas();
});
</script>

<style scoped>
.canvas-container {
  border: 1px solid #ddd;
  background: white;
  margin-bottom: 20px;
  overflow: hidden;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.canvas-header {
  padding: 10px 15px;
  background: #f9f9f9;
  border-bottom: 1px solid #ddd;
  font-size: 14px;
  font-weight: 500;
  color: #555;
}

/* 画布设置 */
.canvas-settings {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
  padding: 10px;
  background: white;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.canvas-settings label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

.canvas-settings input[type="color"] {
  width: 40px;
  height: 30px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

canvas {
  display: block;
  background: white;
}

.canvas-footer {
  padding: 10px 15px;
  background: #f9f9f9;
  border-top: 1px solid #ddd;
  font-size: 14px;
  color: #666;
  text-align: center;
}

/* 图片预览 */
.image-preview {
  padding: 15px;
  background: #f9f9f9;
  border-top: 1px solid #ddd;
}

.image-preview h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #333;
}

.image-preview img {
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.image-preview p {
  margin: 5px 0;
  font-size: 14px;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .canvas-settings {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>