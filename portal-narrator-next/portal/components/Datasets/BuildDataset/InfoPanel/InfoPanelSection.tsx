import { Box, BoxProps } from 'components/shared/jawns'
import styled from 'styled-components'

const StyledInfoBox = styled(Box)<{ leftBorderColor: string }>`
  position: relative;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  border-left: 4px solid ${({ theme, leftBorderColor }) => theme.colors[leftBorderColor]};

  .add-button {
    transition: opacity 150ms ease-in-out;
    opacity: 0;
  }

  &:hover {
    .add-button {
      opacity: 1;
    }
  }
`

interface Props extends BoxProps {
  leftBorderColor: string
}

const InfoPanelSection = ({ leftBorderColor, disabled, ...props }: Props) => {
  return <StyledInfoBox leftBorderColor={leftBorderColor} disabled={disabled} mb={2} pb={1} bg="white" {...props} />
}

export default InfoPanelSection
