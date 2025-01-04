import { Typography } from 'components/shared/jawns'
import { truncate } from 'lodash'

interface Props {
  columnLabel: string
  truncateLimit?: number
  className?: string
}

const ColumnLabel = ({ columnLabel, className, truncateLimit = 200 }: Props) => {
  return (
    <Typography
      color="blue800"
      type="body200"
      mr="8px"
      title={columnLabel}
      style={{ wordWrap: 'break-word' }}
      className={className}
    >
      {truncateLimit ? truncate(columnLabel, { length: truncateLimit }) : columnLabel}
    </Typography>
  )
}

export default ColumnLabel
