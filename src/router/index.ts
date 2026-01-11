import { createRouter, createWebHistory } from 'vue-router';

// 导入组件
import ImagePuzzle from '../views/ImagePuzzle.vue';
import AiContent from '../views/AiContent.vue';

const routes = [
  {
    path: '/',
    name: 'ImagePuzzle',
    component: ImagePuzzle
  },
  {
    path: '/ai-content',
    name: 'AiContent',
    component: AiContent
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
