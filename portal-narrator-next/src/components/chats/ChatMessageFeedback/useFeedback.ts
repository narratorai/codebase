import { useMutation } from '@tanstack/react-query'
import { useShallow } from 'zustand/react/shallow'

import { IRemoteChatRequestData, useChat } from '@/stores/chats'
import { useCompany } from '@/stores/companies'

type IFeedbackRequest = Pick<IRemoteChatRequestData, 'requestType' | 'context'>

const useFeedback = (messageId: string) => {
  const datacenterRegion = useCompany((state) => state.datacenterRegion)
  const [rateMessage, requestTraining] = useChat(useShallow((state) => [state.rateMessage, state.requestTraining]))

  const handlePositiveFeedback = async () => {
    await rateMessage(messageId, 1, datacenterRegion)
  }

  const handleNegativeFeedback = async ({ context, requestType }: IFeedbackRequest) => {
    await rateMessage(messageId, -1, datacenterRegion)
    await requestTraining({ context, messageId, requestType }, datacenterRegion)
  }

  const { isPending: isSubmittingPositiveFeedback, mutateAsync: submitPositiveFeedback } = useMutation({
    mutationFn: handlePositiveFeedback,
  })

  const { isPending: isSubmittingNegativeFeedback, mutateAsync: submitNegativeFeedback } = useMutation({
    mutationFn: handleNegativeFeedback,
  })

  return {
    isSubmittingNegativeFeedback,
    isSubmittingPositiveFeedback,
    submitNegativeFeedback,
    submitPositiveFeedback,
  }
}

export default useFeedback
