import { CONTENT_STYLES, ITEM_STYLES } from './constants'

export type Content = keyof typeof CONTENT_STYLES
export type Padding = keyof typeof ITEM_STYLES
export type Position = keyof (typeof ITEM_STYLES)['none']

export type IDivider = { soft?: boolean } & React.ComponentPropsWithoutRef<'hr'>

export type IDividerItem = {
  padding?: Padding
  position?: Position
} & React.ComponentPropsWithoutRef<'div'>

export type IDividerContent = {
  content?: Content
} & Pick<IDivider, 'soft'> &
  React.ComponentPropsWithoutRef<'div'>
