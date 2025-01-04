import styled from 'styled-components'
import { colors } from 'util/constants'

const StyledContainer = styled.div`
  cursor: pointer;
  border-radius: 12px;
  color: ${colors.gray700};
  background-color: ${colors.white};
  border: 1px solid ${colors.gray500};
  transition: background-color 0.2s;
  text-align: left;
  text-wrap: nowrap;
  font-size: 0.8rem;
  padding: 12px 16px;
  text-overflow: ellipsis;
  overflow: hidden;

  &:hover {
    background-color: ${colors.gray200};
  }
`

interface Props {
  onClick: () => void
  children: React.ReactNode
}

const LargeChatSuggestion = ({ children, onClick }: Props) => {
  return <StyledContainer onClick={onClick}>{children}</StyledContainer>
}

export default LargeChatSuggestion
