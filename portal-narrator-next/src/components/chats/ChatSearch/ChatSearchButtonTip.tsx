import { Column } from '@/components/primitives/Axis'
import { OptionShortcut } from '@/components/primitives/Options'

const ChatSearchButtonTip = () => (
  <Column items="center">
    <span>Search chats</span>
    <OptionShortcut keys="⌘k" />
  </Column>
)

export default ChatSearchButtonTip
