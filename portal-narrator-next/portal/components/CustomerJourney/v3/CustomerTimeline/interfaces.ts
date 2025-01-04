export interface TimelineEvent {
  id: string
  activity: string
  attributes: { name: string; value: string }[]
  occurrence: number
  revenue: number | null
  link: string | null
  ts: string
  // above it returned from API
  // below is added by FE (meta data)
  repeatedEventParentId?: string
  repeatedEventIds?: string[]
  isTimeDifference?: boolean
  startTime?: string
  endTime?: string
}

export interface TimelineEventsReponse {
  events: TimelineEvent[]
  is_done: boolean
}
