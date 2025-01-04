import { App, Button } from 'antd-next'
import { ITrainining_Request_Status_Enum } from 'graph/generated'
import { useEffect } from 'react'
import { useLazyCallMavis } from 'util/useCallMavis'

import { ViewRequest } from './interfaces'

interface Props {
  request: ViewRequest
}

const SkipButton = ({ request }: Props) => {
  const { notification } = App.useApp()

  const [updateRequest, { loading: updateLoading, response: updateResponse }] = useLazyCallMavis<any>({
    method: 'PATCH',
    path: `/v1/llm/request/r/${request.id}`,
  })

  const handleSkip = () => {
    updateRequest({
      body: {
        status: ITrainining_Request_Status_Enum.Skipped,
      },
    })
  }

  useEffect(() => {
    if (updateResponse) {
      notification.success({ message: 'Request skipped' })
    }
  }, [notification, updateResponse])

  return (
    <Button onClick={handleSkip} loading={updateLoading}>
      Skip
    </Button>
  )
}

export default SkipButton
