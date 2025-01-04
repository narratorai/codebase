import { App, Input, Modal, Spin } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import { useCompany } from 'components/context/company/hooks'
import { DatasetFromQuery } from 'components/Datasets/interfaces'
import { useEffect, useState } from 'react'
import { makeShortid } from 'util/shortid'
import { useLazyCallMavis } from 'util/useCallMavis'

interface Props {
  dataset: DatasetFromQuery
  queryDefinition?: any
  onClose: () => void
}

// Originally created to save a copy of a dataset from a narrative/dashboard
// But also used in BuildDataset for duplicate dataset:
// will save a copy of the dataset, including with unsaved changes
const CopyFromNarrativeDatasetModal = ({ dataset, queryDefinition, onClose }: Props) => {
  const company = useCompany()
  const { notification } = App.useApp()
  const [datasetName, setDatasetName] = useState(`${dataset.name} Copy`)
  const [createCopyDataset, { response, loading, error }] = useLazyCallMavis<any>({
    method: 'POST',
    path: `/v1/dataset/update`,
  })

  // handle successful creation of copy
  useEffect(() => {
    if (!!response && !error) {
      // open the copy in a new tab
      if (response?.dataset_slug) {
        window.open(`${window.location.origin}/${company.slug}/datasets/edit/${response.dataset_slug}`, '_blank')
      }

      // show success notification
      notification.success({
        key: 'copy-from-dataset-success',
        placement: 'topRight',
        message: response.notification?.message || 'Dataset Copied Successfully',
        duration: null,
      })

      // close the modal
      onClose()
    }
  }, [response, error, notification, company.slug, onClose])

  const onSubmit = () => {
    // when we copy from a narrative, we want to remove the dataset id
    // and make a new slug
    const slug = `${dataset.slug}_${makeShortid()}`
    // DO NOT include materializations!
    createCopyDataset({
      body: {
        name: datasetName,
        slug,
        description: dataset?.description,
        status: dataset?.status,
        dataset: queryDefinition || null,
      },
    })
  }

  return (
    <Spin spinning={loading}>
      <Modal
        title="Save a Copy of this Dataset"
        open
        onCancel={onClose}
        onOk={onSubmit}
        okButtonProps={{ disabled: loading, loading, 'data-test': 'confirm-duplicate-dataset' }}
      >
        <FormItem label="Rename your new dataset">
          <Input
            data-test="copy-from-narrative-dataset-name-input"
            value={datasetName}
            onChange={(e) => {
              setDatasetName(e.target.value)
            }}
            style={{ minWidth: 472 }}
          />
        </FormItem>
      </Modal>
    </Spin>
  )
}

export default CopyFromNarrativeDatasetModal
