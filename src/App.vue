<template>
  <div class="app-container">
    <h1>AIpic - 自媒体图片笔记工具</h1>
    
    <!-- 导航菜单 -->
    <nav class="nav-menu">
      <router-link to="/" active-class="active">图片拼图</router-link>
      <router-link to="/ai-content" active-class="active">AI文案生成</router-link>
    </nav>
    
    <!-- 路由视图 -->
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { ref, provide } from 'vue';

// 预览记录接口
interface PreviewRecord {
  id: string;
  dataURL: string;
  timestamp: Date;
}

// 全局预览记录状态
const previewRecords = ref<PreviewRecord[]>([]);

// 提供全局状态给子组件
provide('previewRecords', previewRecords);

// 更新预览记录的方法
const updatePreviewRecords = (records: PreviewRecord[]) => {
  previewRecords.value = records;
};

// 提供更新方法给子组件
provide('updatePreviewRecords', updatePreviewRecords);
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

/* 导航菜单样式 */
.nav-menu {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 30px;
  padding: 10px;
  background: #f0f0f0;
  border-radius: 8px;
}

.nav-menu a {
  padding: 10px 20px;
  text-decoration: none;
  color: #555;
  font-weight: 500;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.nav-menu a:hover {
  background: #e0e0e0;
  color: #3366ff;
}

.nav-menu a.active {
  background: #3366ff;
  color: white;
}
</style>