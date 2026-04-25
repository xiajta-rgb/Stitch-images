import { ref } from 'vue'

export interface PreviewRecord {
  id: string
  dataURL: string
  timestamp: Date
}

export function usePreviewRecords() {
  const previewRecords = ref<PreviewRecord[]>([])

  const generateUniqueId = () => {
    return `preview_${Date.now()}_${Math.floor(Math.random() * 1000)}`
  }

  const addPreviewRecord = (dataURL: string) => {
    const record: PreviewRecord = {
      id: generateUniqueId(),
      dataURL,
      timestamp: new Date()
    }
    previewRecords.value.unshift(record)
    return record
  }

  const removePreviewRecord = (id: string) => {
    const index = previewRecords.value.findIndex(r => r.id === id)
    if (index !== -1) {
      previewRecords.value.splice(index, 1)
    }
  }

  const clearPreviewRecords = () => {
    previewRecords.value = []
  }

  const downloadImage = (dataURL: string, filename: string) => {
    const link = document.createElement('a')
    link.href = dataURL
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return {
    previewRecords,
    generateUniqueId,
    addPreviewRecord,
    removePreviewRecord,
    clearPreviewRecords,
    downloadImage
  }
}