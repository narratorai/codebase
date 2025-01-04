import { CARD_STYLES, ITEM_STYLES, LIST_STYLES } from './constants'

export type Card = keyof typeof CARD_STYLES
export type List = keyof typeof LIST_STYLES
export type Item = keyof typeof ITEM_STYLES
