import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useEffectOnce } from 'react-use'
import { useShallow } from 'zustand/react/shallow'

import { useChatSuggestions } from '@/stores/chats'
import { useCompany } from '@/stores/companies'

import SuggestionsList from './SuggestionsList'

const InitialSuggestions = () => {
  const datacenterRegion = useCompany((state) => state.datacenterRegion)
  const [resetSuggestions, getSuggestions] = useChatSuggestions(
    useShallow((state) => [state.reset, state.getSuggestions])
  )

  useQuery({
    queryFn: () => getSuggestions(datacenterRegion),
    queryKey: ['chat-initial-suggestions'],
  })

  useEffectOnce(() => resetSuggestions)

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.75, ease: 'easeInOut' }}
    >
      <SuggestionsList />
    </motion.div>
  )
}

export default InitialSuggestions
