import { PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd-next'
import { ListItemCard } from 'components/shared/jawns'
import { map } from 'lodash'
import { FieldArray } from 'react-final-form-arrays'

import OrderField from './OrderField'

interface Props {
  collectionFieldName: string
  defaultValues?: {
    order?: 'asc' | 'desc'
  }
  omitColumnIds?: string[] | number[]
}

const OrderColumns = ({ collectionFieldName = 'source_details.order', defaultValues, omitColumnIds = [] }: Props) => {
  return (
    <FieldArray name={collectionFieldName}>
      {({ fields }) => {
        return (
          <>
            <OrderField
              columnFieldName={`${collectionFieldName}[0].column_id`}
              directionFieldName={`${collectionFieldName}[0].order_direction`}
              omitColumnIds={[...omitColumnIds, ...map(fields.value, 'column_id')]}
              defaultValues={defaultValues}
            />

            {fields.map((fieldName, index) => {
              if (index === 0) {
                return null
              }

              return (
                <ListItemCard key={fieldName} onClose={() => fields.remove(index)}>
                  <OrderField
                    columnFieldName={`${fieldName}.column_id`}
                    directionFieldName={`${fieldName}.order_direction`}
                    omitColumnIds={[...omitColumnIds, ...map(fields.value, 'column_id')]}
                    defaultValues={defaultValues}
                    asCard
                  />
                </ListItemCard>
              )
            })}

            <Button
              type="dashed"
              shape="round"
              icon={<PlusOutlined />}
              onClick={() => {
                // Because we always render at least one field (even if fields.value.length === 0)
                // if for some reason the form only has no Order fields,
                // make sure to add two, so it looks like you're just adding a second field:
                if (fields.length === 0) {
                  fields.push({ column_id: null, order_direction: null })
                }
                fields.push({ column_id: null, order_direction: null })
              }}
            >
              Add another column
            </Button>
          </>
        )
      }}
    </FieldArray>
  )
}

export default OrderColumns
