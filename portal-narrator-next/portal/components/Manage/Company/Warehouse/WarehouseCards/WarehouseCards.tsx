import { Alert } from 'antd-next'
import { Box, Flex, Link, Typography } from 'components/shared/jawns'
import { IWarehouseOption, WarehouseTypes } from 'portal/stores/settings'
import { openChat } from 'util/chat'

import WarehouseCard, { CARD_SIZE } from './WarehouseCard'

interface Props {
  options?: IWarehouseOption[]
  onSelect: (warehouseType: WarehouseTypes) => void
}

const WarehouseCards = ({ options, onSelect }: Props) => (
  <Box mb={4} data-public>
    <Typography as="div" type="title400" color="gray600" mb={3}>
      Select from the supported warehouse types
    </Typography>

    <Box maxWidth={`${(options?.length || 0) * (CARD_SIZE + 8)}px`}>
      <Flex justifyContent="flex-start" flexWrap="wrap">
        {options?.map((option: IWarehouseOption) => (
          <WarehouseCard
            key={option.name}
            warehouseName={option.name}
            warehouseType={option.type}
            onClick={() => {
              onSelect(option.type)
            }}
          />
        ))}
      </Flex>

      <Box mt={4}>
        <Alert
          type="info"
          showIcon
          message="Don't see your warehouse on the list?"
          description={
            <Typography>
              We're always looking to support new warehouses.{' '}
              <Link unstyled style={{ display: 'inline' }} onClick={() => openChat()}>
                Contact us
              </Link>{' '}
              to see about partnering with us to set up a connection for your warehouse type.
            </Typography>
          }
        />
      </Box>
    </Box>
  </Box>
)

export default WarehouseCards
