import { Box } from 'components/shared/jawns'
import styled from 'styled-components'

export default styled(Box)`
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: -116px;
    left: -14px;
    width: 8px;
    height: 129px;
    border-left: 1px solid ${({ theme }) => theme.colors.gray400};
    border-bottom: 1px solid ${({ theme }) => theme.colors.gray400};
  }
`
