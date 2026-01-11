<template>
  <div class="app-container">
    <!-- 核心功能区 -->
    <div class="main-content">
      <!-- 右侧：AI文案生成模块 -->
      <div class="ai-module">
        <h2>AI文案生成</h2>
        <AiModule 
          :apiKey="apiKey"
          :prompt="prompt"
          :isGenerating="isGenerating"
          :aiResult="aiResult"
          :errorMessage="errorMessage"
          :previewRecords="getPreviewRecordsArray()"
          :isTestingApiKey="isTestingApiKey"
          :apiKeyTestResult="apiKeyTestResult"
          @updateApiKey="updateApiKey"
          @updatePrompt="updatePrompt"
          @saveApiKey="saveApiKey"
          @testApiKey="testApiKey"
          @generateAiContent="generateAiContent"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject } from 'vue';

// 导入组件
import AiModule from '../components/AiModule.vue';

// 注入全局预览记录状态
const previewRecords = inject('previewRecords');

// 获取实际的预览记录数组
const getPreviewRecordsArray = () => {
  // 确保返回的是数组
  if (!previewRecords) {
    return [];
  }
  // 处理ref对象的情况
  if (typeof previewRecords === 'object' && 'value' in previewRecords) {
    return Array.isArray(previewRecords.value) ? previewRecords.value : [];
  }
  // 处理直接是数组的情况
  return Array.isArray(previewRecords) ? previewRecords : [];
};

// 响应式数据
const apiKey = ref('');
const prompt = ref('为这张图片生成吸引人的自媒体文案');
const isGenerating = ref(false);
const aiResult = ref<any>(null);
const errorMessage = ref('');
const isTestingApiKey = ref(false);
const apiKeyTestResult = ref<{ success: boolean; message: string } | null>(null);

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
const testApiKey = async () => {
  if (isTestingApiKey.value) return;
  
  try {
    isTestingApiKey.value = true;
    apiKeyTestResult.value = null;
    errorMessage.value = '';
    
    // 检查API Key是否为空
    if (!apiKey.value.trim()) {
      apiKeyTestResult.value = {
        success: false,
        message: 'API Key不能为空'
      };
      isTestingApiKey.value = false;
      return;
    }
    
    // 构造简单的测试请求，只包含文本，不包含图片
    const messages = [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "请返回'API Key测试成功'"
          }
        ]
      }
    ];
    
    const payload = {
      "model": "glm-4.6v-flash",
      "messages": messages,
      "temperature": 0.1,
      "max_tokens": 50
    };
    
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey.value}`
    };
    
    // 调用GLM API测试
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      apiKeyTestResult.value = {
        success: false,
        message: errorData.error?.message || `API调用失败，状态码：${response.status}`
      };
      return;
    }
    
    const result = await response.json();
    
    // 解析API响应
    if (result.choices && result.choices.length > 0) {
      const content = result.choices[0].message.content;
      
      apiKeyTestResult.value = {
        success: true,
        message: `API Key测试成功：${content.trim()}`
      };
    } else {
      throw new Error('API返回格式错误，缺少choices字段');
    }
    
  } catch (error: any) {
    apiKeyTestResult.value = {
      success: false,
      message: `测试失败：${error.message || '未知错误'}`
    };
    console.error('API Key测试失败:', error);
  } finally {
    isTestingApiKey.value = false;
  }
};

// 生成AI文案
const generateAiContent = async (selectedPreviews: any[]) => {
  if (isGenerating.value) return;
  
  try {
    isGenerating.value = true;
    errorMessage.value = '';
    aiResult.value = null;
    
    // 确保selectedPreviews是数组
    const safePreviews = Array.isArray(selectedPreviews) ? selectedPreviews : [];
    
    // 检查是否选择了预览图片
    if (safePreviews.length === 0) {
      errorMessage.value = '请至少选择一张预览图片';
      isGenerating.value = false;
      return;
    }
    
    // 使用选中的第一张预览图片进行文案生成
    // 实际应用中可以支持多张图片，这里简化为使用第一张
    const imageData = safePreviews[0].dataURL;
    
    // 构造请求参数
    const messages = [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": prompt.value
          },
          {
            "type": "image_url",
            "image_url": {
              "url": imageData
            }
          }
        ]
      }
    ];
    
    const payload = {
      "model": "glm-4.6v-flash",
      "messages": messages,
      "temperature": 0.7,
      "max_tokens": 2000
    };
    
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey.value || '6bb4ba583aa140b58d4206c0c17a7c7d.lczAd2j0sPl0rHBD'}`
    };
    
    // 调用后端API
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API调用失败，状态码：${response.status}`);
    }
    
    const result = await response.json();
    
    // 解析API响应
    if (result.choices && result.choices.length > 0) {
      const aiContent = result.choices[0].message.content;
      
      // 构造返回格式
      aiResult.value = {
        aiThinking: 'AI分析图片并生成文案的思考过程',
        aiResult: aiContent
      };
    } else {
      throw new Error('API返回格式错误，缺少choices字段');
    }
    
  } catch (error: any) {
    errorMessage.value = `生成文案失败：${error.message || '未知错误'}`;
    console.error('生成文案失败:', error);
  } finally {
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

.main-content {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
  overflow: auto;
}

.ai-module {
  flex: 1;
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }
}
</style>
