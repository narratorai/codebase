import { Button } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { useListOutstandingAssignedRequestsQuery } from 'graph/generated'
import { indexOf, isEmpty, isFinite } from 'lodash'
import { useState } from 'react'
import { useHistory } from 'react-router'

interface Props {
  requestId: string
}

const NextRequestButton = ({ requestId }: Props) => {
  const company = useCompany()
  const { companyUser } = useUser()
  const history = useHistory()
  const [viewedId, setViewedId] = useState(requestId)

  const { data: assignedRequestsData } = useListOutstandingAssignedRequestsQuery({
    variables: { company_id: company.id, company_user_id: companyUser?.id },
  })

  const availableRequestIds = assignedRequestsData?.training_request?.map((request) => request.id) || []
  const totalRequests = availableRequestIds?.length || 0

  const handleClick = () => {
    const currentIndex = indexOf(availableRequestIds, viewedId)

    if (!isFinite(totalRequests) || isEmpty(availableRequestIds)) {
      return
    }

    // if you are at the end of available requests
    if (totalRequests && currentIndex === totalRequests - 1) {
      // go back to the first request available
      const firstAvailableRequestId = availableRequestIds[0]
      history.push(`/${company.slug}/llms/requests/edit/${firstAvailableRequestId}`)
      // set the viewed id to the first request
      return setViewedId(firstAvailableRequestId)
    }

    // otherwise go to the next request
    const nextId = availableRequestIds[currentIndex + 1]
    history.push(`/${company.slug}/llms/requests/edit/${nextId}`)
    setViewedId(nextId)
  }

  if (isEmpty(availableRequestIds) || totalRequests < 2) return null

  return <Button onClick={handleClick}>Next Request</Button>
}

export default NextRequestButton
