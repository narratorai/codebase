import { Extension } from '@tiptap/core'

import GridColumn from './GridColumn'
import GridColumnGutter from './GridColumnGutter'
import HorizontalGrid from './HorizontalGrid'

/**
 * Grid extension that adds the horizontal grid, grid column, and grid column gutter nodes.
 */
export const GridExtension = Extension.create({
  name: 'gridExtension',

  addExtensions() {
    return [HorizontalGrid, GridColumn, GridColumnGutter]
  },
})

export default GridExtension
