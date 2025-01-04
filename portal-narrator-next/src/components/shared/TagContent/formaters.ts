import { IToken, ITokenFormat } from './interfaces'

export const getToken = (format: ITokenFormat, value: string): IToken => ({ format, value })

export const getSpaceToken = (size: number = 1): IToken => getToken('regular', ' '.repeat(size))

export const getRegularToken = (value: string): IToken => getToken('regular', value)

export const getBoldToken = (value: string): IToken => getToken('bold', value)

export const getGreenTagToken = (value: string): IToken => getToken('greenTag', value)

export const getPurpleTagToken = (value: string): IToken => getToken('purpleTag', value)

export const getPinkPurpleTagToken = (value: string): IToken => getToken('pinkPurpleTag', value)
