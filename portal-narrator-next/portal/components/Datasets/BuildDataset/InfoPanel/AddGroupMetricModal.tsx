import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { useContext } from 'react'
import { getGroupFromContext } from 'util/datasets'

import GroupMetricModal from './GroupMetricModal'

const AddGroupMetricModal = () => {
  const { groupSlug, machineCurrent } = useContext(DatasetFormContext) || {}

  const visible = machineCurrent.matches({ edit: 'metrics' })
  const group = getGroupFromContext({ context: machineCurrent.context, groupSlug })

  if (!group || !visible) {
    return null
  }

  return <GroupMetricModal visible={visible} />
}

export default AddGroupMetricModal
