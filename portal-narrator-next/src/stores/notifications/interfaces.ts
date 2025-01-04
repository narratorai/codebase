export type Status = 'success' | 'info' | 'warning' | 'error'

export interface INotification {
  description?: string
  expire?: number
  label: string
  status?: Status
}

export interface ILiveNotification extends INotification {
  timeoutID?: NodeJS.Timeout
}

export interface INotificationsUI {
  /** Clear the queue*/
  clear: () => void

  /** Dismiss the oldest notification from the queue */
  dismiss: () => void

  /** The current notification */
  notification: ILiveNotification | null

  /** Notifications queue */
  notifications: INotification[]

  /** Show the oldest notification in the queue */
  showNext: () => void

  /** Submit new notification to the queue */
  submit: (notification: INotification) => void
}
