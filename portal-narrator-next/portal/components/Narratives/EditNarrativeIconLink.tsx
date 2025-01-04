import { EditOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd-next'
import { useUser } from 'components/context/user/hooks'
import { Box, Link } from 'components/shared/jawns'
import { INarrative, INarrative_Types_Enum } from 'graph/generated'
import React from 'react'
import { colors } from 'util/constants'

interface Props {
  narrative: INarrative
}

const EditNarrativeIconLink = ({ narrative }: Props) => {
  const { user, isCompanyAdmin } = useUser()
  const notAllowedToUpdate = user.id !== narrative?.created_by && !isCompanyAdmin

  if (notAllowedToUpdate) {
    return (
      <Box data-test="edit-narrative">
        <Tooltip placement="topRight" title="You must be the author of this narrative to edit.">
          <EditOutlined style={{ color: colors.gray500 }} title="Edit Narrative" />
        </Tooltip>
      </Box>
    )
  }

  return (
    <Box data-test="edit-narrative">
      <Link
        unstyled
        to={`/${narrative.type === INarrative_Types_Enum.Dashboard ? 'dashboards' : 'narratives'}/edit/${
          narrative.slug
        }`}
      >
        <EditOutlined style={{ color: colors.blue500 }} title="Edit Narrative" />
      </Link>
    </Box>
  )
}

export default EditNarrativeIconLink
