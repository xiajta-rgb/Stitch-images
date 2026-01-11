<template>
  <div class="ai-module">
    <h2>AI文案生成</h2>
    
    <!-- API Key配置 -->
    <div class="api-key-section">
      <label>API Key:</label>
      <input 
        type="text" 
        :value="apiKey"
        @input="updateApiKey"
        placeholder="请输入API Key"
        @blur="saveApiKey"
      />
      <button 
        @click="testApiKey"
        :disabled="isTestingApiKey"
        class="test-button"
      >
        {{ isTestingApiKey ? '测试中...' : '测试连接' }}
      </button>
      
      <!-- API Key测试结果 -->
      <div 
        class="api-key-test-result"
        v-if="apiKeyTestResult"
      >
        <div 
          class="test-result-content"
          :class="apiKeyTestResult.success ? 'success' : 'error'"
        >
          <span class="test-result-icon">
            {{ apiKeyTestResult.success ? '✓' : '✗' }}
          </span>
          <span class="test-result-message">
            {{ apiKeyTestResult.message }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- 预览图片选择 -->
    <div class="preview-selection">
      <label>选择预览图片（可多选）:</label>
      <div class="preview-checkbox-list">
        <div 
          class="preview-checkbox-item"
          v-for="record in previewRecords" 
          :key="record.id"
        >
          <input 
            type="checkbox"
            :id="`preview-${record.id}`"
            :value="record.id"
            v-model="selectedPreviewIds"
            @change="handlePreviewSelectionChange"
          />
          <label :for="`preview-${record.id}`" class="preview-checkbox-label">
            <span class="preview-checkbox-title">
              图{{ previewRecords.indexOf(record) + 1 }}
            </span>
            <span class="preview-checkbox-time">
              {{ record.timestamp.toLocaleString() }}
            </span>
          </label>
        </div>
        <div class="no-previews" v-if="previewRecords.length === 0">
          暂无预览图片，请先在图片拼图页面生成预览
        </div>
      </div>
    </div>
    
    <!-- 提示词输入 -->
    <div class="prompt-section">
      <label>提示词:</label>
      <textarea 
        :value="prompt"
        @input="updatePrompt"
        placeholder="请输入文案提示词，例如：为这张美食图片生成吸引人的自媒体文案"
        rows="4"
      ></textarea>
    </div>
    
    <!-- 生成按钮 -->
    <button 
      class="generate-button"
      @click="generateAiContent"
      :disabled="isGenerating"
    >
      {{ isGenerating ? '生成中...' : '生成文案' }}
    </button>
    
    <!-- 生成结果 -->
    <div class="result-section" v-if="aiResult">
      <h3>生成结果</h3>
      <div class="ai-thinking" v-if="aiResult.aiThinking">
        <strong>AI思考过程:</strong>
        <p>{{ aiResult.aiThinking }}</p>
      </div>
      <div class="ai-content" v-if="aiResult.aiResult">
        <strong>AI文案:</strong>
        <p>{{ aiResult.aiResult }}</p>
      </div>
    </div>
    
    <!-- 错误信息 -->
    <div class="error-message" v-if="errorMessage">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, computed, withDefaults } from 'vue';

// 预览记录接口
interface PreviewRecord {
  id: string;
  dataURL: string;
  timestamp: Date;
}

// 组件属性
const props = withDefaults(defineProps<{
  apiKey: string;
  prompt: string;
  isGenerating: boolean;
  aiResult: any;
  errorMessage: string;
  previewRecords: PreviewRecord[];
  isTestingApiKey: boolean;
  apiKeyTestResult: { success: boolean; message: string } | null;
}>(), {
  previewRecords: () => []
});

// 组件事件
const emit = defineEmits<{
  (e: 'updateApiKey', key: string): void;
  (e: 'updatePrompt', prompt: string): void;
  (e: 'saveApiKey'): void;
  (e: 'testApiKey'): void;
  (e: 'generateAiContent', selectedPreviews: PreviewRecord[]): void;
}>();

