import { Badge, Popover } from 'antd-next'
import { Box, Typography } from 'components/shared/jawns'
import { isEmpty } from 'lodash'
import pluralize from 'pluralize'
import { getBadgeColor, timeFromNow } from 'util/helpers'

import { TransformationFromQuery } from './interfaces'

interface Props {
  transformation: TransformationFromQuery
}

const StatusBadge = ({ transformation }: Props) => {
  const lastQueryUpdate = transformation.query_updates?.[0]
  const badgeStatus = isEmpty(lastQueryUpdate) ? 'default' : getBadgeColor(lastQueryUpdate.processed_at)

  if (isEmpty(lastQueryUpdate)) return <Badge status={badgeStatus} />

  return (
    <Popover
      content={
        <Box style={{ maxWidth: '240px' }}>
          {!isEmpty(lastQueryUpdate) && (
            <>
              <Typography mb={1}>
                Inserted {lastQueryUpdate.rows_inserted} {pluralize('row', lastQueryUpdate.rows_inserted)}{' '}
                {timeFromNow(lastQueryUpdate.processed_at)}
              </Typography>
              <Typography>
                Inserted data range: from {timeFromNow(lastQueryUpdate.from_sync_time)} to{' '}
                {timeFromNow(lastQueryUpdate.to_sync_time)}
              </Typography>
            </>
          )}
        </Box>
      }
    >
      <Badge status={badgeStatus} />
    </Popover>
  )
}

export default StatusBadge
