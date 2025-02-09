import { App, Modal } from 'antd-next'
import { Box, Typography } from 'components/shared/jawns'
import ResultProgressLoader from 'components/shared/ResultProgressLoader'
import { TransformationFromQuery } from 'components/Transformations/TransformationIndex/interfaces'
import { ITransformation } from 'graph/generated'
import { useEffect } from 'react'
import { handleMavisErrorNotification } from 'util/useCallMavis'

import useDeleteTransformation from './useDeleteTransformation'

const makeLoadingConfig = (table: ITransformation['table']) => [
  {
    percent: 15,
    duration: 7,
    text: `Deleting the data from your ${table}.`,
  },
  {
    percent: 70,
    duration: 35,
    text: 'Applying any special logic to UNDO the impact of this activity (Undoing Removelist or Identity Resolution).',
  },
  {
    percent: 90,
    duration: 46,
    text: 'Deleting the Activity (if needed) or its relationship with the transformation.',
  },
]

interface Props {
  transformation: ITransformation | TransformationFromQuery
  onClose: () => void
}

const DeleteTransformationModal = ({ transformation, onClose }: Props) => {
  const { table } = transformation
  const options = makeLoadingConfig(table)

  const { notification } = App.useApp()
  const [deleteTransformation, { loading, error, deleted }] = useDeleteTransformation()

  useEffect(() => {
    if (error) {
      handleMavisErrorNotification({ error, notification })
    }
  }, [error, notification])

  useEffect(() => {
    if (deleted) onClose()
  }, [deleted, onClose])

  const handleOk = () => {
    deleteTransformation(transformation?.id)
  }

  return (
    <Modal
      data-test="delete-transformation-modal"
      title={<Typography type="title400">Delete Transformation</Typography>}
      open={!!transformation}
      onCancel={onClose}
      okButtonProps={{ danger: true }}
      onOk={handleOk}
      destroyOnClose
    >
      {!loading && (
        <Box>
          <Typography type="title400">
            {' '}
            Are you sure you want to delete <b>{transformation?.name}</b>?
          </Typography>

          <Box mt={2}>
            <Typography>Narrator will do the following:</Typography>
            <Box ml={4}>
              <ul>
                <li>Delete the transformation</li>
                <li>Delete the data from the table</li>
                <li>
                  Delete all activities that are <b>only</b> generated by this Transformation
                </li>
              </ul>
            </Box>
          </Box>
        </Box>
      )}

      {loading && !error && <ResultProgressLoader options={options} />}
    </Modal>
  )
}

export default DeleteTransformationModal
