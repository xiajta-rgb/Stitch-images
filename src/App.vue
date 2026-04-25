<template>
  <div class="app-wrapper">
    <!-- Toast 提示 -->
    <Toast />
    <!-- 确认对话框 -->
    <ConfirmDialog ref="confirmDialogRef" />
    <!-- 导航菜单 -->
    <nav class="nav-menu">
      <router-link to="/" active-class="active">图片拼图</router-link>
      <router-link to="/gallery" active-class="active">图库管理</router-link>
    </nav>

    <!-- 路由视图 -->
    <router-view class="main-view" />
  </div>
</template>

<script setup lang="ts">
import { ref, provide, onMounted } from 'vue';
import Toast from './components/Toast.vue';
import ConfirmDialog from './components/ConfirmDialog.vue';
import { PreviewRecord } from './types';
import api from './services/api';

const confirmDialogRef = ref<any>(null);

const openConfirm = (
  message: string,
  options: {
    title?: string;
    type?: 'warning' | 'success' | 'error' | 'info';
    confirmText?: string;
    cancelText?: string;
  } = {}
) => {
  if (confirmDialogRef.value) {
    return confirmDialogRef.value.openConfirm(message, options);
  }
  return Promise.resolve(false);
};

provide('openConfirm', openConfirm);

// 全局预览记录状态
const previewRecords = ref<PreviewRecord[]>([]);

// 提供全局状态给子组件
provide('previewRecords', previewRecords);

// 从 API 加载数据
const loadData = async () => {
  try {
    const data = await api.getGallery();
    previewRecords.value = data.map((item: PreviewRecord) => ({
      ...item,
      timestamp: new Date(item.timestamp)
    }));
  } catch (error) {
    console.error('加载数据失败:', error);
  }
};

// 提供更新方法给子组件
provide('updatePreviewRecords', (records: PreviewRecord[]) => {
  previewRecords.value = records;
});

// 挂载时加载数据
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.app-wrapper {
  min-height: 100vh;
  font-family: Arial, sans-serif;
}

/* 导航菜单样式 - 通栏固定顶部 */
.nav-menu {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 10px 20px;
  background: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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
  background: #f0f0f0;
  color: #3366ff;
}

.nav-menu a.active {
  background: #3366ff;
  color: white;
}

.main-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 20px 30px;
  box-sizing: border-box;
  min-height: 100vh;
  overflow: visible !important;
  position: relative;
  z-index: 1;
  width: 100%;
  display: block;
}
</style>