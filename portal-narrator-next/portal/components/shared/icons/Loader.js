import { Spin } from 'antd-next'
import { ScreenOnly } from 'components/shared/jawns'
import React from 'react'
import styled from 'styled-components'

import { isDeployed } from '@/util/env'

// Loader renders the `id` prop as debugging help in dev
const Loader = (props) => <Spin data-id={props.id} size="large" tip={!isDeployed && props.id ? props.id : undefined} />

const LoaderWrapper = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
`

const SimpleLoaderWrapper = styled.div`
  width: 100%;
  text-align: center;
`

export const CenteredLoader = (props) => (
  <LoaderWrapper>
    <ScreenOnly>
      <Loader {...props} />
    </ScreenOnly>
  </LoaderWrapper>
)

export const SimpleLoader = (props) => (
  <SimpleLoaderWrapper>
    <ScreenOnly>
      <Loader {...props} />
    </ScreenOnly>
  </SimpleLoaderWrapper>
)

export default Loader
