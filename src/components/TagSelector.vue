<template>
  <div class="tag-selector" :class="{ 'inline-selector': mode === 'inline' }">
    <button
      v-if="mode === 'popup'"
      class="tag-selector-btn"
      @click.stop="toggleSelector"
      type="button"
    >
      标签库 ▾
    </button>

    <div v-if="showSelector" class="tag-selector-popup" :class="{ 'inline-popup': mode === 'inline' }">
      <div class="tag-category" v-for="cat in TAG_LIBRARY" :key="cat.name">
        <div class="tag-category-name">{{ cat.name }}</div>
        <div class="tag-options">
          <span
            v-for="tag in cat.tags"
            :key="tag"
            class="tag-option"
            :class="{ selected: selectedTags.includes(tag) }"
            @click="toggleTag(tag)"
          >{{ tag }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { TAG_LIBRARY } from '../types/tags';

const props = defineProps<{
  selectedTags: string[];
  mode?: 'popup' | 'inline';
}>();

const emit = defineEmits<{
  (e: 'update:selectedTags', tags: string[]): void;
}>();

const showSelector = ref(false);

const toggleSelector = () => {
  showSelector.value = !showSelector.value;
};

const toggleTag = (tag: string) => {
  const tags = [...props.selectedTags];
  const index = tags.indexOf(tag);
  if (index === -1) {
    tags.push(tag);
  } else {
    tags.splice(index, 1);
  }
  emit('update:selectedTags', tags);
};

defineExpose({
  close: () => { showSelector.value = false; }
});
</script>

<style scoped>
.tag-selector {
  position: relative;
}

.tag-selector.inline-selector {
  display: inline-block;
}

.tag-selector-btn {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 12px;
}

.tag-selector-popup {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 400px;
}

.tag-selector-popup.inline-popup {
  position: static;
  box-shadow: none;
  border: none;
  padding: 0;
  max-height: none;
  min-width: auto;
}

.tag-category {
  margin-bottom: 12px;
}

.tag-category:last-child {
  margin-bottom: 0;
}

.tag-category-name {
  font-weight: 600;
  font-size: 13px;
  color: #333;
  margin-bottom: 6px;
}

.tag-options {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-option {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
  background: #f0f0f0;
  color: #666;
  transition: all 0.2s;
}

.tag-option:hover {
  background: #e0e0e0;
}

.tag-option.selected {
  background: #007bff;
  color: #fff;
}
</style>