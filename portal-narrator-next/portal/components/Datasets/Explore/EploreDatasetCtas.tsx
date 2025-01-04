import { SaveOutlined } from '@ant-design/icons'
import { App, Button, Popover, Tooltip } from 'antd-next'
import { useUpdateDataset } from 'components/Datasets/hooks'
import { Flex } from 'components/shared/jawns'
import { IStatus_Enum } from 'graph/generated'
import { isEmpty } from 'lodash'
import { useEffect } from 'react'

import { ApplyFiltersResponse } from './interfaces'
import SaveDatasetPopoverContent from './SaveDatasetPopoverContent'

interface Props {
  isDirty: boolean
  applyFiltersResponse?: ApplyFiltersResponse
}

const ExploreDatasetCtas = ({ isDirty, applyFiltersResponse }: Props) => {
  const { notification } = App.useApp()
  const [createDataset, { loading: creatingDataset, data: createDatasetData }] = useUpdateDataset({
    isCreating: true,
  })

  useEffect(() => {
    if (createDatasetData?.notification) {
      notification[createDatasetData.notification.type](createDatasetData.notification)
    }
  }, [createDatasetData?.notification])

  const handleCreateDataset = (name: string) => {
    if (applyFiltersResponse?.staged_dataset) {
      createDataset({
        queryDefinition: applyFiltersResponse.staged_dataset,
        name,
        status: IStatus_Enum.Live,
      })
    }
  }

  return (
    <Flex justifyContent="flex-end">
      <Tooltip title={isDirty ? 'Update Output for current data' : 'Save Dataset'}>
        <div>
          <Popover
            title="Save New Dataset"
            trigger="click"
            placement="topLeft"
            content={
              <SaveDatasetPopoverContent
                datasetName={applyFiltersResponse?.staged_dataset?.query?.name}
                onOk={handleCreateDataset}
                loading={creatingDataset}
                createdDatasetSlug={createDatasetData?.dataset_slug}
              />
            }
          >
            <Button size="small" disabled={isDirty || creatingDataset || isEmpty(applyFiltersResponse)}>
              <SaveOutlined />
            </Button>
          </Popover>
        </div>
      </Tooltip>
    </Flex>
  )
}

export default ExploreDatasetCtas
