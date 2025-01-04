import { find } from 'lodash'
import { RouteChildrenProps } from 'react-router'

import EditDimBlock from './EditDimBlock'
import { DimTables } from './interfaces'

type RouterProps = RouteChildrenProps<{ id?: string }>

interface Props extends RouterProps {
  allDimTables?: DimTables
}

const EditDimTable = ({ allDimTables, match }: Props) => {
  const tableId = match?.params?.id
  const tableName = find(allDimTables, ['id', tableId])?.table

  // unmount EditDimBlock when tableId changes
  // to reset the path in getDimTableBlock
  return (
    <div key={tableId}>
      <EditDimBlock tableId={tableId} tableName={tableName} />
    </div>
  )
}

export default EditDimTable
