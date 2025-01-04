import { Box } from 'components/shared/jawns'
import ReorderList from 'components/shared/ReorderList'
import { useFieldArray, useFormContext } from 'react-hook-form'

import Item from './Item'

/**
 * The container for all the columns
 */
const ColumnOrders = () => {
  const { control } = useFormContext()
  const { fields, move } = useFieldArray({ control, name: 'colIds' })

  return (
    <Box data-test="quick-reorder-columns-content">
      <ReorderList
        moveItem={move}
        items={fields.map((fieldName, index) => ({
          key: fieldName.id,
          id: fieldName.id,
          index,
          component: <Item index={index} />,
        }))}
        listStyle={{ maxHeight: '520px', overflowY: 'auto' }}
      />
    </Box>
  )
}

export default ColumnOrders
