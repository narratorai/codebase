import { Button, Empty } from 'antd-next'
import { Box, Link, Typography } from 'components/shared/jawns'

interface Props {
  description?: string | React.ReactNode
}

const ConnectToWarehouseButton = () => {
  return (
    <Link unstyled to="/manage/warehouse">
      <Button type="primary">Connect Warehouse</Button>
    </Link>
  )
}

const NoWarehouseAlert = ({ description }: Props) => {
  return (
    <Box style={{ width: '100%' }}>
      <Box style={{ margin: 'auto', marginTop: '200px' }}>
        <Empty
          description={
            description ? (
              description
            ) : (
              <Box>
                <Typography type="title300">You haven't connected a warehouse yet.</Typography>
                <Typography>Please connect to a warehouse to get started.</Typography>
              </Box>
            )
          }
        >
          <ConnectToWarehouseButton />
        </Empty>
      </Box>
    </Box>
  )
}

export default NoWarehouseAlert
