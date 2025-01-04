import _ from 'lodash'
import { getGroupFromContext, getGroupColumns } from './helpers'

import { DatasetContext } from 'util/datasets/interfaces'

//
// These two functions transform the field value from column_id
// to Column Name when displayed and then back again
//
export const freehandStringToColumnName = (
  rawString: string,
  machineContext: DatasetContext,
  groupSlug?: string | null
): string => {
  if (rawString) {
    const group = groupSlug ? getGroupFromContext({ context: machineContext, groupSlug }) : null
    const allColumns = group ? getGroupColumns({ group }) : machineContext.columns
    let convertedValue = rawString

    // sort column ids by length to avoid partially matching an id
    const columns = _.sortBy(allColumns, (val) => val.id.length).reverse()
    columns.forEach((column) => {
      // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
      convertedValue = convertedValue.replace(new RegExp(column.id, 'g'), column.label)
    })

    return convertedValue
  }
  return rawString
}

export const replaceColumnLabelWithId = ({ text, label, id }: { text: string; label: string; id: string }): string => {
  // while replacing labels, make sure the label isn't followed by anything other than empty space or: ) , . + - * / %
  // as we loop through here, we replace label with id, which could otherwise could get matched by similar ids:

  // if convertedValue started as: "no_warehouse_with_docs"
  // column A: { id: "no_warehouse_no_docs_d6KSwtWqn", label: "no_warehouse_with_docs" }
  // column B: { id: "no_warehouse_no_docs_uacoVAsVm", label: "no_warehouse_no_docs" }
  // 1st iteration of convertedValue becomes: "no_warehouse_no_docs_d6KSwtWqn"
  // 2nd iteration of convertedValue becomes: "no_warehouse_no_docs_uacoVAsVm_d6KSwtWqn"

  // hence checking for a following character, will stop column B's label from matching column A's id
  // but not stop them if the column was in a function -- which would end it in a ) or has comma or math operator after it
  // check for a . b/c you can do label.asc

  // the column label might have regex special characters like () or ? in it. E.g. Discount Code (All Users).
  // these have to be escaped to ensure the regex literally matches them
  // This will mean that the label will always be literally matched, no matter what's in it
  const labelLiteral = label.replace(/[()[\]?!.*+^${}|\\]/g, (input) => `\\${input}`)

  // return the full given text with any found labels replaced with the id
  return text.replace(new RegExp(`${labelLiteral}(?![^\\)\\s\\,\\+\\-\\*\\/\\%\\.\\]])`, 'g'), `${id}`)
}

export const freehandStringToColumnId = (
  rawString: string,
  machineContext: DatasetContext,
  groupSlug?: string | null
): string => {
  if (rawString) {
    const group = groupSlug ? getGroupFromContext({ context: machineContext, groupSlug }) : null
    const allColumns = group ? getGroupColumns({ group }) : machineContext.columns
    let convertedValue = rawString

    // Due to spaces, column names can be matched multiple ways. We sort by length (longest first) to ensure we match properly.
    // e.g. if we have New Recurring Revenue and Recurring Revenue, matching Recurring Revenue first will
    // give us 'New recurring_revenue' instead of 'new_recurring_revenue'
    const columns = _.sortBy(allColumns, (val) => val.label.length).reverse()
    columns.forEach((column) => {
      convertedValue = replaceColumnLabelWithId({ text: convertedValue, label: column.label, id: column.id })
    })

    return convertedValue
  }
  return rawString
}
