import { useCompany } from 'components/context/company/hooks'
import { useNarrativeRunsUpdatesSubscription } from 'graph/generated'
import { merge } from 'lodash'
import { IMessage, useChat } from 'portal/stores/chats'
import { useEffect } from 'react'

import useMessage from './useMessage'

const useAnalysisUpdatesSubscription = (message: IMessage) => {
  const company = useCompany()
  const setMessage = useChat((state) => state.setMessage)

  const { messageId, actionable, narrativeSlug } = useMessage(message)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: updatesData } = useNarrativeRunsUpdatesSubscription({
    variables: {
      narrative_slug: narrativeSlug,
      company_id: company.id,
      from: today,
    },
  })

  useEffect(() => {
    if (!updatesData) return
    const { narrative_runs } = updatesData
    const lastIndex = narrative_runs.length - 1
    if (lastIndex < 0) return
    const { is_actionable } = narrative_runs[lastIndex]
    if (is_actionable !== undefined && is_actionable !== actionable) {
      const newMessage = merge({}, message, { data: { analysis_narrative: { actionable: is_actionable } } })
      setMessage(messageId, newMessage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updatesData])
}

export default useAnalysisUpdatesSubscription
