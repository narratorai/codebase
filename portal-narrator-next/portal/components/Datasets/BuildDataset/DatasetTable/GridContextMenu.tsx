import { ColDef, ColGroupDef } from '@ag-grid-community/core'
import { RowData } from 'components/shared/DataTable/interfaces'
import { Menu } from 'components/shared/menus'

import ItemsWithProps from './ItemsWithProps'

export const GRID_CONTEXT_MENU_ID = 'dataset_table_grid_menu'

interface Props {
  selectCustomerJourney: Function
  propsFromTrigger?: {
    cellValue: string | null
    columnHeader: string
    columnId: string
    columnType: string
    rowData: RowData
    selectedRows: RowData[]
    columnDefs: ColDef | ColGroupDef
  }
}

const GridContextMenu = ({ selectCustomerJourney, ...props }: Props) => {
  return (
    <Menu id={GRID_CONTEXT_MENU_ID}>
      <ItemsWithProps selectCustomerJourney={selectCustomerJourney} {...props} />
    </Menu>
  )
}

export default GridContextMenu
