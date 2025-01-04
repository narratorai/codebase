import _ from 'lodash'
import { Layout } from 'react-grid-layout'

import { ALL_PLOT_TYPES, CONTENT_TYPE_MARKDOWN } from 'util/narratives/constants'
import { DASHBOARD_LAYOUT_VERSION_1 } from 'util/dashboards/constants'
import {
  DEFAULT_GRID_LAYOUT,
  DEFAULT_GRID_LAYOUT_MIN_WIDTH,
  DEFAULT_GRID_LAYOUT_MIN_HEIGHT,
  DEFAULT_GRID_LAYOUT_PLOT_MIN_WIDTH,
  DEFAULT_GRID_LAYOUT_PLOT_MIN_HEIGHT,
  DEFAULT_GRID_LAYOUT_MARKDOWN_MIN_HEIGHT,
} from 'components/Narratives/Dashboards/BuildDashboard/constants'

interface FormatGridItemDimensionsProps {
  version?: number
  itemLayout?: Layout
  contentType?: string
}

// backfill old dashboard items with a layout that fits
// the grid's dimensions
export const formatGridItemDimensions = ({ version, itemLayout, contentType }: FormatGridItemDimensionsProps) => {
  // if the dashboard items have already been updated
  if (version === DASHBOARD_LAYOUT_VERSION_1) {
    // return the itemLayout as is (backup with Default - but shouldn't happen)
    return itemLayout || DEFAULT_GRID_LAYOUT
  }

  // if dashboard items have never been updated
  if (!_.isFinite(version)) {
    // format item to match version 1 layout

    // plots vs all other content have different minH/minW
    const isPlotContent = _.includes(ALL_PLOT_TYPES, contentType)

    // calculate min height based on content type
    // (plots should be bigger while markdown should be smaller than)
    const minH = getGridItemMinH(contentType)

    return !_.isEmpty(itemLayout)
      ? {
          ...itemLayout,
          h: itemLayout.h * 4 * 0.8,
          y: itemLayout.y * 4 * 0.9,
          w: itemLayout.w * 5 * 0.85,
          x: itemLayout.x * 5 * 0.9,
          minW: isPlotContent ? DEFAULT_GRID_LAYOUT_PLOT_MIN_WIDTH : DEFAULT_GRID_LAYOUT_MIN_WIDTH,
          minH,
        }
      : { ...DEFAULT_GRID_LAYOUT, minH }
  }

  // shouldn't happen, but if there is a bad version or something
  // return either the itemLayout or the default
  return !_.isEmpty(itemLayout) ? itemLayout : DEFAULT_GRID_LAYOUT
}

export const getGridItemMinH = (contentType?: string) => {
  const isPlotContent = _.includes(ALL_PLOT_TYPES, contentType)
  const isMarkdownContent = contentType === CONTENT_TYPE_MARKDOWN

  let minH = DEFAULT_GRID_LAYOUT_MIN_HEIGHT
  if (isPlotContent) {
    minH = DEFAULT_GRID_LAYOUT_PLOT_MIN_HEIGHT
  }

  if (isMarkdownContent) {
    minH = DEFAULT_GRID_LAYOUT_MARKDOWN_MIN_HEIGHT
  }

  return minH
}
