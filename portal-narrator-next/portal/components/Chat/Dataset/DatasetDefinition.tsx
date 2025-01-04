import DatasetDefinitionForm from './DatasetDefinitionForm'
import { FormValue } from './interfaces'

interface Props {
  values: Record<string, unknown>
  onSubmit: (data: FormValue) => Promise<void>
  isViewMode: boolean
}

function DatasetDefinition({ values, onSubmit, isViewMode }: Props) {
  return (
    <DatasetDefinitionForm
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore values is not typed
      defaultValues={values}
      onSubmit={onSubmit}
      isViewMode={isViewMode}
    />
  )
}

export default DatasetDefinition
