import { createRouter, createWebHistory } from 'vue-router';

import ImagePuzzle from '../views/ImagePuzzle.vue';
import Gallery from '../views/Gallery.vue';

const routes = [
  {
    path: '/',
    name: 'ImagePuzzle',
    component: ImagePuzzle
  },
  {
    path: '/gallery',
    name: 'Gallery',
    component: Gallery
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
