import { FormItem } from 'components/antd/staged'
import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import BasicEditorWidget from 'components/shared/jawns/forms/BasicEditorWidget'
import { filter, find, get } from 'lodash'
import { makeQueryDefinitionFromContext } from 'machines/datasets'
import { useContext, useEffect, useState } from 'react'
import { FieldMetaState } from 'react-final-form'
import { freehandStringToColumnId, getGroupColumns } from 'util/datasets'
import { IDatasetQueryDefinition } from 'util/datasets/interfaces'

import FreehandCompletionService from '../../Services/FreehandCompletionService'
import MavisFunctionsLoader from '../../Services/MavisFunctionsLoader'

interface Props {
  value?: string
  onChange: (value?: string) => void
  meta: Partial<FieldMetaState<any>>
}

// grab columns for autocomplete from the form value but remove the current column
const columnsForAutocomplete = ({
  queryDefinition,
  groupSlug,
  stagedColumnId,
}: {
  queryDefinition: IDatasetQueryDefinition
  groupSlug?: string | null
  stagedColumnId?: string
}) => {
  const group = find(queryDefinition.query.all_groups, ['slug', groupSlug])
  const allColumns = groupSlug && group ? getGroupColumns({ group }) : queryDefinition.query.columns
  return filter(allColumns, (column) => column.id !== stagedColumnId)
}

const FreehandEditor = ({ value, onChange, meta }: Props) => {
  const [loaded, setLoaded] = useState(false)
  const [autoComplete, setAutoComplete] = useState<FreehandCompletionService | undefined>()
  const company = useCompany()
  const { getTokenSilently: getToken } = useAuth0()

  const { groupSlug, machineCurrent, machineSend } = useContext(DatasetFormContext)
  const stagedColumnId = get(machineCurrent.context, '_edit_context.event.column.id')

  useEffect(() => {
    if (!loaded) {
      // on initial load (if editing), run the validation endpoint to get the compiled sql:
      if (value) {
        machineSend('VALIDATE_FREEHAND_FUNCTION', {
          freehandString: freehandStringToColumnId(value, machineCurrent.context, groupSlug),
          groupSlug,
        })
      }

      // FIXME - THIS IS A HACK
      // For some reason monaco does not load into the full height of the input
      // on initial load
      setTimeout(() => {
        setLoaded(true)
      }, 500)
    }
  }, [loaded, value, machineSend, machineCurrent.context, groupSlug])

  useEffect(() => {
    if (company && !autoComplete) {
      const columns = columnsForAutocomplete({
        queryDefinition: makeQueryDefinitionFromContext(machineCurrent.context),
        groupSlug,
        stagedColumnId,
      })

      const loader = new MavisFunctionsLoader({ getToken, company })
      setAutoComplete(new FreehandCompletionService(columns, loader.getFunctions))
    }
  }, [autoComplete, company, machineCurrent.context, groupSlug, getToken, stagedColumnId])

  // react-final-form handles the synchronous required error
  const requiredError = meta?.error && meta?.touched
  // machine handles the async validation error
  const apiError = machineCurrent.matches({ api: 'error' })
  const hasError = apiError || requiredError

  // antd Form.Item prop overrides if there's a validation error:
  const formItemErrorProps = apiError
    ? {
        validateStatus: 'error' as const,
        hasFeedback: true,
        help: 'Invalid freehand function syntax',
      }
    : {
        hasFeedback: true,
        help: "Type $ to show all functions and columns. Use single quotes (') for strings.",
      }

  if (!loaded) {
    return null
  }

  // TODO: !! the language has to be registered for autocomplete to work. We need to register our own (narrator-freehand) or something
  // For now we'll use an already registered language - markdown
  return (
    <FormItem layout="vertical" label="Formula" meta={meta} required {...formItemErrorProps}>
      <BasicEditorWidget
        language="markdown"
        options={{
          autocomplete: autoComplete,
        }}
        value={value}
        onChange={onChange}
        disabled={false}
        hasError={hasError}
      />
    </FormItem>
  )
}

export default FreehandEditor
