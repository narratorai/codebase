import { colors } from 'util/constants'
import { CONTENT_TYPE_MARKDOWN, CONTENT_TYPE_TABLE, CONTENT_TYPE_TABLE_V2 } from 'util/narratives/constants'

export const INNER_CONTENT_VETICAL_PADDING = 16
export const INNER_CONTENT_HORIZONTAL_PADDING = 32
export const INNER_CONTENT_BORDER_RADIUS = 8

// V0 sizing and layout was:
// DEFAULT_GRID_LAYOUT = { w: 6, h: 6, x: 0, y: 0, minH: 1 }
// DEFAULT_PLOT_GRID_LAYOUT = { w: 11, h: 11, x: 0, y: 0, minH: 2 }
// ROW_HEIGHT 50
// DASHBOARD_COLS = 12  (the default for RGL)

// V1 sizing and layout:
export const DEFAULT_GRID_LAYOUT_MIN_WIDTH = 5
export const DEFAULT_GRID_LAYOUT_MIN_HEIGHT = 6
export const DEFAULT_GRID_LAYOUT_PLOT_MIN_WIDTH = 10
export const DEFAULT_GRID_LAYOUT_PLOT_MIN_HEIGHT = 12
export const DEFAULT_GRID_LAYOUT_MARKDOWN_MIN_HEIGHT = 3
export const DEFAULT_GRID_LAYOUT = {
  w: 12,
  h: 15,
  x: 0,
  y: 0,
  minW: DEFAULT_GRID_LAYOUT_MIN_WIDTH,
  minH: DEFAULT_GRID_LAYOUT_MIN_HEIGHT,
}
export const DEFAULT_PLOT_GRID_LAYOUT = {
  w: 30,
  h: 20,
  x: 0,
  y: 0,
  minW: DEFAULT_GRID_LAYOUT_PLOT_MIN_WIDTH,
  minH: DEFAULT_GRID_LAYOUT_PLOT_MIN_HEIGHT,
}
export const ROW_HEIGHT = 10 // was originally 50
export const DASHBOARD_COLS = 48 // 4x the default
export const DASHBOARD_MARGIN: [number, number] = [10, 10]

export const SECTION_TAB_QUERY_KEY = 'tab'

export const ALLOW_OVERFLOW_EDIT_CONTENT_TYPES = [CONTENT_TYPE_MARKDOWN, CONTENT_TYPE_TABLE, CONTENT_TYPE_TABLE_V2]

export const DASHBOARD_BACKGROUND_COLOR = colors.gray100
