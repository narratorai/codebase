import { Flex } from 'antd-next'
import { LAYOUT_CONTENT_PADDING } from 'components/shared/layout/LayoutWithFixedSider'
import styled from 'styled-components'
import { colors } from 'util/constants'

import CustomerAttributes from './CustomerAttributes'
import EventTimeline from './EventTimeline'

const CardWrapper = styled.div`
  border-radius: 16px;
  background-color: white;
  border: 1px solid ${colors.mavis_light_gray};
`

interface Props {
  tableId: string
  customerEmail: string
}

// A single customer's events and attributes
const CustomerTimeLine = ({ tableId, customerEmail }: Props) => {
  return (
    <Flex justify="space-between" style={{ height: '100%', overflowY: 'hidden', padding: LAYOUT_CONTENT_PADDING }}>
      <CardWrapper style={{ width: '75%', height: '100%', marginRight: '16px' }}>
        <EventTimeline tableId={tableId} customerEmail={customerEmail} />
      </CardWrapper>

      {/* add bottom padding to espace content covered by helpscout  */}
      <div style={{ width: '25%', overflowY: 'auto', paddingBottom: '80px' }}>
        <CardWrapper style={{ height: 'fit-content', padding: '16px' }}>
          <CustomerAttributes tableId={tableId} customerEmail={customerEmail} />
        </CardWrapper>
      </div>
    </Flex>
  )
}

export default CustomerTimeLine
