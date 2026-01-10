<template>
  <div class="layer-operations" v-if="hasSelectedObject">
    <h3>图层操作</h3>
    <button @click="bringForward">上移一层</button>
    <button @click="sendBackward">下移一层</button>
    <button @click="bringToFront">移至顶层</button>
    <button @click="sendToBack">移至底层</button>
    <button @click="deleteSelectedObject" class="danger">删除选中</button>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

// 组件属性
const props = defineProps<{
  hasSelectedObject: boolean;
}>();

// 组件事件
const emit = defineEmits<{
  (e: 'bringForward'): void;
  (e: 'sendBackward'): void;
  (e: 'bringToFront'): void;
  (e: 'sendToBack'): void;
  (e: 'deleteSelectedObject'): void;
}>();

// 上移一层
const bringForward = () => {
  emit('bringForward');
};

// 下移一层
const sendBackward = () => {
  emit('sendBackward');
};

// 移至顶层
const bringToFront = () => {
  emit('bringToFront');
};

// 移至底层
const sendToBack = () => {
  emit('sendToBack');
};

// 删除选中对象
const deleteSelectedObject = () => {
  emit('deleteSelectedObject');
};
</script>

<style scoped>
.layer-operations {
  margin-bottom: 20px;
  padding: 15px;
  background: white;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.layer-operations h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
}

.layer-operations button {
  margin-right: 10px;
  margin-bottom: 10px;
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.layer-operations button:hover {
  background: #f0f0f0;
}

.layer-operations button.danger {
  border-color: #f44336;
  color: #f44336;
}

.layer-operations button.danger:hover {
  background: #ffebee;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .layer-operations button {
    margin-right: 8px;
  }
}
</style>