import { Tag } from 'antd-next'
import { Box, BoxProps } from 'components/shared/jawns'
import { IStatus_Enum } from 'graph/generated'
import React from 'react'
import { getNarrativeStateLabel } from 'util/narratives'

interface Props extends BoxProps {
  state: IStatus_Enum
  icon?: React.ReactNode
}

const NarrativeStateTag = ({ state, icon, ...props }: Props) => {
  let tagColor
  if (state === IStatus_Enum.InProgress) {
    tagColor = 'processing'
  }

  if (state === IStatus_Enum.Live) {
    tagColor = 'success'
  }
  return (
    <Box style={{ display: 'inline-block' }} {...props} data-public>
      <Tag color={tagColor} style={{ marginRight: 0 }}>
        {getNarrativeStateLabel({ state })} {icon && <span style={{ marginLeft: '6px' }}>{icon}</span>}
      </Tag>
    </Box>
  )
}

export default NarrativeStateTag
