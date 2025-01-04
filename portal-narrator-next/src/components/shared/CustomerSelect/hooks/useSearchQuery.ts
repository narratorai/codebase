import { useQuery } from '@tanstack/react-query'

import { useDelayedState } from '@/hooks'
import { useCompany } from '@/stores/companies'
import { useJourneyActivities } from '@/stores/journeys'
import { useTables } from '@/stores/tables'

const useSearchQuery = () => {
  const [companySlug, datacenterRegion] = useCompany((state) => [state.slug, state.datacenterRegion])
  const [table, getTables] = useTables((state) => [state.table, state.getTables])
  const searchJourneyActivities = useJourneyActivities((state) => state.searchJourneyActivities)
  const [search, setSearch] = useDelayedState('', 3000)

  const params = { search }

  const queryState = useQuery({
    queryFn: async () => {
      if (!table) await getTables(datacenterRegion) // TODO: We are not certain that the table identifier will reference the table by the time this operation finishes. We have to ensure that it does, or retrieve the value before the next step.

      const results = await searchJourneyActivities(table!.id, params, datacenterRegion)
      return results
    },
    queryKey: [companySlug, 'journey-activities', JSON.stringify(params)],
  })

  return {
    setSearch,
    ...queryState,
  }
}

export default useSearchQuery
