import { IMessage } from 'portal/stores/chats'

interface IHookReturn {
  messageId: string
  actionable: boolean
  isAnalyzable: boolean
  isActionable: boolean
  isNotActionable: boolean
  narrativeSlug: string
}

const useMessage = (message: IMessage): IHookReturn => {
  const { id: messageId, data: messageData } = message
  const analyzable = messageData?.analyzable
  const analysisNarrative = messageData?.analysis_narrative

  // const narrativeId = analysisNarrative?.id
  const narrativeSlug = analysisNarrative?.slug
  const actionable = analysisNarrative?.actionable

  const isAnalyzable = analyzable !== null
  const isActionable = isAnalyzable && actionable === true
  const isNotActionable = isAnalyzable && actionable === false

  return {
    messageId,
    actionable,
    isAnalyzable,
    isActionable,
    isNotActionable,
    narrativeSlug,
  }
}

export default useMessage
