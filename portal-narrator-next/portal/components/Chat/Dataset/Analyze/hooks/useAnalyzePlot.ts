import { useMutation } from '@tanstack/react-query'
import { useCompany } from 'components/context/company/hooks'
import { IMessage, useChat } from 'portal/stores/chats'

import useMessage from './useMessage'

interface IHookReturn {
  handleAnalyze: () => void
  loading: boolean
  disabled: boolean
}

const useAnalyzePlot = (message: IMessage): IHookReturn => {
  const company = useCompany()
  const analyzePlot = useChat((state) => state.analyzePlot)

  const { messageId, actionable, isAnalyzable } = useMessage(message)

  const { mutate: handleAnalyze, isPending } = useMutation({
    mutationFn: () => analyzePlot(messageId, company.datacenter_region),
  })

  const loading = actionable === null || isPending
  const disabled = !isAnalyzable || loading

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return {
    handleAnalyze,
    loading,
    disabled,
  }
}

export default useAnalyzePlot
