import { every } from 'lodash'
import pluralize from 'pluralize'

import { getBoldToken, getRegularToken, getSpaceToken, IToken } from '@/components/shared/TagContent'
import {
  IRemoteAbsoluteTimeDetails,
  IRemoteAnyFilter,
  IRemoteBooleanFilter,
  IRemoteColumnToColumnFilter,
  IRemoteNullFilter,
  IRemoteNumberArrayFilter,
  IRemoteNumberFilter,
  IRemoteRelativeTimeDetails,
  IRemoteStartOfTimeDetails,
  IRemoteStringArrayFilter,
  IRemoteStringFilter,
  IRemoteTimeCondition,
  IRemoteTimeFilter,
  IRemoteVariableFilter,
  NumberArrayOperator,
  NumberOperator,
  StringArrayOperator,
  StringOperator,
  TimeReference,
} from '@/stores/datasets'

import {
  BOOLEAN_OPERATOR,
  KEYWORDS,
  NULL_OPERATOR,
  NUMBER_ARRAY_OPERATOR,
  NUMBER_OPERATOR,
  SPACE,
  STRING_ARRAY_OPERATOR,
  STRING_OPERATOR,
  TIME_REFERENCE,
  TIME_RESOLUTION,
} from './constants'

export const compileRelativeTimeDetails = (details: IRemoteRelativeTimeDetails): IToken[] => {
  const resolution = TIME_RESOLUTION[details.resolution]
  const resolutions = pluralize(resolution, details.value)
  const value = String(details.value)
  const spaceToken = getSpaceToken(SPACE)
  const resolutionsToken = getBoldToken(resolutions)
  const valueToken = getBoldToken(value)
  const agoToken = getBoldToken(KEYWORDS.ago)
  return [valueToken, spaceToken, resolutionsToken, spaceToken, agoToken]
}

export const compileAbsoluteTimeDetails = (details: IRemoteAbsoluteTimeDetails): IToken[] => {
  const dateTime = details.dateTime // TODO Format date time
  const token = getBoldToken(dateTime)
  return [token]
}

export const compileStartOfTimeDetails = (details: IRemoteStartOfTimeDetails): IToken[] => {
  const resolution = TIME_RESOLUTION[details.resolution]
  const spaceToken = getSpaceToken(SPACE)
  const startOfToken = getRegularToken(TIME_REFERENCE.start_of)
  const resolutionToken = getRegularToken(resolution)
  return [startOfToken, spaceToken, resolutionToken]
}

export const compileTimeCondition = (condition: IRemoteTimeCondition | null): IToken[] => {
  if (!condition) return []
  const { reference, details } = condition
  if (reference === TimeReference.Relative) return compileRelativeTimeDetails(details as IRemoteRelativeTimeDetails)
  if (reference === TimeReference.Absolute) return compileAbsoluteTimeDetails(details as IRemoteAbsoluteTimeDetails)
  if (reference === TimeReference.StartOf) return compileStartOfTimeDetails(details as IRemoteStartOfTimeDetails)
  return []
}

export const compileTimeFilter = (filter: IRemoteTimeFilter): IToken[] => {
  const spaceToken = getSpaceToken(SPACE)
  const fromToken = getRegularToken(KEYWORDS.from)
  const toToken = getRegularToken(KEYWORDS.to)
  const fromConditionTokens = compileTimeCondition(filter.fromCondition)
  const toConditionTokens = compileTimeCondition(filter.toCondition)
  const from = fromConditionTokens.length > 0 ? [fromToken, spaceToken, ...fromConditionTokens] : []
  const to = toConditionTokens.length > 0 ? [toToken, spaceToken, ...toConditionTokens] : []
  return [...from, ...to]
}

export const compileNullFilter = (filter: IRemoteNullFilter): IToken[] => {
  const operator = NULL_OPERATOR[filter.operator]
  const token = getBoldToken(operator)
  return [token]
}

