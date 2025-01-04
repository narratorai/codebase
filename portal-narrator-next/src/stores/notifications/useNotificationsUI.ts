import { produce } from 'immer'
import { create } from 'zustand'

import { INotificationsUI } from './interfaces'

const initialState = {
  notification: null,
  notifications: [],
}

/**
 * A store for managing the Notifications UI.
 */
const useNotificationsUI = create<INotificationsUI>((set, get) => ({
  ...initialState,

  clear() {
    set(initialState)
  },

  showNext() {
    const { dismiss } = get()
    set(
      produce((state: INotificationsUI) => {
        if (state.notification !== null) return
        const notification = state.notifications.shift()
        if (notification === undefined) return

        let timeoutID: NodeJS.Timeout | undefined
        if (notification.expire !== undefined) timeoutID = setTimeout(dismiss, notification.expire)
        state.notification = { ...notification, timeoutID }
      })
    )
  },

  submit(notification) {
    const { showNext } = get()
    set(
      produce((state: INotificationsUI) => {
        state.notifications.push(notification)
      })
    )
    showNext()
  },

  dismiss() {
    const { showNext, notification } = get()

    if (notification === null) return

    clearTimeout(notification.timeoutID)

    set(
      produce((state: INotificationsUI) => {
        state.notification = null
      })
    )

    showNext()
  },
}))

export default useNotificationsUI
