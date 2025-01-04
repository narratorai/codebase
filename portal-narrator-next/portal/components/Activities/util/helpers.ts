import { get, includes, lowerCase, some, startsWith } from 'lodash'

export const transformationSearch = (item: any, searchValue: string): boolean => {
  const transformations = get(item, 'transformations')

  // check if any of the transformation names match the search value
  return some(transformations, (trans) => {
    const name = get(trans, 'transformation.name')
    return includes(lowerCase(name), lowerCase(searchValue))
  })
}

// SearchablePathFunction (in searchItems function for Index Search)
// for activity column renames
export const columnRenameSearch = (item: any, searchValue: string): boolean => {
  const columnRenames = get(item, 'column_renames')

  return some(columnRenames, (cName) => {
    const name = get(cName, 'name')
    const label = get(cName, 'label')
    // check if the searched value is in the column_rename's label
    const searchValueInLabel = includes(lowerCase(label), lowerCase(searchValue))

    // also check if this is a feature column ("feature_1", "feature_2", ...)
    if (searchValueInLabel && startsWith(name, 'feature')) {
      return true
    }

    return false
  })
}
