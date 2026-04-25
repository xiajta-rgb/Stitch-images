import { ref } from 'vue'

interface ImageCache {
  [key: string]: {
    dataURL: string
    timestamp: number
  }
}

const cache: ImageCache = {}

const DEFAULT_CACHE_TTL = 30 * 60 * 1000

export function useImageLoader() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const loadImage = (url: string): Promise<string> => {
    return new Promise((resolve) => {
      if (url.startsWith('data:')) {
        resolve(url)
        return
      }

      const cached = cache[url]
      if (cached && Date.now() - cached.timestamp < DEFAULT_CACHE_TTL) {
        resolve(cached.dataURL)
        return
      }

      loading.value = true
      error.value = null

      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0)
            const dataURL = canvas.toDataURL('image/jpeg', 0.95)
            cache[url] = { dataURL, timestamp: Date.now() }
            resolve(dataURL)
          } else {
            resolve(url)
          }
        } catch (e) {
          console.warn('图片转换失败:', e)
          resolve(url)
        } finally {
          loading.value = false
        }
      }

      img.onerror = () => {
        error.value = '图片加载失败'
        console.warn('图片加载失败:', url)
        resolve('')
        loading.value = false
      }

      img.src = url
    })
  }

  const preloadImage = (url: string): Promise<string> => {
    return loadImage(url)
  }

  const preloadImages = (urls: string[]): Promise<string[]> => {
    return Promise.all(urls.map(url => loadImage(url)))
  }

  const clearCache = () => {
    Object.keys(cache).forEach(key => delete cache[key])
  }

  const clearCacheForUrl = (url: string) => {
    if (cache[url]) {
      delete cache[url]
    }
  }

  const isCached = (url: string): boolean => {
    return !!cache[url]
  }

  return {
    loading,
    error,
    loadImage,
    preloadImage,
    preloadImages,
    clearCache,
    clearCacheForUrl,
    isCached
  }
}