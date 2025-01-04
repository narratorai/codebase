import { Box } from 'components/shared/jawns'
import styled from 'styled-components'

// allows content to scroll (while keeping the side tabs stationary)
const TabWrapper = styled(Box)`
  position: absolute;
  left: 0;
  top: 0;
  padding-left: 24px;
  padding-right: 24px;
  padding-bottom: 136px;
  height: 100vh;
  width: 100%;
  overflow-y: auto;
`

export default TabWrapper
