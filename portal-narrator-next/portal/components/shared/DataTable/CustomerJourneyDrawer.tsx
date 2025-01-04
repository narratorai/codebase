import { SyncOutlined } from '@ant-design/icons'
import { Drawer } from 'antd-next'
import ActivityStream from 'components/CustomerJourney/v2/ActivityStream'
import { GET_CUSTOMER_JOURNEY_LIMIT } from 'components/CustomerJourney/v2/services/constants'
import useGetCustomerJourney from 'components/CustomerJourney/v2/services/useGetCustomerJourney'
import { Flex } from 'components/shared/jawns'
import { FC, useEffect } from 'react'
import { colors } from 'util/constants'

const ACTIVITY_STREAM_CONTAINER_ID = 'customer_journey_drawer_activity_stream'

interface Props {
  customer?: string
  customerKind?: string
  table?: string
  onClose: () => void
}

const CustomerJourneyDrawer: FC<Props> = ({ customer, customerKind, table, onClose }) => {
  const [getCustomerJourney, { data, loading, error, infiniteScrollLoading }] = useGetCustomerJourney()

  const doInfiniteScroll = (e: any) => {
    const {
      target: { offsetHeight, scrollTop, scrollHeight },
    } = e
    // if you've reached the 70% of the bottom of the page
    const scrollPercent = scrollTop / (scrollHeight + offsetHeight)

    if (scrollPercent >= 0.7) {
      // and there is more to scroll to + isn't loading or are errors
      if (data && data?.data?.rows?.length % GET_CUSTOMER_JOURNEY_LIMIT === 0 && !loading && !error) {
        getCustomerJourney({
          customer,
          customerKind,
          table,
          only_first_occurrence: false,
          offset: data?.data?.rows?.length,
        })
      }
    }
  }

  useEffect(() => {
    if (customer && customerKind && table) {
      getCustomerJourney({ customer, customerKind, table, only_first_occurrence: false })
    }
  }, [customer, customerKind, table, getCustomerJourney])

  return (
    <Drawer open={!!customer} onClose={onClose} title={`Customer Journey: ${customer}`} width={480} placement="right">
      <div
        style={{ height: '100%', overflowY: 'auto' }}
        onScroll={(e: any) => doInfiniteScroll(e)}
        id={ACTIVITY_STREAM_CONTAINER_ID}
      >
        <ActivityStream
          customer={data?.customer}
          error={error?.message}
          loading={loading}
          infiniteScrollLoading={infiniteScrollLoading}
          customerJourneyData={data}
          isSidebar
        />

        {infiniteScrollLoading && (
          <Flex justifyContent="center" alignItems="center" style={{ color: colors.blue500, height: '80px' }}>
            <SyncOutlined spin style={{ fontSize: '24px' }} />
          </Flex>
        )}
      </div>
    </Drawer>
  )
}

export default CustomerJourneyDrawer
