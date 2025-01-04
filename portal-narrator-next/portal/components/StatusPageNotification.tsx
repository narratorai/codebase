import { Alert } from 'antd-next'
import { AlertProps } from 'antd-next/es/alert'
import { Typography } from 'components/shared/jawns'
import { isEqual } from 'lodash'
import React, { useEffect, useState } from 'react'
import { STATUS_PAGE_BANNER_Z_INDEX } from 'util/constants'
import usePrevious from 'util/usePrevious'

import { isNonProd } from '@/util/env'

interface IStatusResponse {
  page: {
    id: string
    name: string
    time_zone: string
    updated_at: string
    url: string
  }
  status: {
    description: string
    // we don't show 'minor' events but they exist
    indicator: 'none' | 'maintenance' | 'minor' | 'major'
  }
}

interface Props {
  initializeWithStatus?: boolean
}

const StatusPageNotification = ({ initializeWithStatus = false }: Props) => {
  const [statusResponse, setStatusResponse] = useState<IStatusResponse>()
  const status = statusResponse?.status
  const prevStatus = usePrevious(status)

  const [showResolved, setShowResolved] = useState(false)
  const [showIncident, setShowIncident] = useState(false)

  const getStatus = async () => {
    const statusPageUrl = isNonProd ? 'https://narratortest.statuspage.io' : 'https://www.narratorstatus.com'

    try {
      const response = await fetch(`${statusPageUrl}/api/v2/status.json`, {
        method: 'GET',
      })

      if (response.ok) {
        const resp = await response.json()
        setStatusResponse(resp)
      }
    } catch {
      // if the status page fails we don't need to report it
    }
  }

  useEffect(() => {
    if (initializeWithStatus) {
      getStatus()
    }
  }, [initializeWithStatus])

  // Poll for status
  useEffect(() => {
    // every 2 minutes
    const pollStatus = setInterval(getStatus, 1000 * 60 * 2)

    return () => {
      clearInterval(pollStatus)
    }
  }, [])

  // set incident banner if 'major' or 'maintenance'
  useEffect(() => {
    const statusHasChanged = !isEqual(prevStatus?.indicator, status?.indicator)
    if (statusHasChanged && (status?.indicator === 'major' || status?.indicator === 'maintenance')) {
      setShowIncident(true)
    }
  }, [prevStatus, status])

  useEffect(() => {
    // show resolved banner if it was 'major' or 'maintenance' before
    const wasIncident = prevStatus?.indicator === 'major' || prevStatus?.indicator === 'maintenance'

    // and no longer an incident
    if (wasIncident && status?.indicator === 'none') {
      setShowResolved(true)
    }
  }, [prevStatus, status])

  const handleClose = () => {
    setShowResolved(false)
    setShowIncident(false)
  }

  // if there is no incident
  // nor resolution of an incident
  // don't show any banner
  if (!showIncident && !showResolved) {
    return null
  }

  // set color/icon based on status indicator
  let alertType = 'error'
  if (status?.indicator === 'maintenance') {
    alertType = 'warning'
  }
  if (status?.indicator === 'none') {
    alertType = 'success'
  }

  return (
    <Alert
      message={
        <Typography>
          {status?.description} -{' '}
          <a href={statusResponse?.page?.url} target="_blank" rel="noopener noreferrer">
            View Status Page
          </a>{' '}
        </Typography>
      }
      type={alertType as AlertProps['type']}
      showIcon
      closable
      onClose={handleClose}
      style={{ position: 'absolute', top: 0, width: '100%', zIndex: STATUS_PAGE_BANNER_Z_INDEX }}
    />
  )
}

export default StatusPageNotification
