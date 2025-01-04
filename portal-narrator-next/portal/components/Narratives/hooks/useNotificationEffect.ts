import { App } from 'antd-next'
import { NotificationInstance } from 'antd-next/es/notification/interface'
import _ from 'lodash'
import { useEffect } from 'react'
import { handleMavisErrorNotification, MavisError } from 'util/useCallMavis'
import usePrevious from 'util/usePrevious'

interface IUseNotificationParams {
  errorLoading?: MavisError
  errorAssembling?: MavisError
  errorAssemblingFields?: MavisError
  errorAutocomplete?: MavisError
  errorSaving?: MavisError
  narrativeSlug?: string
}

interface IErrorNotification {
  error?: MavisError
  prevError?: MavisError
  notification: NotificationInstance
}

const errorNotification = ({ error, prevError, notification }: IErrorNotification) => {
  if (error && !_.isEqual(prevError, error)) {
    handleMavisErrorNotification({ error, notification })
  }
}

export default function useNotificationEffect({
  errorLoading,
  errorAssembling,
  errorAssemblingFields,
  errorAutocomplete,
  errorSaving,
  narrativeSlug,
}: IUseNotificationParams): void {
  const { notification } = App.useApp()
  const prevErrorLoading = usePrevious(errorLoading)
  const prevErrorSaving = usePrevious(errorSaving)
  const prevErrorAssembling = usePrevious(errorAssembling)
  const prevErrorAssemblingFields = usePrevious(errorAssemblingFields)
  const prevErrorAutocomplete = usePrevious(errorAutocomplete)

  useEffect(() => {
    // Error Notifications!
    errorNotification({
      error: errorSaving,
      prevError: prevErrorSaving,
      notification,
    })

    errorNotification({
      error: errorAssembling,
      prevError: prevErrorAssembling,
      notification,
    })

    errorNotification({
      error: errorAssemblingFields,
      prevError: prevErrorAssemblingFields,
      notification,
    })

    errorNotification({
      error: errorLoading,
      prevError: prevErrorLoading,
      notification,
    })

    errorNotification({
      error: errorAutocomplete,
      prevError: prevErrorAutocomplete,
      notification,
    })
  }, [
    narrativeSlug,
    prevErrorLoading,
    prevErrorSaving,
    prevErrorAssembling,
    prevErrorAssemblingFields,
    prevErrorAutocomplete,
    errorLoading,
    errorSaving,
    errorAssembling,
    errorAssemblingFields,
    errorAutocomplete,
    notification,
  ])
}
