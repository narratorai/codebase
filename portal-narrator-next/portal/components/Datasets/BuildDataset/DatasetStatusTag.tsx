import { Tag } from 'antd-next'
import { Box } from 'components/shared/jawns'
import { IStatus_Enum } from 'graph/generated'
import React from 'react'
import { getDatasetStatusLabel } from 'util/datasets'

interface Props {
  status: IStatus_Enum
  icon?: React.ReactNode
}

const DatasetStatusTag = ({ status, icon, ...props }: Props) => {
  let tagColor
  if (status === IStatus_Enum.InProgress) {
    tagColor = 'processing'
  }

  if (status === IStatus_Enum.Live) {
    tagColor = 'success'
  }

  if (status === IStatus_Enum.InternalOnly) {
    tagColor = 'warning'
  }

  return (
    <Box style={{ display: 'inline-block' }} {...props} data-public>
      <Tag color={tagColor} style={{ marginRight: 0 }}>
        {getDatasetStatusLabel({ status })} {icon && <span style={{ marginLeft: '6px' }}>{icon}</span>}
      </Tag>
    </Box>
  )
}

export default DatasetStatusTag
