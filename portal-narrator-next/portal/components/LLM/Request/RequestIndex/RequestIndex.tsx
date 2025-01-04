import { Spin } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { REQUEST_CONTENT_Z_INDEX, REQUEST_INDEX_TOP_BAR_HEIGHT } from 'components/LLM/Request/constants'
import { Box } from 'components/shared/jawns'
import { LayoutContent } from 'components/shared/layout/LayoutWithFixedSider'
import Page from 'components/shared/Page'
import { ITrainining_Request_Status_Enum, useListRequestsQuery } from 'graph/generated'
import { filter } from 'lodash'
import { useState } from 'react'
import { useHistory } from 'react-router'
import { colors } from 'util/constants'
import useToggle from 'util/useToggle'

import AssignModal from '../Assign/AssignModal'
import { VisibleRequestTypes } from '../interfaces'
import NoOutstandingRequests from './NoOutstandingRequests'
import RequestIndexTopBar from './RequestIndexTopBar'
import RequestsTable from './RequestsTable'
import RequestTypeSelector from './RequestTypeSelector'

const useRequestIndex = () => {
  const company = useCompany()
  const history = useHistory()
  const { companyUser } = useUser()

  // Show assign modal logic
  const [showAssignModal, handleToggleAssignModal] = useToggle(false)

  // Request type selector logic
  const [visibleRequestType, handleOnChangeSelectedStatus] = useState<VisibleRequestTypes>(
    VisibleRequestTypes.MyOutstanding
  )

  // Fetch requests
  const {
    data: requestsData,
    loading: requestsLoading,
    refetch: refetchRequests,
  } = useListRequestsQuery({
    variables: { company_id: company.id },
  })

  const requests = requestsData?.training_request || []
  const visibleRequests = filter(requests, (request) => {
    if (visibleRequestType === VisibleRequestTypes.All) {
      return true
    }
    if (visibleRequestType === VisibleRequestTypes.MyOutstanding) {
      return (
        request.status === ITrainining_Request_Status_Enum.New &&
        request.assignee?.company_users?.[0]?.id === companyUser?.id
      )
    }
    if (visibleRequestType === VisibleRequestTypes.Outstanding) {
      return request.status === ITrainining_Request_Status_Enum.New
    }
    return false
  })

  const handleGoToEditPage = (id: string) => {
    history.push(`/${company.slug}/llms/requests/edit/${id}`)
  }

  const showNoOutstandingRequests =
    (visibleRequestType === VisibleRequestTypes.Outstanding ||
      visibleRequestType === VisibleRequestTypes.MyOutstanding) &&
    visibleRequests.length === 0

  return {
    showAssignModal,
    handleToggleAssignModal,
    visibleRequestType,
    handleOnChangeSelectedStatus,
    requests,
    visibleRequests,
    requestsLoading,
    refetchRequests,
    handleGoToEditPage,
    showNoOutstandingRequests,
  }
}

const RequestIndex = () => {
  const {
    showAssignModal,
    handleToggleAssignModal,
    visibleRequestType,
    handleOnChangeSelectedStatus,
    requests,
    visibleRequests,
    requestsLoading,
    refetchRequests,
    handleGoToEditPage,
    showNoOutstandingRequests,
  } = useRequestIndex()

  return (
    <Page title="LLM Requests | Narrator" hasSider={false} style={{ height: '100vh', overflowY: 'hidden' }}>
      <LayoutContent
        siderWidth={0}
        style={{
          width: '100%',
          marginLeft: 0,
          height: '100%',
          overflowY: 'hidden',
          padding: '32px',
          paddingTop: '16px',
        }}
      >
        <RequestIndexTopBar toggleAssignModal={handleToggleAssignModal} />

        <Box
          style={{
            position: 'sticky',
            top: REQUEST_INDEX_TOP_BAR_HEIGHT,
            height: `calc(100vh - 32px - ${REQUEST_INDEX_TOP_BAR_HEIGHT}px)`,
            overflowY: 'auto',
            zIndex: REQUEST_CONTENT_Z_INDEX,
            borderRadius: '16px',
            border: `1px solid ${colors.mavis_light_gray}`,
          }}
          pb="80px" // extra padding to escape Help Scout icon
        >
          <Box style={{ padding: '16px' }}>
            <RequestTypeSelector
              selectedType={visibleRequestType}
              onChange={handleOnChangeSelectedStatus}
              requests={requests}
            />
          </Box>

          {showNoOutstandingRequests && <NoOutstandingRequests />}

          {!showNoOutstandingRequests && (
            <Spin spinning={requestsLoading}>
              <RequestsTable
                requests={visibleRequests}
                visibleRequestType={visibleRequestType}
                handleRowClick={handleGoToEditPage}
                // remount table when visibleRequestType changes
                // to show correct columns
                key={visibleRequestType}
                refetchRequests={refetchRequests}
              />
            </Spin>
          )}

          {showAssignModal && <AssignModal onClose={handleToggleAssignModal} />}
        </Box>
      </LayoutContent>
    </Page>
  )
}

export default RequestIndex
