import { Button, Space } from 'antd-next'
import SimpleTimer from 'components/shared/SimpleTimer'
import React from 'react'
import { IRequestApiData } from 'util/datasets/interfaces'

interface Props extends IRequestApiData {
  label?: string
  onCancel?: any
  showCancel?: boolean
}

const RunningTimer = ({
  label,
  onCancel,
  canceled = false,
  showCancel = true,
  loaded,
  loading,
  requestCompletedAt,
  requestStartedAt,
}: Props) => {
  const notRunYet = !loading && !loaded && !canceled
  let title = null

  if (label) {
    title = canceled ? `Canceled ${label} request` : loading ? `Running ${label}` : `Completed ${label} in`
  }

  return (
    <Space>
      <div>
        {title}
        {!canceled && (
          <SimpleTimer requestStartedAt={requestStartedAt} requestCompletedAt={requestCompletedAt}>
            {(displayTime: string) => ` ${displayTime} seconds`}
          </SimpleTimer>
        )}
      </div>
      {showCancel && !notRunYet && loading && (
        <Button onClick={onCancel} type="link" size="small">
          cancel
        </Button>
      )}
    </Space>
  )
}

export default RunningTimer
