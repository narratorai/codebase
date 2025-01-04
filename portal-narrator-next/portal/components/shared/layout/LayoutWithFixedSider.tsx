import { Layout } from 'antd-next'
import { LayoutProps, SiderProps } from 'antd-next/es/layout'
import { useLayoutContext } from 'components/shared/layout/LayoutProvider'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { breakpoints, LAYOUT_SIDER_WIDTH, SIDENAV_WIDTH, SIDENAV_WIDTH_COLLAPSED } from 'util/constants'

const { Sider, Content } = Layout

export const LAYOUT_CONTENT_PADDING = 24

const StyledSider = styled(Sider).withConfig({
  shouldForwardProp: (prop: any) => !['collapsed'].includes(prop),
})`
  position: fixed !important;
  left: ${({ collapsed }) => (collapsed ? SIDENAV_WIDTH_COLLAPSED : SIDENAV_WIDTH)}px;
  top: 0;
  bottom: 0;
  overflow: hidden;

  & .antd5-layout-sider-children {
    display: flex;
    flex-direction: column;
  }

  @media only screen and (max-width: ${breakpoints.md}) {
    display: none;
  }
`

// need to set a fixed height here so that
// position: sticky works properly on conjunction
// with the overflow-x: hidden that is set
// on our Layout Content (from antd)
const StyledContent = styled(({ collapsed, siderWidth, ...props }) => <Content {...props} />)`
  height: 100vh;
  overflow: auto;
  padding: 24px;
  position: relative;
  margin-left: auto;
  box-shadow: rgb(0 0 0 / 10%) -5px 6px 15px -9px;
  will-change: max-width;
  transition:
    max-width 0.2s,
    height 300ms ease-in-out,
    top 300ms ease-in-out;
  min-width: ${({ collapsed }) => `calc(600px - ${collapsed ? SIDENAV_WIDTH_COLLAPSED : SIDENAV_WIDTH}px) `};
  max-width: ${({ collapsed, siderWidth }) =>
    `calc(100vw - ${siderWidth}px - ${collapsed ? SIDENAV_WIDTH_COLLAPSED : SIDENAV_WIDTH}px) `};

  @media only screen and (max-width: ${breakpoints.md}) {
    min-width: 100vw;
    max-width: 100vw;
    width: 100%;
    height: initial;
    padding: 0;
  }
`

export const FixedSider = (props: SiderProps) => {
  const { collapsed } = useLayoutContext()
  return <StyledSider id="layoutSider" collapsed={collapsed} theme="light" width={LAYOUT_SIDER_WIDTH} {...props} />
}

export interface LayoutContentProps extends LayoutProps {
  siderWidth?: number
}

export const LayoutContent: React.FC<LayoutContentProps> = ({
  children,
  siderWidth = LAYOUT_SIDER_WIDTH,
  style = {},
  ...props
}) => {
  const { collapsed, layoutMainRef } = useLayoutContext()

  // AntD's Layout.Content does not pass the ref= through to reference the underlying html element
  // See: https://github.com/ant-design/ant-design/blob/master/components/layout/layout.tsx#L35
  const [hasSetRef, setHasSetRef] = useState(false)
  useEffect(() => {
    if (layoutMainRef) {
      layoutMainRef.current = document.getElementById('layoutMain') as HTMLElement

      // the only purpose of this state is to cause a re-render
      // thus ensuring that components have access to layoutMainRef.current
      if (!hasSetRef) {
        setHasSetRef(true)
      }
    }
  }, [layoutMainRef, hasSetRef])

  return (
    <StyledContent
      id="layoutMain"
      bg="white"
      collapsed={collapsed}
      siderWidth={siderWidth}
      style={{ ...style }}
      {...props}
    >
      {children}
    </StyledContent>
  )
}
