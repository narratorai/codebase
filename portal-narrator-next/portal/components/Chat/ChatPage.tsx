import Page from 'components/shared/Page'
import { useFlags } from 'launchdarkly-react-client-sdk'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Switch } from 'react-router'
import Route from 'util/route'

import ChatPageSider from './ChatPageSider'
import NewChatSection from './NewChatSection'
import StoredChatSection from './StoredChatSection'

const ChatPage = () => {
  const flags = useFlags()
  const isFeatureEnabled = flags['llm-chat']

  if (!isFeatureEnabled) return null
  return (
    <Page title="Chat | Narrator" hideChat>
      <PanelGroup direction="horizontal" autoSaveId="chat-ai-layout">
        <Panel minSize={80}>
          <Switch>
            <Route path="/:company_slug/chat" component={NewChatSection} exact />
            <Route path="/:company_slug/chat/:id" component={StoredChatSection} />
          </Switch>
        </Panel>
        <PanelResizeHandle />
        <Panel>
          <ChatPageSider />
        </Panel>
      </PanelGroup>
    </Page>
  )
}

export default ChatPage
