import { Button, Tooltip } from 'antd-next'
import { Box, Flex } from 'components/shared/jawns'
import CustomerJourneyIconSVG from 'static/svg/Narrator/CustomerJourney.svg'

const CustomerCellRenderer = ({ value, context }: any) => {
  const handleOpenCustomerJourney = () => {
    context.setSelectedCustomerJourney({
      customer: value,
      customerKind: context?.metadata?.customer_kind,
      table: context?.metadata?.table?.activity_stream,
    })
  }

  return (
    <Flex alignItems="center">
      {value && (
        <Box>
          <Tooltip title="View customer journey">
            <Button icon={<CustomerJourneyIconSVG />} onClick={handleOpenCustomerJourney} type="text" />
          </Tooltip>
        </Box>
      )}

      <Box>{value}</Box>
    </Flex>
  )
}

export default CustomerCellRenderer
