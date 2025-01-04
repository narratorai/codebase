import { Button, Empty } from 'antd-next'
import { Box, Link, Typography } from 'components/shared/jawns'

interface Props {
  description?: string | React.ReactNode
}

const CreateActivityStreamButton = () => {
  return (
    <Link unstyled to="/transformations">
      <Button type="primary">Create Activity Stream</Button>
    </Link>
  )
}

const NoActivityStreamAlert = ({ description }: Props) => {
  return (
    <Box style={{ width: '100%' }}>
      <Box style={{ margin: 'auto', marginTop: '200px' }}>
        <Empty
          description={
            description ? (
              description
            ) : (
              <Box>
                <Typography type="title300">You haven't created an activity stream yet.</Typography>
                <Typography>Please create an activity stream to get started.</Typography>
              </Box>
            )
          }
        >
          <CreateActivityStreamButton />
        </Empty>
      </Box>
    </Box>
  )
}

export default NoActivityStreamAlert
