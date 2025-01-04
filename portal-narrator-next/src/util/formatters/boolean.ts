import { BOOLEAN_ACTIONS } from './constants'

export const formatBoolean = (value: boolean): string => value.toString()

export const formatBooleanAction = (value: boolean): string => (value ? BOOLEAN_ACTIONS.true : BOOLEAN_ACTIONS.false)
