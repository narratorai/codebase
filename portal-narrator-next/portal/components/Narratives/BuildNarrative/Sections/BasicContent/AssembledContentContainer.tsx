import { Spin } from 'antd-next'
import { Box, Typography } from 'components/shared/jawns'
import React from 'react'
import styled from 'styled-components'
import { colors } from 'util/constants'

const ErrorContainer = styled(Box)<{ hasError?: boolean }>`
  min-height: 200px;
  border: ${({ hasError }) => (hasError ? `2px solid ${colors.red500}` : 'none')};
`

interface Props {
  compiling: boolean
  compileError: string | null
  children: React.ReactNode
}

const AssembledContentContainer = ({ compiling, compileError, children }: Props) => {
  return (
    <Spin spinning={compiling}>
      <ErrorContainer hasError={!!compileError} py={2} px={4}>
        {compileError && (
          <Typography type="title400" style={{ color: colors.red600 }}>
            {compileError}
          </Typography>
        )}

        {!compileError && children}
      </ErrorContainer>
    </Spin>
  )
}

export default AssembledContentContainer
