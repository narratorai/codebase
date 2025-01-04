import { flatten, flattenDeep, map } from 'lodash'

import { getBoldToken, getRegularToken, getSpaceToken, IToken } from '@/components/shared/TagContent'
import {
  IRemoteBooleanExpression,
  IRemoteJoinConditon,
  IRemoteJoinConditonExpression,
  LogicalOperator,
  NumberOperator,
  StringOperator,
} from '@/stores/datasets'

import { KEYWORDS, LOGICAL_OPERATOR, NUMBER_OPERATOR, SPACE, STRING_OPERATOR } from './constants'
import { compileFilter } from './filterCompilers'

export const compileGroupExpression = (tokens: IToken[]): IToken[] => {
  const openParenthesis = getRegularToken(KEYWORDS.open_parenthesis)
  const closeParenthesis = getRegularToken(KEYWORDS.close_parenthesis)
  return [openParenthesis, ...tokens, closeParenthesis]
}

export const compileNotExpression = (tokens: IToken[]): IToken[] => {
  const spaceToken = getSpaceToken(SPACE)
  const notToken = getRegularToken(KEYWORDS.not)
  const groupedTokens = compileGroupExpression(tokens)
  return [notToken, spaceToken, ...groupedTokens]
}

export const compileLogicalExpression = (tokenGroups: any[], logicalOperator: LogicalOperator): IToken[] => {
  const operator = LOGICAL_OPERATOR[logicalOperator]
  const compileTokenGroup = (tokens: any, index: number) => {
    if (index < tokenGroups.length - 1) {
      const spaceToken = getSpaceToken(SPACE)
      const operatorToken = getRegularToken(operator)
      return [tokens, spaceToken, operatorToken, spaceToken]
    } else {
      return [tokens]
    }
  }

  return flatten(map(tokenGroups, compileTokenGroup))
}

export const _compileBooleanExpression = (expression: IRemoteBooleanExpression): IToken[] => {
  const { logicalOperator, operands, isNot } = expression
  const tokenGroups = map(operands, (operand) => {
    if ('logicalOperator' in operand) {
      return compileGroupExpression(_compileBooleanExpression(operand))
    } else {
      return compileFilter(operand)
    }
  })

  if (isNot) return compileNotExpression(compileLogicalExpression(tokenGroups, logicalOperator))
  return compileLogicalExpression(tokenGroups, logicalOperator)
}

export const compileBooleanExpression = (expression: IRemoteBooleanExpression | null): IToken[] => {
  return expression ? flattenDeep(_compileBooleanExpression(expression)) : []
}

export const compileJoinConditon = (join: IRemoteJoinConditon): IToken[] => {
  const operator =
    join.operator in STRING_OPERATOR
      ? STRING_OPERATOR[join.operator as StringOperator]
      : NUMBER_OPERATOR[join.operator as NumberOperator]
  const cohortColumnLabel = join.cohortColumn.label
  const columnLabel = join.column.label

  const spaceToken = getSpaceToken(SPACE)
  const operatorToken = getRegularToken(operator)
  const cohortColumnLabelToken = getBoldToken(cohortColumnLabel)
  const columnLabelToken = getBoldToken(columnLabel)
  return [cohortColumnLabelToken, spaceToken, operatorToken, spaceToken, columnLabelToken]
}

export const _compileJoinConditonExpression = (expression: IRemoteJoinConditonExpression): IToken[] => {
  const { logicalOperator, operands } = expression
  const tokenGroups = map(operands, (operand) => {
    if ('logicalOperator' in operand) {
      return compileGroupExpression(_compileJoinConditonExpression(operand))
    } else {
      return compileJoinConditon(operand)
    }
  })

  return compileLogicalExpression(tokenGroups, logicalOperator)
}

export const compileJoinConditonExpression = (expression: IRemoteJoinConditonExpression | null): IToken[] => {
  return expression ? flattenDeep(_compileJoinConditonExpression(expression)) : []
}
