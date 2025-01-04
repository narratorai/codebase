import { Button, Result, Spin } from 'antd-next'
import { Box } from 'components/shared/jawns'
import React, { useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { useLocation } from 'react-router'
import { openChat } from 'util/chat'
import { reportError } from 'util/errors'

const chunkFailedMessage = /Loading chunk [\d]+ failed/

interface Props {
  children: React.ReactNode
}

const ErrorBoundaryWrapper = ({ children }: Props) => {
  const location = useLocation()
  const [eventId, setEventId] = useState<string>()

  return (
    <ErrorBoundary
      onError={(error, info) => {
        const eventId = reportError('Something Went Wrong', error, { errorBoundary: 'portal', ...info })

        // Special case for ChunkLoadErrors: refresh the page
        if (error?.message && chunkFailedMessage.test(error.message)) {
          window.location.reload()
        }

        setEventId(eventId)
      }}
      fallbackRender={() => {
        return (
          <Box style={{ height: '100vh', background: 'white' }}>
            <Spin spinning={!eventId}>
              <Result
                status="error"
                title="Something Went Wrong"
                subTitle={
                  <div>
                    Apologies for the error. Our team has been notified. <br />
                    Feel free to report feedback if you have feedback or would like to provide more details about what
                    went wrong.
                  </div>
                }
                extra={
                  <Button onClick={() => openChat()} type="primary">
                    Report Feedback
                  </Button>
                }
              />
            </Spin>
          </Box>
        )
      }}
      resetKeys={[location.pathname]}
      onReset={() => setEventId(undefined)}
    >
      {children}
    </ErrorBoundary>
  )
}

export default ErrorBoundaryWrapper
