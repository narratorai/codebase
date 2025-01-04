import styled from 'styled-components'
import { colors } from 'util/constants'

const Suggestion = styled.div`
  cursor: pointer;
  border-radius: 4px;
  color: ${colors.blue500};
  background-color: ${colors.white};
  border: 1px solid ${colors.blue500};
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  text-wrap: nowrap;
  font-size: 0.8rem;
  padding: 4px 12px;
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

const ChatSuggestion = ({ children, onClick }: Props) => {
  return <Suggestion onClick={onClick}>{children}</Suggestion>
}

export default ChatSuggestion
