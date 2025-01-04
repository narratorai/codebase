import { isEmpty } from 'lodash'

export const makeRowsOfThree = (items: any) => {
  const rows = []

  for (let i = 0; i < items?.length || 0; i += 3) {
    const row = [items[i]]
    if (!isEmpty(items[i + 1])) {
      row.push(items[i + 1])
    }
    if (!isEmpty(items[i + 2])) {
      row.push(items[i + 2])
    }

    rows.push(row)
  }

  return rows
}
