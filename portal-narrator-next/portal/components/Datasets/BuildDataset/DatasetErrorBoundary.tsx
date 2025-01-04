import { App } from 'antd-next'
import { CenteredLoader } from 'components/shared/icons/Loader'
import React, { ErrorInfo } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { reportError } from 'util/errors'

import { getLogger } from '@/util/logger'

import DatasetErrorNotification from './DatasetErrorNotification'

const logger = getLogger()

const IGNORED_ERROR_MESSAGES = [
  // ag-grid issue, remove if/when we clear this up
  // https://twist.com/a/58740/ch/261471/t/3828644/
  // https://sentry.io/organizations/narrator/issues/3637368658/
  "Cannot read properties of undefined (reading 'isVerticalScrollShowing')",
]

interface Props {
  handleCloseToolOverlay(): void
  queryDefinition: Record<string, any>
  children: React.ReactNode
}

const DatasetErrorBoundary = ({ handleCloseToolOverlay, queryDefinition, children }: Props) => {
  const { notification } = App.useApp()

  const errorHandler = (err: Error, info: ErrorInfo) => {
    logger.error({ err, componentStack: info.componentStack }, 'Dataset boundary error')
    reportError(err, null, {
      errorBoundary: 'dataset',
      queryDefinition: queryDefinition,
    })
  }

  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => {
        // For known errors we want to ignore, do not show a notification.
        // We still report to sentry in the background
        const shouldIgnore = IGNORED_ERROR_MESSAGES.includes(error.message)
        if (shouldIgnore) {
          resetErrorBoundary()
          return children
        }

        notification.error({
          key: error.message,
          placement: 'topRight',
          duration: null,
          message: <DatasetErrorNotification />,
        })

        resetErrorBoundary()

        // Render loader until the error is cleared
        return <CenteredLoader />
      }}
      onError={errorHandler}
      onReset={() => {
        // Close any dataset overlay, since that's possibly where the issue comes from
        handleCloseToolOverlay()
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

export default DatasetErrorBoundary