export const compileNumberFilter = (filter: IRemoteNumberFilter): IToken[] => {
  const operator = NUMBER_OPERATOR[filter.operator]
  const value = `${filter.value}`
  const spaceToken = getSpaceToken(SPACE)
  const operatorToken = getRegularToken(operator)
  const valueToken = getBoldToken(value)
  return [operatorToken, spaceToken, valueToken]
}

export const compileNumberArrayFilter = (filter: IRemoteNumberArrayFilter): IToken[] => {
  const operator = NUMBER_ARRAY_OPERATOR[filter.operator]
  const value = filter.values.join(', ')
  const spaceToken = getSpaceToken(SPACE)
  const operatorToken = getRegularToken(operator)
  const valueToken = getBoldToken(value)
  return [operatorToken, spaceToken, valueToken]
}

export const compileStringFilter = (filter: IRemoteStringFilter): IToken[] => {
  const operator = STRING_OPERATOR[filter.operator]
  const value = `'${filter.value}'`
  const spaceToken = getSpaceToken(SPACE)
  const operatorToken = getRegularToken(operator)
  const valueToken = getBoldToken(value)
  return [operatorToken, spaceToken, valueToken]
}

export const compileStringArrayFilter = (filter: IRemoteStringArrayFilter): IToken[] => {
  const operator = STRING_ARRAY_OPERATOR[filter.operator]
  const value = filter.values.map((value) => `'${value}'`).join(', ')
  const spaceToken = getSpaceToken(SPACE)
  const operatorToken = getRegularToken(operator)
  const valueToken = getBoldToken(value)
  return [operatorToken, spaceToken, valueToken]
}

export const compileBooleanFilter = (filter: IRemoteBooleanFilter): IToken[] => {
  const operator = BOOLEAN_OPERATOR[filter.operator]
  const value = `${filter.value}`
  const spaceToken = getSpaceToken(SPACE)
  const operatorToken = getRegularToken(operator)
  const valueToken = getBoldToken(value)
  return [operatorToken, spaceToken, valueToken]
}

export const compileVariableFilter = (filter: IRemoteVariableFilter): IToken[] => {
  if (filter.operator in NUMBER_OPERATOR) {
    return compileNumberFilter({
      operator: filter.operator as NumberOperator,
      value: Number(filter.variable) as number,
    })
  }
  if (filter.operator in NUMBER_ARRAY_OPERATOR) {
    return compileNumberArrayFilter({
      operator: filter.operator as NumberArrayOperator,
      values: filter.variable.split(',').map(Number),
    })
  }
  if (filter.operator in STRING_OPERATOR) {
    return compileStringFilter({ operator: filter.operator as StringOperator, value: filter.variable })
  }
  if (filter.operator in STRING_ARRAY_OPERATOR) {
    return compileStringArrayFilter({
      operator: filter.operator as StringArrayOperator,
      values: filter.variable.split(','),
    })
  }
  return []
}

export const compileFilter = (filter: IRemoteAnyFilter | IRemoteColumnToColumnFilter): IToken[] => {
  if ('value' in filter) {
    if (typeof filter.value === 'boolean') return compileBooleanFilter(filter as IRemoteBooleanFilter)
    if (typeof filter.value === 'number') return compileNumberFilter(filter as IRemoteNumberFilter)
    if (typeof filter.value === 'string') return compileStringFilter(filter as IRemoteStringFilter)
  }
  if ('values' in filter) {
    if (every(filter.values, (value) => typeof value === 'number'))
      return compileNumberArrayFilter(filter as IRemoteNumberArrayFilter)
    if (every(filter.values, (value) => typeof value === 'string'))
      return compileStringArrayFilter(filter as IRemoteStringArrayFilter)
  }
  if ('variable' in filter) return compileVariableFilter(filter as IRemoteVariableFilter)
  if ('columnId' in filter) return [] // TODO compileColumnToColumnFilter(filter as IRemoteColumnToColumnFilter)
  if ('fromCondition' in filter || 'toCondition' in filter) return compileTimeFilter(filter as IRemoteTimeFilter)
  return compileNullFilter(filter as IRemoteNullFilter)
}
