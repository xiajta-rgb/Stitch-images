import { ref, computed } from 'vue'

export function usePagination<T>(initialPageSize = 10) {
  const currentPage = ref(1)
  const pageSize = ref(initialPageSize)

  const total = ref(0)

  const totalPages = computed(() => {
    return Math.ceil(total.value / pageSize.value) || 1
  })

  const visiblePages = computed(() => {
    const pages: number[] = []
    const maxVisible = 5
    let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages.value, start + maxVisible - 1)

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  })

  const goToPage = (page: number) => {
    if (page < 1) page = 1
    if (page > totalPages.value) page = totalPages.value
    currentPage.value = page
  }

  const nextPage = () => {
    if (currentPage.value < totalPages.value) {
      currentPage.value++
    }
  }

  const prevPage = () => {
    if (currentPage.value > 1) {
      currentPage.value--
    }
  }

  const setTotal = (value: number) => {
    total.value = value
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
    }
  }

  const reset = () => {
    currentPage.value = 1
    total.value = 0
  }

  return {
    currentPage,
    pageSize,
    total,
    totalPages,
    visiblePages,
    goToPage,
    nextPage,
    prevPage,
    setTotal,
    reset
  }
}