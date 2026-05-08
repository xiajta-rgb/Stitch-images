import { useLocalStorage } from './useLocalStorage'

export interface PuzzleTemplate {
  id: string
  name: string
  width: number
  height: number
  grid: {
    rows: number
    cols: number
    gap: number
    margin: number
  }
  gridLineWidth?: number
  backgroundColor?: string
  createdAt: number
}

const STORAGE_KEY = 'puzzle-templates'

let sharedTemplates: ReturnType<typeof useLocalStorage<PuzzleTemplate[]>> | null = null

function getSharedTemplates() {
  if (!sharedTemplates) {
    sharedTemplates = useLocalStorage<PuzzleTemplate[]>(STORAGE_KEY, [])
  }
  return sharedTemplates
}

export function useTemplateManager() {
  const { data: templates, remove: clearTemplates } = getSharedTemplates()

  const addTemplate = (template: Omit<PuzzleTemplate, 'id' | 'createdAt'>) => {
    const newTemplate: PuzzleTemplate = {
      ...template,
      id: `custom-${Date.now()}`,
      createdAt: Date.now()
    }
    templates.value.push(newTemplate)
    return newTemplate
  }

  const updateTemplate = (id: string, updates: Partial<PuzzleTemplate>) => {
    const index = templates.value.findIndex(t => t.id === id)
    if (index !== -1) {
      templates.value[index] = { ...templates.value[index], ...updates }
    }
  }

  const deleteTemplate = (id: string) => {
    templates.value = templates.value.filter(t => t.id !== id)
  }

  const getTemplate = (id: string): PuzzleTemplate | undefined => {
    return templates.value.find(t => t.id === id)
  }

  return {
    templates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplate,
    clearTemplates
  }
}
