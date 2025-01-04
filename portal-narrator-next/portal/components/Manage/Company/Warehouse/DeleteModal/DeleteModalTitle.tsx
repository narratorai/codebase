import { ExclamationCircleOutlined } from '@ant-design/icons'
import { Typography } from 'components/shared/jawns'
import { colors } from 'util/constants'

const DeleteModalTitle = () => (
  <Typography type="title400">
    <ExclamationCircleOutlined style={{ color: colors.red500 }} /> Delete Connection
  </Typography>
)

export default DeleteModalTitle
