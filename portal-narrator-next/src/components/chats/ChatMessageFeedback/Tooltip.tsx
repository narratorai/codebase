import { Arrow, Content, Label, Portal, Tooltip } from '@/components/shared/Tooltip'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  label: string
}

const ChatMessageFeedbackTooltip = ({ children, label }: Props) => (
  <Tooltip>
    {children}
    <Portal>
      <Content>
        <Label>{label}</Label>
        <Arrow />
      </Content>
    </Portal>
  </Tooltip>
)

export default ChatMessageFeedbackTooltip
