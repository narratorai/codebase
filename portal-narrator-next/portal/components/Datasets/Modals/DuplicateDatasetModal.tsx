import { Alert, Input, Spin } from 'antd-next'
import { FormItem, Modal } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'
import { Box, Typography } from 'components/shared/jawns'
import { isEmpty } from 'lodash'
import { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import usePrevious from 'util/usePrevious'

import { useDuplicateDataset } from '../hooks'
import { DatasetFromQuery } from '../interfaces'

interface Props {
  dataset: DatasetFromQuery
  onClose: () => void
}

const DuplicateDatasetModal = ({ dataset, onClose }: Props) => {
  const company = useCompany()
  const history = useHistory()

  // newDatasetName comes from input box - allowing user to rename the new column
  const [newDatasetName, setNewDatasetName] = useState(`${dataset?.name} Copy` || '')
  const prevNewDatasetName = usePrevious(newDatasetName)

  const [
    duplicateDataset,
    { loading: duplicateLoading, saved: duplicateSaved, data: duplicateResponse, error: duplicateError },
  ] = useDuplicateDataset()

  // make sure newDatasetName has a value if it has never been set before
  useEffect(() => {
    if (isEmpty(prevNewDatasetName) && isEmpty(newDatasetName) && dataset) {
      setNewDatasetName(`${dataset?.name} Copy`)
    }
  }, [dataset, prevNewDatasetName, newDatasetName])

  // redirect to newly duplicated dataset on creation
  useEffect(() => {
    if (duplicateSaved && duplicateResponse) {
      onClose()
      if (duplicateResponse?.dataset_slug) {
        history.push(`/${company.slug}/datasets/edit/${duplicateResponse?.dataset_slug}`)
      }
    }
  }, [duplicateSaved, duplicateResponse, company, history, onClose])

  const handleOk = () => {
    duplicateDataset({ name: newDatasetName, id: dataset?.id })
  }

  return (
    <Modal
      title={
        <Typography type="title400">
          Duplicate: <b>{dataset?.name}</b>
        </Typography>
      }
      open={!isEmpty(dataset)}
      onCancel={() => {
        onClose()
      }}
      onOk={() => {
        handleOk()
      }}
      okButtonProps={{ disabled: isEmpty(newDatasetName), 'data-test': 'confirm-duplicate-dataset' }}
    >
      <Spin spinning={duplicateLoading}>
        {duplicateError && (
          <Alert message="Error" description={duplicateError.message} type="error" closable showIcon />
        )}

        <Box>
          <FormItem label="Rename your new dataset">
            <Input
              data-test="duplicate-dataset-name-input"
              defaultValue={`${dataset?.name} Copy`}
              onChange={(e) => {
                setNewDatasetName(e.target.value)
              }}
              style={{ minWidth: 472 }}
            />
          </FormItem>

          {duplicateError && (
            <Box mb={2}>
              <Alert message="Error" description={duplicateError.message} type="error" closable showIcon />
            </Box>
          )}
        </Box>
      </Spin>
    </Modal>
  )
}

export default DuplicateDatasetModal
