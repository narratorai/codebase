import _ from 'lodash'

import { NULL_FORMAT_VALUE } from './ValueFormatter'

const LinkCellRenderer = ({ value }: { value: string | null }) => {
  if (value) {
    return (
      <a href={value} target="_blank" rel="noreferrer">
        {value}
      </a>
    )
  }

  return NULL_FORMAT_VALUE
}

export interface ILinkColumn {
  format: string
  label: string
}

export const findLinkColumns = (columnMappings: ILinkColumn[], tableRows: Record<string, any>[]) => {
  if (_.isEmpty(columnMappings) || _.isEmpty(tableRows)) {
    return []
  }

  const columns = columnMappings
    .filter((column) => column.format === 'id' || column.format === 'string')
    .map((column) => column.label)
  const linkColumns = []

  const sample = tableRows.length >= 100 ? Math.floor(tableRows.length / 100) : 1

  // Loop through every nth row, checking each potential column
  // for a link. If the value is null keep going. If it's not
  // a link then stop checking that column.
  for (let i = 0; i < tableRows.length; i += sample) {
    const row = tableRows[i]

    for (let j = 0; j < columns.length; j++) {
      // regular for loop b/c we're modifying columns array as we loop
      const column = columns[j]
      const value = row[column]

      if (typeof value === 'string' && value.startsWith('http')) {
        linkColumns.push(column)
      }

      if (!_.isEmpty(value)) {
        // remove the column from our list: a non-null value is either a link, and we're done processing, or is not a link, in which
        // case we assume the rest of the values won't be links either
        columns.splice(j, 1)
        j--
      }
    }

    if (columns.length === 0) {
      // no need to keep checking once all the columns have been found
      break
    }
  }

  return linkColumns
}

export default LinkCellRenderer
