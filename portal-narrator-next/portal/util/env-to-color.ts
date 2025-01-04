import { colors } from './constants'

export interface IBuildEvn {
  [key: string]: string
}

const envColors: IBuildEvn = {
  development: colors.red600,
  review: colors.yellow600,
  staging: colors.orange600,
}

// takes in an build ENV value and returns
// a CSS color value based on the environment
export const envToColor = (str: string): string => envColors[str]
