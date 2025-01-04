import { QuestionCircleOutlined } from '@ant-design/icons'
import { Box, Flex } from 'components/shared/jawns'

import WarehouseCards from './WarehouseCards'
import WarehouseError from './WarehouseError'
import Warehouses from './Warehouses'

const Warehouse = () => (
  <Flex flexDirection="column" data-test="warehouse-section">
    <Flex justifyContent="space-between" data-public>
      <Box ml="auto">
        <QuestionCircleOutlined style={{ marginRight: '8px' }} />
        <a href="https://docs.narrator.ai/docs/connect-a-warehouse" target="_blank" rel="noopener noreferrer">
          How to connect a warehouse
        </a>
      </Box>
    </Flex>

    <WarehouseError />

    <WarehouseCards />

    <Warehouses />
  </Flex>
)

export default Warehouse
