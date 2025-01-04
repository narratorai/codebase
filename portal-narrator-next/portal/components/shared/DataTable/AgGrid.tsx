import '@ag-grid-community/styles/ag-grid.css'
import '@ag-grid-community/styles/ag-theme-balham-no-font.css'

import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'
import { AgGridReact, AgGridReactProps } from '@ag-grid-community/react'
import { ForwardedRef, forwardRef } from 'react'

const AgGrid = (props: AgGridReactProps, ref: ForwardedRef<AgGridReact>) => {
  return <AgGridReact modules={[ClientSideRowModelModule]} ref={ref} {...props} />
}

export default forwardRef(AgGrid)
