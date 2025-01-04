import { flatten, flattenDeep, map } from 'lodash'

import { getGreenTagToken, getRegularToken, getSpaceToken, IToken } from '@/components/shared/TagContent'
import { IRemoteParentColumn, IRemotePrefilterColumn } from '@/stores/datasets'

import { KEYWORDS, SPACE } from './constants'
import { compileBooleanExpression } from './expressionCompilers'

export const compilePrefilterColumns = (columns: IRemotePrefilterColumn[]): IToken[] => {
  const compilePrefilterColumn = (column: IRemotePrefilterColumn) => {
    const spaceToken = getSpaceToken(SPACE)
    const columnLabelToken = getGreenTagToken(column.label)
    const booleanExpressionTokens = compileBooleanExpression(column.filters)
    return [columnLabelToken, spaceToken, ...booleanExpressionTokens]
  }
  return flattenDeep(map(columns, compilePrefilterColumn))
}

export const compileParentColumns = (columns: IRemoteParentColumn[]): IToken[] => {
  const compileParentColumn = (column: IRemoteParentColumn, index: number): IToken[] => {
    const spaceToken = getSpaceToken(SPACE)
    const columnToken = getGreenTagToken(column.label)
    const andToken = getRegularToken(KEYWORDS.and)
    if (columns.length === 1) return [columnToken]
    if (index < columns.length - 1) return [columnToken, spaceToken]
    return [andToken, spaceToken, columnToken]
  }

  const spaceToken = getSpaceToken(SPACE)
  const columnTokens = flatten(map(columns, compileParentColumn))
  const add = getRegularToken(KEYWORDS.add)
  return [add, spaceToken, ...columnTokens]
}
