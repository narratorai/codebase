import { App } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { IMessage, MessageTypes, useChat } from 'portal/stores/chats'
import { useToggle } from 'react-use'
import { useShallow } from 'zustand/react/shallow'

interface Feedback {
  showFeedbackView: boolean
  showFeedbackForm: boolean
  showRequestForm: boolean
  requestId?: string | null
  rating?: number
  messageType: MessageTypes
  toggleRequestForm: () => void
  postPositiveFeedback: () => Promise<void>
  postNegativeFeedback: () => Promise<void>
  sendRequest: (data: Record<string, unknown>) => Promise<void>
}

const getFeedbackVisibility = (
  messageType: MessageTypes,
  isViewMode: boolean,
  isMavisMessage: boolean,
  chatId?: string
): boolean => {
  switch (messageType) {
    case MessageTypes.BrainstormConfig:
      return true
    case MessageTypes.CustomerJourneyData:
      return true
    case MessageTypes.ExampleCustomerJourneys:
      return true
    case MessageTypes.PlotData:
      return true
    case MessageTypes.TableData:
      return true
    case MessageTypes.CustomerJourneyConfig:
      return !!isViewMode
    case MessageTypes.DatasetConfig:
      return !!isViewMode
    case MessageTypes.ClassifiedQuestion:
      return !!chatId
    case MessageTypes.Text:
      return !!isMavisMessage && !!chatId
    default:
      return false
  }
}

const useFeedback = (hideFeedback: boolean, isViewMode: boolean, chatId: string, message: IMessage): Feedback => {
  const { type: messageType, request_id, role, rating } = message
  const { isCompanyAdmin } = useUser()
  const { notification } = App.useApp()
  const { datacenter_region } = useCompany()
  const [showRequestForm, toggleRequestForm] = useToggle(false)
  const [postMessageRating, sendTrainingRequest] = useChat(
    useShallow((state) => [state.postMessageRating, state.sendTrainingRequest])
  )

  const isMavisMessage = role === 'mavis'
  const isRequested = request_id !== null && request_id !== undefined
  const isRatingPositive = rating === 1

  const showFeedback = !hideFeedback && getFeedbackVisibility(messageType, isViewMode, isMavisMessage, chatId)
  const showFeedbackView = isRatingPositive || isRequested
  const showFeedbackForm = showFeedback && !showFeedbackView
  const requestId = isCompanyAdmin ? request_id : null

  const postPositiveFeedback = async () => {
    if (message.id) {
      await postMessageRating(message.id, 1, datacenter_region)
      notification.success({ message: 'Feedback saved' })
    }
  }

  const postNegativeFeedback = async () => {
    if (message.id) {
      toggleRequestForm()

      // vote on negative feedback even if they don't submit the form afterwards
      await postMessageRating(message.id, 0, datacenter_region)
    }
  }

  const sendRequest = async (data: Record<string, unknown>) => {
    try {
      const request = { ...data, message_id: message.id }
      await sendTrainingRequest(request)

      toggleRequestForm(false)
      notification.success({ message: 'Request sent' })
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore error is an instance of MavisError
      notification.error({ title: error.message, message: error.description })
    }
  }

  return {
    showFeedbackView,
    showFeedbackForm,
    showRequestForm,
    requestId,
    rating,
    messageType,
    toggleRequestForm,
    postPositiveFeedback,
    postNegativeFeedback,
    sendRequest,
  }
}

export default useFeedback
