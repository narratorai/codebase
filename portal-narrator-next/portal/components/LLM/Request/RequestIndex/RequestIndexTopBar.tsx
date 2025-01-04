import { Button } from 'antd-next'
import { Flex, Typography } from 'components/shared/jawns'

import { REQUEST_HEADER_Z_INDEX, REQUEST_INDEX_TOP_BAR_HEIGHT } from '../constants'

interface Props {
  toggleAssignModal: () => void
}

const RequestIndexTopBar = ({ toggleAssignModal }: Props) => {
  return (
    <Flex
      alignItems="center"
      justifyContent="space-between"
      style={{ position: 'sticky', top: 0, height: REQUEST_INDEX_TOP_BAR_HEIGHT, zIndex: REQUEST_HEADER_Z_INDEX }}
    >
      <Typography type="title300">Requests</Typography>

      <Button type="primary" onClick={toggleAssignModal}>
        Assign Requests
      </Button>
    </Flex>
  )
}

export default RequestIndexTopBar
