import { FilterValueInput } from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm'
import { ValueKindOptionOverrides } from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm/ValueKindSelect'
import { ColumnFilterOption } from 'components/Datasets/Explore/interfaces'
import { COLUMN_TYPE_STRING } from 'util/datasets'

interface Props {
  fieldName: string
  column: ColumnFilterOption['column']
  valueKindOptionOverrides?: ValueKindOptionOverrides
}

const RenderFilterValueInput = ({ column, fieldName, valueKindOptionOverrides }: Props) => (
  <FilterValueInput
    hideFilterKind
    columnValues={column?.values}
    columnId={column?.name}
    columnType={column?.type || COLUMN_TYPE_STRING}
    filterFieldName={fieldName}
    valueKindOptionOverrides={valueKindOptionOverrides}
  />
)

export default RenderFilterValueInput
