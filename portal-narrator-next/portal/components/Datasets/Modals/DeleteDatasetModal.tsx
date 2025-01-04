import { Alert, Spin } from 'antd-next'
import { Modal } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'
import { useDeleteDataset } from 'components/Datasets/hooks'
import { DatasetFromQuery } from 'components/Datasets/interfaces'
import { Box, Typography } from 'components/shared/jawns'
import { isEmpty, startCase } from 'lodash'
import { useEffect } from 'react'
import { useHistory } from 'react-router-dom'

interface Props {
  dataset: DatasetFromQuery
  onClose: () => void
  refetchDatasets?: () => void
  to?: string
}

const DeleteDatasetModal = ({ dataset, onClose, refetchDatasets, to }: Props) => {
  const company = useCompany()
  const history = useHistory()

  const [deleteDataset, { deleted, loading, error }] = useDeleteDataset()

  const handleOk = () => {
    deleteDataset(dataset?.id)
  }

  useEffect(() => {
    // on successful deletion - close the modal
    if (deleted) {
      onClose()

      // and update dataset index (don't show deleted dataset)
      // if on index page
      if (refetchDatasets) {
        refetchDatasets()
      }

      if (to) {
        history.push(`/${company.slug}${to}`)
      }
    }
  }, [deleted, onClose, company, history, to, refetchDatasets])

  return (
    <Modal
      title={<Typography type="title400">Delete Dataset</Typography>}
      open={!isEmpty(dataset)}
      onCancel={() => {
        onClose()
      }}
      onOk={handleOk}
      okButtonProps={{ danger: true, 'data-test': 'confirm-delete-dataset' }}
    >
      <Spin spinning={loading}>
        {error && (
          <Box mb={2}>
            <Alert message="Error" description={error.message} type="error" closable showIcon />
          </Box>
        )}

        <Typography type="title400">
          {' '}
          Are you sure you want to delete <b>{startCase(dataset?.name)}</b>?
        </Typography>
      </Spin>
    </Modal>
  )
}

export default DeleteDatasetModal
