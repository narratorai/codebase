const NARRATOR_ACTIVITY_STREAM_KEY = 'narrator_activity_stream'

export const getTableId = (): string | null => localStorage.getItem(NARRATOR_ACTIVITY_STREAM_KEY)

export const setTableId = (tableId: string): void => {
  localStorage.setItem(NARRATOR_ACTIVITY_STREAM_KEY, tableId)
}

export const clearTableId = (): void => {
  localStorage.removeItem(NARRATOR_ACTIVITY_STREAM_KEY)
}
