import { ref } from 'vue'
import type { ToastType } from '../types'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

const toasts = ref<ToastItem[]>([])
let toastId = 0

export function useToast() {
  const show = (message: string, type: ToastType = 'info') => {
    const id = ++toastId
    toasts.value.push({ id, message, type })

    setTimeout(() => {
      remove(id)
    }, 3000)

    return id
  }

  const remove = (id: number) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  const success = (message: string) => show(message, 'success')
  const error = (message: string) => show(message, 'error')
  const warning = (message: string) => show(message, 'warning')
  const info = (message: string) => show(message, 'info')

  return {
    toasts,
    show,
    remove,
    success,
    error,
    warning,
    info
  }
}