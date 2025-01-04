import { PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd-next'
import { ColumnSelect } from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm'
import { Box, ListItemCard } from 'components/shared/jawns'
import { useFieldArray, useFormContext } from 'react-hook-form'

interface Props {
  baseDatasetColumnOptions?: boolean
  fieldName?: string
}

const GroupColumns = ({ baseDatasetColumnOptions = false, fieldName = 'source_details.group_column_ids' }: Props) => {
  const { control, watch } = useFormContext()
  const { fields, remove, append } = useFieldArray({ control, name: fieldName })

  const fieldsValues = watch(fieldName)

  return (
    <>
      {fields.map((columnFieldName, index) => (
        <ListItemCard key={columnFieldName.id} onClose={() => remove(index)}>
          <ColumnSelect
            baseDatasetColumnOptions={baseDatasetColumnOptions}
            fieldName={`${fieldName}.${index}`}
            omitColumnIds={fieldsValues || []}
          />
        </ListItemCard>
      ))}

      <Box mb={3}>
        <Button type="dashed" shape="round" icon={<PlusOutlined />} onClick={() => append('')}>
          Add another column in group
        </Button>
      </Box>
    </>
  )
}

export default GroupColumns