// 选中的预览图片ID
const selectedPreviewIds = ref<string[]>([]);

// 计算选中的预览图片
const selectedPreviews = computed(() => {
  // 确保previewRecords是数组，selectedPreviewIds.value是数组
  const records = Array.isArray(props.previewRecords) ? props.previewRecords : [];
  const ids = Array.isArray(selectedPreviewIds.value) ? selectedPreviewIds.value : [];
  
  return records.filter(record => ids.includes(record.id));
});

// 处理预览图片选择变化
const handlePreviewSelectionChange = (event: Event) => {
  // 直接使用v-model双向绑定，无需手动处理事件
  // 确保selectedPreviewIds.value始终是数组
  if (!Array.isArray(selectedPreviewIds.value)) {
    selectedPreviewIds.value = [];
  }
};

// 更新API Key
const updateApiKey = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('updateApiKey', target.value);
};

// 更新提示词
const updatePrompt = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  emit('updatePrompt', target.value);
};

// 保存API Key
const saveApiKey = () => {
  emit('saveApiKey');
};

// 测试API Key连接
const testApiKey = () => {
  emit('testApiKey');
};

// 生成AI文案
const generateAiContent = () => {
  try {
    // 确保selectedPreviews.value是数组
    const previews = Array.isArray(selectedPreviews.value) ? selectedPreviews.value : [];
    emit('generateAiContent', previews);
  } catch (error) {
    console.error('Error in generateAiContent:', error);
    // 即使出错，也要确保传递一个数组
    emit('generateAiContent', []);
  }
};
</script>

<style scoped>
.ai-module {
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

/* API Key配置 */
.api-key-section {
  margin-bottom: 20px;
}

.api-key-section label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #555;
}

/* 预览图片选择 */
.preview-selection {
  margin-bottom: 20px;
}

.preview-selection label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #555;
}

.preview-checkbox-list {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  max-height: 200px;
  overflow-y: auto;
}

.preview-checkbox-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 5px;
}

.preview-checkbox-item:hover {
  background-color: #f0f0f0;
}

.preview-checkbox-item input[type="checkbox"] {
  margin-right: 10px;
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.preview-checkbox-label {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  flex: 1;
}

.preview-checkbox-title {
  font-weight: 500;
  margin-bottom: 2px;
}

.preview-checkbox-time {
  font-size: 12px;
  color: #999;
}

.no-previews {
  text-align: center;
  color: #999;
  padding: 20px;
  font-style: italic;
}

/* 复选框样式美化 */
.preview-checkbox-item input[type="checkbox"] {
  accent-color: #3366ff;
}

.api-key-section input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
}

.api-key-section button {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.api-key-section button:hover {
  background: #f0f0f0;
}

.test-button {
  margin-left: 10px;
}

.test-button:disabled {
  background: #f0f0f0;
  cursor: not-allowed;
  opacity: 0.6;
}

/* API Key测试结果 */
.api-key-test-result {
  margin-top: 10px;
  padding: 10px;
  border-radius: 4px;
}

.test-result-content {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
}

.test-result-content.success {
  background-color: #e8f5e8;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
}

.test-result-content.error {
  background-color: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
}

.test-result-icon {
  margin-right: 8px;
  font-weight: bold;
  font-size: 16px;
}

.test-result-message {
  flex: 1;
  line-height: 1.4;
}

/* 提示词输入 */
.prompt-section {
  margin-bottom: 20px;
}

.prompt-section label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #555;
}

.prompt-section textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
}

/* 生成按钮 */
.generate-button {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 4px;
  background: #4CAF50;
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

.generate-button:hover {
  background: #45a049;
}

.generate-button:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

/* 结果区域 */
.result-section {
  background: white;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.ai-thinking,
.ai-content {
  margin-bottom: 15px;
}

.ai-thinking strong,
.ai-content strong {
  display: block;
  margin-bottom: 5px;
  color: #333;
}

/* 错误信息 */
.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ai-module {
    margin-top: 20px;
  }
}
</style>