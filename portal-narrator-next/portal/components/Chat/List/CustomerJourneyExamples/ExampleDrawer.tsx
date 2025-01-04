import { Drawer } from 'antd-next'
import ActivityStream from 'components/CustomerJourney/v2/ActivityStream'
import { CUSTOMER_JOURNEY_AS_SIDEBAR_WIDTH } from 'components/CustomerJourney/v2/services/constants'
import { IGetCustomerJourneyData } from 'components/CustomerJourney/v2/services/interfaces'

interface Props {
  data?: IGetCustomerJourneyData
  onClose: () => void
  open: boolean
  loading: boolean
}

const ExampleDrawer = ({ data, onClose, open, loading }: Props) => {
  return (
    <Drawer
      title="Customer Journey"
      placement="right"
      closable
      onClose={onClose}
      open={open}
      width={CUSTOMER_JOURNEY_AS_SIDEBAR_WIDTH}
    >
      <div style={{ overflowX: 'hidden' }}>
        <ActivityStream customerJourneyData={data} loading={loading} infiniteScrollLoading={false} isSidebar />
      </div>
    </Drawer>
  )

  return null
}

export default ExampleDrawer
