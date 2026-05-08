<template>
  <div v-if="visible" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content template-modal">
      <div class="modal-header">
        <h3>模板管理</h3>
        <button class="close-btn" @click="closeModal">×</button>
      </div>
      <div class="template-modal-body">
        <div class="template-list">
          <div v-if="templates.length === 0" class="empty-tip">
            暂无自定义模板
          </div>
          <div v-for="template in templates" :key="template.id" class="template-item">
            <div class="template-info">
              <span class="template-name">{{ template.name }}</span>
              <span class="template-size">{{ template.width }}x{{ template.height }}</span>
              <span class="template-grid">{{ template.grid.rows }}行{{ template.grid.cols }}列</span>
            </div>
            <div class="template-actions">
              <button class="btn-apply" @click="applyTemplate(template)">应用</button>
              <button class="btn-edit" @click="editTemplate(template)">编辑</button>
              <button class="btn-delete" @click="deleteTemplateItem(template.id)">删除</button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button @click="closeModal" class="btn-action btn-cancel">关闭</button>
      </div>
    </div>
  </div>

  <!-- 编辑/新增模板弹窗 -->
  <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
    <div class="modal-content template-edit-modal">
      <div class="modal-header">
        <h3>{{ editingTemplate.id ? '编辑模板' : '新增模板' }}</h3>
        <button class="close-btn" @click="showEditModal = false">×</button>
      </div>
      <div class="template-edit-body">
        <div class="form-group">
          <label>模板名称</label>
          <input v-model="editingTemplate.name" type="text" class="form-input" placeholder="输入模板名称" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>画布宽度</label>
            <input v-model.number="editingTemplate.width" type="number" class="form-input" min="100" max="5000" />
          </div>
          <div class="form-group">
            <label>画布高度</label>
            <input v-model.number="editingTemplate.height" type="number" class="form-input" min="100" max="5000" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>行数</label>
            <input v-model.number="editingTemplate.grid.rows" type="number" class="form-input" min="1" max="20" />
          </div>
          <div class="form-group">
            <label>列数</label>
            <input v-model.number="editingTemplate.grid.cols" type="number" class="form-input" min="1" max="20" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>宫格间距 (px)</label>
            <input v-model.number="editingTemplate.grid.gap" type="number" class="form-input" min="0" max="100" />
          </div>
          <div class="form-group">
            <label>边缘间距 (px)</label>
            <input v-model.number="editingTemplate.grid.margin" type="number" class="form-input" min="0" max="200" />
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button @click="showEditModal = false" class="btn-action btn-cancel">取消</button>
        <button @click="saveTemplate" class="btn-action btn-primary" :disabled="!editingTemplate.name">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTemplateManager, type PuzzleTemplate } from '../composables/useTemplateManager'

const emit = defineEmits<{
  (e: 'apply', template: PuzzleTemplate): void
  (e: 'close'): void
  (e: 'delete', name: string): void
}>()

const { templates, addTemplate, updateTemplate, deleteTemplate } = useTemplateManager()

const visible = ref(false)
const showEditModal = ref(false)
const editingTemplate = ref<PuzzleTemplate>({
  id: '',
  name: '',
  width: 600,
  height: 600,
  grid: { rows: 2, cols: 2, gap: 20, margin: 20 },
  createdAt: 0
})

const open = () => {
  visible.value = true
}

const closeModal = () => {
  visible.value = false
  emit('close')
}

const applyTemplate = (template: PuzzleTemplate) => {
  emit('apply', template)
  closeModal()
}

const editTemplate = (template: PuzzleTemplate) => {
  editingTemplate.value = { ...template, grid: { ...template.grid } }
  showEditModal.value = true
}

const deleteTemplateItem = (id: string) => {
  const template = templates.value.find(t => t.id === id)
  const name = template?.name || ''
  deleteTemplate(id)
  emit('delete', name)
}

const saveTemplate = () => {
  if (!editingTemplate.value.name) return
  
  if (editingTemplate.value.id) {
    updateTemplate(editingTemplate.value.id, {
      name: editingTemplate.value.name,
      width: editingTemplate.value.width,
      height: editingTemplate.value.height,
      grid: { ...editingTemplate.value.grid }
    })
  } else {
    addTemplate({
      name: editingTemplate.value.name,
      width: editingTemplate.value.width,
      height: editingTemplate.value.height,
      grid: { ...editingTemplate.value.grid }
    })
  }
  
  showEditModal.value = false
}

defineExpose({ open })
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: #fff;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.template-modal {
  max-width: 700px;
}

.template-edit-modal {
  max-width: 500px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: #333;
}

.template-modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.template-edit-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  font-size: 14px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #3366ff;
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-tip {
  text-align: center;
  color: #999;
  padding: 40px 0;
}

.template-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f8f8;
  border-radius: 8px;
  border: 1px solid #eee;
}

.template-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.template-name {
  font-weight: 500;
  font-size: 14px;
}

.template-size,
.template-grid {
  font-size: 12px;
  color: #666;
  background: #e8e8e8;
  padding: 2px 8px;
  border-radius: 4px;
}

.template-actions {
  display: flex;
  gap: 8px;
}

.btn-apply,
.btn-edit,
.btn-delete {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-apply {
  background: #3366ff;
  color: white;
}

.btn-apply:hover {
  background: #254edb;
}

.btn-edit {
  background: #f0f0f0;
  color: #666;
}

.btn-edit:hover {
  background: #e0e0e0;
}

.btn-delete {
  background: #ff4d4f;
  color: white;
}

.btn-delete:hover {
  background: #d9363e;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.btn-action {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f0f0f0;
  color: #666;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-primary {
  background: #3366ff;
  color: white;
}

.btn-primary:hover {
  background: #254edb;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
