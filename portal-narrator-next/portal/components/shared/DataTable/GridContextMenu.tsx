import { ColDef, ColGroupDef } from '@ag-grid-community/core'
import { copyCsv, copyJson } from 'components/shared/DataTable/helpers'
import { RowData } from 'components/shared/DataTable/interfaces'
import { Item, Menu } from 'components/shared/menus'
import { FC } from 'react'
import styled from 'styled-components'
import { colors } from 'util/constants'

interface ItemGridProps {
  menuId: string
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

const StyledItem = styled(Item)`
  &:hover {
    background-color: ${colors.gray200};
  }
`

// menuId must be unique or will crash
// https://github.com/fkhadra/react-contexify/issues/115
const GridContextMenu: FC<ItemGridProps> = ({ menuId, ...props }) => {
  return (
    // ensure that context menu super-imposes over modals
    <Menu id={menuId} style={{ zIndex: 1000 }}>
      <ItemsWithProps {...props} />
    </Menu>
  )
}

type ItemsWithPropsProps = Omit<ItemGridProps, 'menuId'>

const ItemsWithProps: React.FC<ItemsWithPropsProps> = ({ propsFromTrigger }) => {
  const rowData = propsFromTrigger?.rowData
  const selectedRows = propsFromTrigger?.selectedRows
  const columnDefs = propsFromTrigger?.columnDefs

  const handleCopyJson = () => {
    copyJson({ rowData, selectedRows, columnDefs })
  }

  const handleCopyCsv = () => {
    copyCsv({ rowData, selectedRows, columnDefs })
  }

  return (
    <div>
      <StyledItem id="copy-json" onClick={handleCopyJson}>
        Copy JSON
      </StyledItem>
      <StyledItem id="copy-csv" onClick={handleCopyCsv}>
        Copy CSV
      </StyledItem>
    </div>
  )
}

export default GridContextMenu
