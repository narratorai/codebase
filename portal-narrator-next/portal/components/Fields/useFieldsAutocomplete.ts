import { IAutocomplete } from '@narratorai/the-sequel'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { IStatus_Enum, useListDatasetsQuery } from 'graph/generated'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { reportError } from 'util/errors'
import { timeFromNow } from 'util/helpers'

import { useAuth0 } from '../context/auth/hooks'
import FieldsApi from './FieldsApi'
import FieldsCompletionService, { FunctionDefinition } from './FieldsCompletionService'

const datasetStatuses = [IStatus_Enum.Live]
const useFieldsAutocomplete = (functionDefinitions: FunctionDefinition[]): IAutocomplete | undefined => {
  const company = useCompany()
  const { user } = useUser()
  const { getTokenSilently: getToken } = useAuth0()
  const [autoComplete, setAutoComplete] = useState<IAutocomplete>()

  const fieldsApi = useMemo(() => {
    if (company) {
      return new FieldsApi({ getToken, company })
    }
  }, [getToken, company])

  const { data: datasets } = useListDatasetsQuery({
    variables: { company_id: company?.id, statuses: datasetStatuses, user_id: user?.id },
    // This makes sure data reloads every time
    // the page loads (solves create/delete inconsistencies)
    fetchPolicy: 'cache-and-network',
  })

  const getGroups = useCallback(
    async (datasetSlug: string) => {
      let groups: any[] = []
      if (fieldsApi) {
        try {
          groups = await fieldsApi.getDatasetGroups(datasetSlug)
        } catch (error) {
          const _err = error as Error
          reportError(_err.message, _err)
        }
      }
      return groups
    },
    [fieldsApi]
  )

  useEffect(() => {
    if (datasets?.dataset && !autoComplete) {
      const datasetDefinitions = datasets.dataset.map((entry) => {
        // generate the Markdown that will be shown in the autocomplete UI
        const documentation = {
          value: `# ${entry.name}
${entry.description ? '**' + entry.description + '**' : ''}\n
${entry.user?.email}\n
[View Dataset](${window.location.origin}/${company.slug}/datasets/edit/${entry.slug})
\`\`\`
Created: ${timeFromNow(entry.created_at)}${
            entry.last_viewed_at ? '\nLast Viewed: ' + timeFromNow(entry.last_viewed_at) : ''
          }
Slug: ${entry.slug}\n
\`\`\`
`,
        }

        return {
          name: entry.name,
          slug: entry.slug,
          documentation,
        }
      })

      const fieldsService = new FieldsCompletionService(datasetDefinitions, functionDefinitions, getGroups)
      setAutoComplete(fieldsService)
    }
  }, [datasets, functionDefinitions, autoComplete, getGroups])

  return autoComplete
}

export default useFieldsAutocomplete
