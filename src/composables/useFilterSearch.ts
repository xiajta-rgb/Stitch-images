import { ref, computed } from 'vue'

export function useFilterSearch<T extends Record<string, any>>() {
  const searchQuery = ref('')
  const selectedTags = ref<string[]>([])
  const sortField = ref<keyof T | null>(null)
  const sortOrder = ref<'asc' | 'desc'>('desc')

  const filterAndSort = (
    items: T[],
    options: {
      searchFields?: (keyof T)[]
      searchFn?: (item: T, query: string) => boolean
      tagField?: keyof T
    } = {}
  ): T[] => {
    let result = [...items]

    // Search
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      if (options.searchFn) {
        result = result.filter(item => options.searchFn!(item, query))
      } else if (options.searchFields?.length) {
        result = result.filter(item =>
          options.searchFields!.some(field => {
            const value = item[field]
            return String(value).toLowerCase().includes(query)
          })
        )
      }
    }

    // Tag filter
    if (selectedTags.value.length > 0 && options.tagField) {
      result = result.filter(item => {
        const itemTags = item[options.tagField] as string[] | undefined
        if (!itemTags) return false
        return selectedTags.value.some(tag => itemTags.includes(tag))
      })
    }

    // Sort
    if (sortField.value) {
      result.sort((a, b) => {
        const aVal = a[sortField.value!]
        const bVal = b[sortField.value!]
        const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true })
        return sortOrder.value === 'asc' ? comparison : -comparison
      })
    }

    return result
  }

  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }

  const toggleTag = (tag: string) => {
    const index = selectedTags.value.indexOf(tag)
    if (index === -1) {
      selectedTags.value.push(tag)
    } else {
      selectedTags.value.splice(index, 1)
    }
  }

  const clearTags = () => {
    selectedTags.value = []
  }

  const setSort = (field: keyof T, order?: 'asc' | 'desc') => {
    if (sortField.value === field && !order) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortField.value = field
      if (order) sortOrder.value = order
    }
  }

  const clearSort = () => {
    sortField.value = null
    sortOrder.value = 'desc'
  }

  const reset = () => {
    searchQuery.value = ''
    selectedTags.value = []
    sortField.value = null
    sortOrder.value = 'desc'
  }

  return {
    searchQuery,
    selectedTags,
    sortField,
    sortOrder,
    filterAndSort,
    setSearchQuery,
    toggleTag,
    clearTags,
    setSort,
    clearSort,
    reset
  }
}