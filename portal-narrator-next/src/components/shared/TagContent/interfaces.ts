export type ITokenFormat = 'regular' | 'bold' | 'greenTag' | 'purpleTag' | 'pinkPurpleTag'

export interface IToken {
  format: ITokenFormat
  value: string
}

export interface ILine {
  tokens: IToken[]
}
