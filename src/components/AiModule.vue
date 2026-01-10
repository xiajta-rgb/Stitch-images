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
      <button @click="testApiKey">测试连接</button>
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
import { defineProps, defineEmits } from 'vue';

// 组件属性
const props = defineProps<{
  apiKey: string;
  prompt: string;
  isGenerating: boolean;
  aiResult: any;
  errorMessage: string;
}>();

// 组件事件
const emit = defineEmits<{
  (e: 'updateApiKey', key: string): void;
  (e: 'updatePrompt', prompt: string): void;
  (e: 'saveApiKey'): void;
  (e: 'testApiKey'): void;
  (e: 'generateAiContent'): void;
}>();

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
  emit('generateAiContent');
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