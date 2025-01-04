import { Box, BoxProps } from 'components/shared/jawns'
import styled from 'styled-components'

const StyledBox = styled(Box)`
  height: 100%;
`

interface Props extends BoxProps {
  loading?: boolean
}

const ContentBox = ({ children, ...props }: Props) => {
  return (
    <StyledBox py={2} px={4} bg="white" {...props} data-test="content-box">
      {children}
    </StyledBox>
  )
}

export default ContentBox
