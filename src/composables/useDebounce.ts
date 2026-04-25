import { ref, watch } from 'vue'
import type { Ref } from 'vue'

export function useDebounce<T>(value: Ref<T>, delay = 300) {
  const debouncedValue = ref<T>(value.value) as typeof ref<T>
  let timeout: ReturnType<typeof setTimeout>

  watch(value, (newValue) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      debouncedValue.value = newValue
    }, delay)
  })

  const cancel = () => {
    clearTimeout(timeout)
  }

  return {
    debouncedValue,
    cancel
  }
}

export function useDebounceFn<T extends (...args: any[]) => any>(fn: T, delay = 300) {
  let timeout: ReturnType<typeof setTimeout>

  const debouncedFn = (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      fn(...args)
    }, delay)
  }

  const cancel = () => {
    clearTimeout(timeout)
  }

  return {
    debouncedFn,
    cancel
  }
}