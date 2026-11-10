import { toExportFile, validateExport } from '@/domain/importExport'
import { emptyData, type AppData } from '@/domain/types'

export const STORAGE_KEY = 'gift-tracker:data'

/**
 * Load saved data. Stored in the same versioned shape as an export, so the
 * import validator (and any future migration) applies to both.
 */
export function loadData(storage: Storage = localStorage): AppData {
  const text = storage.getItem(STORAGE_KEY)
  if (!text) return emptyData()
  try {
    const result = validateExport(JSON.parse(text))
    if (result.ok) return result.data
    console.error('Saved data is invalid, starting empty:', result.error)
  } catch (e) {
    console.error('Saved data could not be read, starting empty:', e)
  }
  // Keep the bad copy around rather than silently overwriting it.
  storage.setItem(`${STORAGE_KEY}:corrupt:${Date.now()}`, text)
  return emptyData()
}

export function saveData(data: AppData, storage: Storage = localStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(toExportFile(data)))
}
