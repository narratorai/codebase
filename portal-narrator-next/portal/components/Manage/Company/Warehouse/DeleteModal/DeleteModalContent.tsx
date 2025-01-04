import { Box, Typography } from 'components/shared/jawns'

interface Props {
  name: string
  isPrimary: boolean
}

const DeleteModalContent = ({ name, isPrimary }: Props) => (
  <div data-public>
    <Typography type="title400" mt={3}>
      Are you sure you want to delete the <b>{name}</b> connection?
    </Typography>
    {isPrimary && (
      <Box mt={3}>
        <Typography>Removing the connection will pause Narrator</Typography>
        <Box ml={4}>
          <ul>
            <li>All processing will be paused</li>
            <li>Materialized views and other exports will stop updating</li>
            <li>
              <b>No data will be lost</b>
            </li>
          </ul>
        </Box>
        <Typography mt={2}>Adding a new connection will allow Narrator to resume processing</Typography>
      </Box>
    )}
  </div>
)

export default DeleteModalContent
