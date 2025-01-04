import { SIZES } from './constants'

export type Size = keyof typeof SIZES

export interface ILoading {
  label?: string
  size?: Size
}
