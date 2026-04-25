import { ref } from 'vue'

export interface ImageState {
  dataURL: string
  x: number
  y: number
  scale: number
  rotation: number
  width: number
  height: number
}

export function useImageProcessor() {
  const cellImages = ref<(ImageState | null)[][]>([])

  const loadImageAsDataURL = (url: string): Promise<string> => {
    return new Promise((resolve) => {
      if (url.startsWith('data:')) {
        resolve(url)
        return
      }

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
            resolve(canvas.toDataURL('image/jpeg', 0.95))
          } else {
            resolve(url)
          }
        } catch (e) {
          console.warn('图片转换失败，使用原URL:', e)
          resolve(url)
        }
      }
      img.onerror = () => {
        console.warn('图片加载失败，该图片无法访问:', url)
        resolve('')
      }
      img.src = url
    })
  }

  const getImageState = (row: number, col: number): ImageState | null => {
    return cellImages.value[row]?.[col] ?? null
  }

  const setImageState = (row: number, col: number, state: ImageState | null) => {
    while (cellImages.value.length <= row) {
      cellImages.value.push([])
    }
    cellImages.value[row][col] = state
  }

  const clearImageState = (row: number, col: number) => {
    if (cellImages.value[row]?.[col]) {
      cellImages.value[row][col] = null
    }
  }

  const clearAllImages = () => {
    cellImages.value = []
  }

  const drawImageWithState = (
    cellCanvas: HTMLCanvasElement,
    imageState: ImageState
  ) => {
    const cellCtx = cellCanvas.getContext('2d')
    if (!cellCtx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      cellCtx.clearRect(0, 0, cellCanvas.width, cellCanvas.height)

      const drawWidth = imageState.width * imageState.scale
      const drawHeight = imageState.height * imageState.scale
      const centerX = cellCanvas.width / 2
      const centerY = cellCanvas.height / 2

      cellCtx.save()
      cellCtx.translate(centerX, centerY)
      cellCtx.rotate(imageState.rotation * Math.PI / 180)
      cellCtx.drawImage(
        img,
        -drawWidth / 2 + imageState.x,
        -drawHeight / 2 + imageState.y,
        drawWidth,
        drawHeight
      )
      cellCtx.restore()
    }
    img.src = imageState.dataURL
  }

  const updateImageTransform = (
    row: number,
    col: number,
    updates: Partial<ImageState>
  ) => {
    const current = cellImages.value[row]?.[col]
    if (current) {
      Object.assign(current, updates)
    }
  }

  return {
    cellImages,
    loadImageAsDataURL,
    getImageState,
    setImageState,
    clearImageState,
    clearAllImages,
    drawImageWithState,
    updateImageTransform
  }
}