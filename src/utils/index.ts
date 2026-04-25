export const extractFileName = (url: string): string => {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const fileName = pathname.split('/').pop() || ''
    return fileName.replace(/[?#].*/, '') || '未命名'
  } catch {
    return '未命名'
  }
}

export const truncateUrl = (url: string, maxLength = 30): string => {
  if (url.length <= maxLength) return url
  return url.substring(0, maxLength) + '...'
}

export const formatTime = (date: string | Date): string => {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const downloadDataURL = (dataURL: string, filename: string) => {
  const link = document.createElement('a')
  link.href = dataURL
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const generateUniqueId = (prefix = 'id'): string => {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`
}