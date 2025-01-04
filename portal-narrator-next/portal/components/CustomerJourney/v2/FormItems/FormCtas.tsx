import { Button, Space } from 'antd-next'
import { FormData } from 'components/CustomerJourney/v2/Customer'
import { Box, Flex, Typography } from 'components/shared/jawns'

import SubmitCancelButton from '../SubmitCancelButton'

interface Props {
  onSubmit: () => void
  loadingCustomerJourney: boolean
  cancelGetCustomerJourney: () => void
  handleReset: ({ valueOverrides }: { valueOverrides?: Partial<FormData> }) => void
  handleRunLive: () => void
  lastRetrievedAgo?: string
}

const FormCtas = ({
  onSubmit,
  handleReset,
  loadingCustomerJourney,
  cancelGetCustomerJourney,
  handleRunLive,
  lastRetrievedAgo,
}: Props) => {
  return (
    <Box>
      <Space>
        <SubmitCancelButton
          onSubmit={onSubmit}
          isCancelButton={loadingCustomerJourney}
          cancelRequest={cancelGetCustomerJourney}
        />

        <Button data-test="reset-customer-filters-cta" onClick={() => handleReset({})}>
          Reset
        </Button>
      </Space>

      <Flex mt={1} alignItems="center">
        <Button type="link" onClick={handleRunLive} disabled={loadingCustomerJourney} style={{ paddingLeft: 0 }}>
          Clear Cache
        </Button>

        {lastRetrievedAgo && <Typography>(data as of {lastRetrievedAgo})</Typography>}
      </Flex>
    </Box>
  )
}

export default FormCtas
