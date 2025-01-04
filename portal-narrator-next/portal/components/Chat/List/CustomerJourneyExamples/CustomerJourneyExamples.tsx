import { Empty, Flex, Spin } from 'antd-next'
import { IGetCustomerJourneyData } from 'components/CustomerJourney/v2/services/interfaces'
import { isEmpty, map } from 'lodash'
import { IMessage } from 'portal/stores/chats'
import { useEffect, useState } from 'react'
import { useLazyCallMavis } from 'util/useCallMavis'

import { StyledCard } from '../StyledWrappers'
import ExampleCard from './ExampleCard'
import ExampleDrawer from './ExampleDrawer'
import { Example } from './interfaces'

interface Props {
  message: IMessage
}

const CustomerJourneyExamples = ({ message }: Props) => {
  const [selectedExample, setSelectedExample] = useState<Example | undefined>()
  const handleCloseDrawer = () => {
    setSelectedExample(undefined)
  }

  const datasetSlug = message.data?.dataset_slug as string
  const examples = message.data?.examples as Example[]

  const handleSelectExample = (example: Example) => {
    setSelectedExample(example)
  }

  // get the selected example's customer journey data
  const [getCustomerJourney, { response: customerJourneyData, loading: getCustomerJourneyLoading }] =
    useLazyCallMavis<IGetCustomerJourneyData>({
      method: 'POST',
      path: '/v1/dataset/customer_journey',
    })

  useEffect(() => {
    if (selectedExample) {
      getCustomerJourney({ body: { dataset_slug: datasetSlug, row: selectedExample.row, limit: 200 } })
    }
  }, [selectedExample, getCustomerJourney, datasetSlug])

  if (isEmpty(examples)) {
    return (
      <StyledCard>
        <Empty description="No examples found" />
      </StyledCard>
    )
  }

  return (
    <div>
      <Spin spinning={getCustomerJourneyLoading}>
        <Flex style={{ width: '100%' }} wrap="wrap">
          {map(examples, (example) => (
            <div style={{ marginRight: '8px', marginBottom: '8px' }} key={example.customer}>
              <ExampleCard example={example} onSelect={handleSelectExample} />
            </div>
          ))}
        </Flex>
      </Spin>

      <ExampleDrawer
        data={customerJourneyData}
        loading={getCustomerJourneyLoading}
        onClose={handleCloseDrawer}
        open={!isEmpty(selectedExample)}
      />
    </div>
  )
}

export default CustomerJourneyExamples
