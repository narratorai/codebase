import { Typography } from 'components/shared/jawns'
import React from 'react'
import { colors } from 'util/constants'

interface Props {
  message: string
}

const CompileErrorMessage = ({ message }: Props) => {
  return (
    <Typography type="title400" style={{ color: colors.red600 }}>
      {message}
    </Typography>
  )
}

export default CompileErrorMessage
