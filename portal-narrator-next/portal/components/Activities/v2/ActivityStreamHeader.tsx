import { EditOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { Flex, Typography } from 'components/shared/jawns'
import { isFinite, startCase } from 'lodash'
import { MouseEvent } from 'react'
import { useHistory } from 'react-router'
import { colors } from 'util/constants'

import { ACTIVITY_STREAM_EDIT_PARAM } from './constants'

interface Props {
  tableId: string
  streamName: string
  activitiesCount?: number
}

const ActivityStreamHeader = ({ tableId, streamName, activitiesCount }: Props) => {
  const history = useHistory()
  const company = useCompany()
  const { isCompanyAdmin } = useUser()

  const showEditStream = (event: MouseEvent<HTMLElement>) => {
    // don't close the parent collapse
    event.stopPropagation()

    if (isCompanyAdmin) {
      history.push(`/${company.slug}/activities/${ACTIVITY_STREAM_EDIT_PARAM}/${tableId}`)
    }
  }

  return (
    <Flex alignItems="flex-end">
      <Typography mr={1} type="title300" style={{ fontWeight: 300 }}>
        {`${startCase(streamName)}${isFinite(activitiesCount) ? ` (${activitiesCount})` : ''}`}
      </Typography>

      <Tooltip title={isCompanyAdmin ? `Configure ${startCase(streamName)}` : 'You must be an admin to edit'}>
        <div>
          <Button
            disabled={!isCompanyAdmin}
            size="small"
            type="link"
            onClick={showEditStream}
            icon={<EditOutlined style={{ color: colors.gray500 }} />}
          />
        </div>
      </Tooltip>
    </Flex>
  )
}

export default ActivityStreamHeader
