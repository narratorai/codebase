import { Divider as AntdDivider } from 'antd-next'
import styled from 'styled-components'

// https://github.com/narratorai/antd-custom/blob/7f308797b9db54f8a3e9843982065f91f1c8758f/lib/src/components/Divider.tsx
const Divider = styled(AntdDivider)<{ fullPopoverWidth?: boolean }>`
  margin: ${({ fullPopoverWidth }) => (fullPopoverWidth ? '16px -16px' : '0 8px')};
  width: ${({ fullPopoverWidth }) => (fullPopoverWidth ? 'auto' : '100%')};
`

export default Divider
