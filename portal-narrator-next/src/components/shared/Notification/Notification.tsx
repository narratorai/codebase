'use client'

import { useShallow } from 'zustand/react/shallow'

import { NotificationContainer, NotificationPanel } from '@/components/primitives/Notification'
import { useNotificationsUI } from '@/stores/notifications'

const Notification = () => {
  const [notification, dismiss] = useNotificationsUI(useShallow((state) => [state.notification, state.dismiss]))

  const { description, label, status } = notification ?? { label: '' }

  return (
    <NotificationContainer>
      <NotificationPanel
        description={description}
        label={label}
        onClose={dismiss}
        open={notification !== null}
        status={status}
      />
    </NotificationContainer>
  )
}

export default Notification
