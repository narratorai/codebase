import { Divider } from 'components/antd/staged'
import { Box, Typography } from 'components/shared/jawns'
import React from 'react'

interface Props {
  title: string
  children: React.ReactNode
}

const SectionWithTitle = ({ title, children }: Props) => {
  return (
    <Box>
      <Divider style={{ margin: '24px 0px 16px 0px' }} />
      <Typography type="title400" style={{ fontWeight: 300 }}>
        {title}
      </Typography>
      {children}
    </Box>
  )
}

export default SectionWithTitle
