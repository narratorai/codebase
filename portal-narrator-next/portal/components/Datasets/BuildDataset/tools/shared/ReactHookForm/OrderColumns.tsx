import { PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd-next'
import { ListItemCard } from 'components/shared/jawns'
import { map } from 'lodash'
import { useFieldArray, useFormContext } from 'react-hook-form'

import OrderField from './OrderField'

interface Props {
  collectionFieldName?: string
  defaultValues?: {
    order?: 'asc' | 'desc'
  }
}

const OrderColumns = ({ collectionFieldName = 'source_details.order', defaultValues }: Props) => {
  const { control, watch } = useFormContext()

  const { remove, append } = useFieldArray({
    control,
    name: collectionFieldName,
  })

  const collectionFieldsValues = watch(collectionFieldName) || []

  return (
    <>
      <OrderField
        columnFieldName={`${collectionFieldName}.0.column_id`}
        directionFieldName={`${collectionFieldName}.0.order_direction`}
        omitColumnIds={map(collectionFieldsValues, 'column_id')}
        defaultValues={defaultValues}
      />

      {/* per https://github.com/react-hook-form/react-hook-form/issues/1564#issuecomment-875566912
          map over values - rather than fields to avoid outdated state
        */}
      {collectionFieldsValues.map((_: unknown, index: number) => {
        const fieldName = `${collectionFieldName}.${index}`

        if (index === 0) {
          return null
        }

        return (
          <ListItemCard key={fieldName} onClose={() => remove(index)}>
            <OrderField
              columnFieldName={`${collectionFieldName}.${index}.column_id`}
              directionFieldName={`${collectionFieldName}.${index}.order_direction`}
              omitColumnIds={map(collectionFieldsValues, 'column_id')}
              defaultValues={defaultValues}
            />
          </ListItemCard>
        )
      })}

      <Button
        type="dashed"
        shape="round"
        icon={<PlusOutlined />}
        onClick={() => append({ column_id: null, order_direction: null })}
      >
        Add another column
      </Button>
    </>
  )
}

export default OrderColumns
