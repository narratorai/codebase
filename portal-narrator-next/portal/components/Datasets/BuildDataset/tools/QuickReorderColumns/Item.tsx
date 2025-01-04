import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { Typography } from 'components/shared/jawns'
import { find, startCase } from 'lodash'
import { getGroupColumnAndColumnType, getGroupIndex } from 'machines/datasets/helpers'
import { useContext } from 'react'
import { useFormContext } from 'react-hook-form'

interface Props {
  index: number
}

/**
 * Each individual column
 */
const Item = ({ index }: Props) => {
  const { selectedApiData, groupSlug, machineCurrent } = useContext(DatasetFormContext)
  const { context } = machineCurrent
  const { column_mapping: columnMapping } = selectedApiData

  const { watch } = useFormContext()
  const colIds = watch('colIds')
  const columnId = colIds[index]
  // use selectedApiData as a fallback column label
  const defaultLabel = find(columnMapping, ['id', columnId])?.label

  // find column in machine context to get label (accounts for renames)
  const getLabel = () => {
    // Get column from group
    if (groupSlug) {
      const groupIndex = getGroupIndex({ context, groupSlug })
      const group = context.all_groups[groupIndex]
      const { column } = getGroupColumnAndColumnType({ group, columnId })
      return column?.label || defaultLabel
    }

    // Get column from parent
    return find(context.columns, ['id', columnId])?.label || defaultLabel
  }

  const label = getLabel()

  return (
    <Typography px={1} data-test="quick-reorder-columns-item">
      {startCase(label)}
    </Typography>
  )
}

export default Item
