import { ref } from 'vue'
import type { GalleryImage } from '../types'
import api from '../services/api'

export function useGallery() {
  const records = ref<GalleryImage[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const loadGallery = async () => {
    loading.value = true
    error.value = null
    try {
      const data = await api.getGallery()
      records.value = data
    } catch (e) {
      error.value = '加载数据失败'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  const addRecord = async (record: Omit<GalleryImage, 'id' | 'timestamp'>) => {
    try {
      const newRecord = await api.addGallery(record)
      records.value.unshift(newRecord)
      return newRecord
    } catch (e) {
      error.value = '添加记录失败'
      throw e
    }
  }

  const updateRecord = async (id: string, data: Partial<GalleryImage>) => {
    try {
      const updated = await api.updateGallery(id, data)
      const index = records.value.findIndex(r => r.id === id)
      if (index !== -1) {
        records.value[index] = updated
      }
      return updated
    } catch (e) {
      error.value = '更新记录失败'
      throw e
    }
  }

  const deleteRecord = async (id: string) => {
    try {
      await api.deleteGallery(id)
      records.value = records.value.filter(r => r.id !== id)
    } catch (e) {
      error.value = '删除记录失败'
      throw e
    }
  }

  const batchDelete = async (ids: string[]) => {
    try {
      await api.batchDeleteGallery(ids)
      records.value = records.value.filter(r => !ids.includes(r.id))
    } catch (e) {
      error.value = '批量删除失败'
      throw e
    }
  }

  return {
    records,
    loading,
    error,
    loadGallery,
    addRecord,
    updateRecord,
    deleteRecord,
    batchDelete
  }
}