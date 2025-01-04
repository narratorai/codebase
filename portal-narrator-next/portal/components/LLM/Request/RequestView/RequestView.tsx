import { Spin } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { Box, Flex } from 'components/shared/jawns'
import Page from 'components/shared/Page'
import { useGetRequestQuery } from 'graph/generated'
import { RouteComponentProps } from 'react-router'
import { colors } from 'util/constants'

import ChatSection from './ChatSection'
import QuestionSection from './QuestionSection'
import RequestViewHeader, { HEADER_HEIGHT } from './RequestViewHeader'

const RequestView = ({ match }: RouteComponentProps<{ id: string }>) => {
  const company = useCompany()
  const requestId = match.params.id

  const { data: requestData, loading: requestLoading } = useGetRequestQuery({
    variables: { request_id: requestId, company_id: company.id },
  })
  const request = requestData?.training_request?.[0]
  const chatId = request?.chat?.id

  return (
    <Page title="Request | Narrator" hasSider={false}>
      <Spin spinning={requestLoading}>
        <Box style={{ height: '100vh', overflowY: 'hidden', width: '100%' }}>
          {request && <RequestViewHeader request={request} />}

          <Flex style={{ height: '100%' }} justifyContent="space-between">
            <Box
              style={{
                width: '50%',
                height: `calc(100vh - ${HEADER_HEIGHT}px)`,
                overflowY: 'hidden',
                borderRight: `1px solid ${colors.mavis_light_gray}`,
              }}
            >
              {request && <QuestionSection request={request} />}
            </Box>

            <Box
              style={{
                width: '50%',
                height: `calc(100vh - ${HEADER_HEIGHT}px)`,
                overflowY: 'auto',
                backgroundColor: colors.mavis_off_white,
              }}
            >
              {chatId && <ChatSection chatId={chatId} />}
            </Box>
          </Flex>
        </Box>
      </Spin>
    </Page>
  )
}

export default RequestView
