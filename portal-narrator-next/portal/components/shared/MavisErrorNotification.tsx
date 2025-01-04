import { App } from 'antd-next'
import { useEffect } from 'react'
import { handleMavisErrorNotification, NotificationOptProps } from 'util/useCallMavis'
import usePrevious from 'util/usePrevious'

const MavisErrorNotification = ({ error, ...notificationProps }: NotificationOptProps) => {
  const { notification } = App.useApp()

  const prevErrorMessage = usePrevious(error?.message)

  useEffect(() => {
    if (error?.message && prevErrorMessage !== error?.message) {
      handleMavisErrorNotification({ error, notification, notificationProps })
    }
  }, [prevErrorMessage, error, notificationProps, notification])

  return null
}

export default MavisErrorNotification
