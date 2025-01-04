import { Modal, Spin } from 'antd-next'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { Typography } from 'components/shared/jawns'
import { useContext } from 'react'
import { getGroupFromContext } from 'util/datasets'

import MachineError from '../shared/MachineError'
import EditPlotForm from './EditPlotForm'

const EditPlotModal = () => {
  const { machineCurrent, machineSend, groupSlug } = useContext(DatasetFormContext)
  const loadingPlotForm = machineCurrent.matches({ api: 'loading_plot_form' })

  const visible = machineCurrent.matches({ edit: 'group_plot' })
  const { _plotter_context } = machineCurrent.context
  const isEdit = _plotter_context?.is_edit
  const group = getGroupFromContext({ context: machineCurrent.context, groupSlug })

  const handleClose = () => {
    machineSend('EDIT_PLOT_CANCEL')
  }

  if (!group) {
    return null
  }

  return (
    <Modal
      data-test="edit-plots-modal"
      title={
        <Typography type="title400">{loadingPlotForm ? 'Loading...' : isEdit ? 'Edit Plot' : 'New Plot'}</Typography>
      }
      open={visible}
      onCancel={handleClose}
      width="95%"
      footer={null}
      style={{ top: '5%' }}
    >
      <Spin spinning={loadingPlotForm}>
        <MachineError />
        <EditPlotForm />
      </Spin>
    </Modal>
  )
}

export default EditPlotModal
