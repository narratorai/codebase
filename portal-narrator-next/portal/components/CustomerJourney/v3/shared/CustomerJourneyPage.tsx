import { ArrowLeftOutlined } from '@ant-design/icons'
import { Col, Flex, Layout, Row } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { Link } from 'components/shared/jawns'
import { LAYOUT_CONTENT_PADDING } from 'components/shared/layout/LayoutWithFixedSider'
import { find, omit } from 'lodash'
import { generatePath, RouteChildrenProps, useHistory } from 'react-router'
import styled from 'styled-components'
import { colors } from 'util/constants'

import CustomerTimeLine from '../CustomerTimeline/CustomerTimeLine'
import CustomerJourneyDashboard from '../Dashboard/CustomerJourneyDashboard'
import ActivityStreamSelect from '../shared/ActivityStreamSelect'
import CustomerSearchSelect from './CustomerSearchSelect'

const BackIcon = styled(Link)`
  color: ${colors.mavis_dark_gray};
  margin-right: 8px;

  svg: {
    transition: font-size 300ms ease-in-out;
    font-size: 12px;
  }

  &:hover {
    svg {
      font-size: 16px;
    }
  }
`

type RouterProps = RouteChildrenProps<{ table: string; customer?: string }>

const CustomerJourneyPage = ({ match }: RouterProps) => {
  const company = useCompany()
  const history = useHistory()

  const selectedActivityStream = match?.params?.table
  const companyTables = company?.tables || []
  // TODO: handle case where table is not found
  const tableId = find(companyTables, ['activity_stream', selectedActivityStream])?.id as string

  const selectedCustomer = decodeURIComponent(match?.params?.customer || '') || undefined

  const handleSelectActivityStream = (activityStream: string) => {
    if (match?.params) {
      // omit the customer param when switching activity streams
      const paramsWithoutCustomer = omit({ ...match.params }, 'customer')

      // update activity stream to url param
      const newPath = generatePath(match.path, {
        ...paramsWithoutCustomer,
        table: activityStream,
      })

      history.push(newPath)
    }
  }

  const handleSelectCustomer = (customerEmail: string) => {
    if (match) {
      // update activity stream to url param
      const newPath = generatePath(match.path, {
        ...match?.params,
        customer: encodeURIComponent(customerEmail),
      })

      history.push(newPath)
    }
  }

  const showDashboard = !selectedCustomer
  const showTimeline = selectedActivityStream && selectedCustomer

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden', backgroundColor: colors.mavis_off_white }}>
      <Row style={{ borderBottom: `1px solid ${colors.mavis_darker_gray}`, padding: LAYOUT_CONTENT_PADDING }}>
        <Col span={6}>
          <Flex align="center" style={{ width: showTimeline ? '174px' : '160px' }}>
            {showTimeline && (
              <BackIcon to="/customer_journey">
                <ArrowLeftOutlined />
              </BackIcon>
            )}
            <ActivityStreamSelect
              value={selectedActivityStream}
              onChange={handleSelectActivityStream}
              tableId={tableId}
            />
          </Flex>
        </Col>

        {/* unmount the search any time the activity stream changes
            this will force the endpoint to update with the correct tableId
        */}
        <Col span={12} key={selectedActivityStream}>
          <CustomerSearchSelect
            activityStream={selectedActivityStream as string}
            customerFromUrl={selectedCustomer}
            onSelectCustomer={handleSelectCustomer}
          />
        </Col>
      </Row>

      {showDashboard && <CustomerJourneyDashboard onSelectCustomer={handleSelectCustomer} tableId={tableId} />}
      {showTimeline && <CustomerTimeLine tableId={tableId} customerEmail={selectedCustomer} />}
    </Layout>
  )
}

export default CustomerJourneyPage
