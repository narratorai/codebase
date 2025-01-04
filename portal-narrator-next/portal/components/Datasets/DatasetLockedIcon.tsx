import { LockOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd-next'
import { Box, Typography } from 'components/shared/jawns'
import React from 'react'
import { colors } from 'util/constants'

const DefaultTitle = () => {
  return (
    <Box>
      <Typography>This Dataset is Locked.</Typography>
      <Typography>Unlock the dataset to save.</Typography>
    </Box>
  )
}

interface Props {
  title?: string | React.ReactNode
}

const DatasetLockedIcon = ({ title }: Props) => {
  return (
    <Tooltip title={title || <DefaultTitle />}>
      <LockOutlined style={{ color: colors.red500 }} />
    </Tooltip>
  )
}

export default DatasetLockedIcon
