import { Spin } from 'antd-next'
import { Box, BoxProps } from 'components/shared/jawns'
import React from 'react'
import styled from 'styled-components'

interface ContentLoaderProps extends BoxProps {
  loading: boolean
}

const SpinWrapper = styled(Box)`
  position: relative;
  height: 100%;

  & .antd5-spin-nested-loading,
  & .antd5-spin-container {
    height: 100%;
  }
`

const ContentLoader: React.FC<ContentLoaderProps> = ({ children, loading, ...props }) => {
  return (
    <SpinWrapper {...props}>
      <Spin spinning={loading} wrapperClassName="content-loader">
        {children}
      </Spin>
    </SpinWrapper>
  )
}

export default ContentLoader
