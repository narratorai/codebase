import { App, Button } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { ITrainining_Request_Status_Enum } from 'graph/generated'
import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { useHistory } from 'react-router'
import { useLazyCallMavis } from 'util/useCallMavis'

import { ViewRequest } from './interfaces'

interface Props {
  request: ViewRequest
}

const CompleteButton = ({ request }: Props) => {
  const company = useCompany()
  const { notification } = App.useApp()
  const { watch } = useFormContext()
  const formValues = watch()
  const history = useHistory()
  const path = `/${company.slug}/llms/requests`

  const [updateRequest, { loading: updateLoading, response: updateResponse }] = useLazyCallMavis<any>({
    method: 'PATCH',
    path: `/v1/llm/request/r/${request.id}`,
  })

  const handleComplete = () => {
    updateRequest({
      body: {
        ...formValues,
        status: ITrainining_Request_Status_Enum.Completed,
      },
    })
  }

  useEffect(() => {
    if (updateResponse) {
      notification.success({ message: 'Request completed' })
      history.push(path)
    }
  }, [notification, updateResponse, history, path])

  return (
    <Button onClick={handleComplete} loading={updateLoading} type="primary">
      Complete Request
    </Button>
  )
}

export default CompleteButton
