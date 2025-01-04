import { FilterOutlined } from '@ant-design/icons'
import { Button } from 'antd-next'
import { isEmpty } from 'lodash'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { DEFAULT_COLUMN_FILTER } from 'util/datasets'

interface Props {
  parentFieldName: string
  disabled?: boolean
}

const AddCohortFilterButton = ({ parentFieldName, disabled = false }: Props) => {
  const { watch, control } = useFormContext()

  const activityIds = watch(`${parentFieldName}.activity_ids`)
  const { append: addColumnFilter } = useFieldArray({ control, name: `${parentFieldName}.column_filters` })

  return (
    <Button
      size="large"
      disabled={isEmpty(activityIds) || disabled}
      onClick={() => addColumnFilter(DEFAULT_COLUMN_FILTER)}
    >
      <FilterOutlined />
    </Button>
  )
}

export default AddCohortFilterButton
