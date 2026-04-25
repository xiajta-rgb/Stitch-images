import { ref, computed } from 'vue'

export interface GridConfig {
  rows: number
  cols: number
  gap?: number
  margin?: number
}

export function useGridConfig(initialConfig: GridConfig = { rows: 2, cols: 2 }) {
  const gridLineWidth = ref(1.5)
  const gridGap = ref(initialConfig.gap ?? 20)
  const gridMargin = ref(initialConfig.margin ?? 20)
  const noGap = ref(false)

  const gridConfig = ref<GridConfig>({
    rows: initialConfig.rows,
    cols: initialConfig.cols,
    gap: gridGap.value,
    margin: gridMargin.value
  })

  const effectiveGap = computed(() => noGap.value ? 0 : gridGap.value)
  const effectiveMargin = computed(() => noGap.value ? 0 : gridMargin.value)

  const cellDimensions = computed(() => {
    return (canvasWidth: number, canvasHeight: number) => {
      const rows = gridConfig.value.rows
      const cols = gridConfig.value.cols
      const gap = effectiveGap.value
      const margin = effectiveMargin.value

      const totalGapWidth = (cols - 1) * gap
      const totalGapHeight = (rows - 1) * gap
      const availableWidth = canvasWidth - 2 * margin
      const availableHeight = canvasHeight - 2 * margin

      return {
        cellWidth: (availableWidth - totalGapWidth) / cols,
        cellHeight: (availableHeight - totalGapHeight) / rows,
        gap,
        margin
      }
    }
  })

  const updateGridLineWidth = (width: number) => {
    gridLineWidth.value = width
  }

  const updateGridGap = (gap: number) => {
    gridGap.value = gap
    gridConfig.value.gap = gap
  }

  const updateGridMargin = (margin: number) => {
    gridMargin.value = margin
    gridConfig.value.margin = margin
  }

  const toggleNoGap = (enabled: boolean) => {
    noGap.value = enabled
  }

  const setGridConfig = (config: GridConfig) => {
    gridConfig.value.rows = config.rows
    gridConfig.value.cols = config.cols
    if (config.gap !== undefined) {
      gridGap.value = config.gap
      gridConfig.value.gap = config.gap
    }
    if (config.margin !== undefined) {
      gridMargin.value = config.margin
      gridConfig.value.margin = config.margin
    }
  }

  return {
    gridLineWidth,
    gridGap,
    gridMargin,
    noGap,
    gridConfig,
    effectiveGap,
    effectiveMargin,
    cellDimensions,
    updateGridLineWidth,
    updateGridGap,
    updateGridMargin,
    toggleNoGap,
    setGridConfig
  }
}