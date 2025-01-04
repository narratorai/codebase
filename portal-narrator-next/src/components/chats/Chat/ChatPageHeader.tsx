'use client'

import ChatSearch from '@/components/chats/ChatSearch'
import { Divider } from '@/components/primitives/Divider'
import { Frame } from '@/components/primitives/Frame'
import { Heading } from '@/components/primitives/Heading'
import { Navbar, NavbarDivider, NavbarSection, NavbarSpacer } from '@/components/primitives/Navbar'
import ActivityStreamSelect from '@/components/shared/ActivityStreamSelect'

import ChatBookmark from './ChatBookmark'
import NewChatButton from './NewChatButton'

interface Props {
  isNew?: boolean
}

const ChatPageHeader = ({ isNew = false }: Props) => (
  <Frame>
    <Frame x="3xl">
      <Navbar>
        <Heading level={4}>Mavis AI</Heading>
        <NavbarDivider />
        <NavbarSection>
          <ActivityStreamSelect disabled={!isNew} />
        </NavbarSection>
        <NavbarSpacer />
        <NavbarSection>
          <ChatSearch />
          {!isNew && <ChatBookmark />}
          {!isNew && <NewChatButton />}
        </NavbarSection>
      </Navbar>
    </Frame>
    <Divider />
  </Frame>
)

export default ChatPageHeader
