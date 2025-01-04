import { EditOutlined } from '@ant-design/icons'
import { Spin, Tooltip } from 'antd-next'
import { Modal } from 'components/antd/staged'
import GenericBlock from 'components/shared/Blocks/GenericBlock'
import { useCallback } from 'react'
import styled from 'styled-components'
import { BlockContent } from 'util/blocks/interfaces'
import useCallMavis from 'util/useCallMavis'
import useToggle from 'util/useToggle'

const BLOCK_SLUG = 'dataset_plotter'
const BLOCK_VERSION = 1

const IconContainer = styled.div`
  &:hover {
    cursor: pointer;
  }
`

interface Props {
  onSubmit: (data: BlockContent) => void
  datasetConfig: {
    datasetSlug: string
    groupSlug: string
    plotSlug: string
  }
}

const EditPlotIconModal = ({ onSubmit, datasetConfig }: Props) => {
  const [open, toggleOpen] = useToggle(false)
  const { datasetSlug, groupSlug, plotSlug } = datasetConfig

  const submitCallback = useCallback(
    ({ content }: { content: BlockContent[] }) => {
      // Block response returns an array, first object will be kind: 'json' with the plotConfig:
      const plotConfig = content?.[0]?.value as BlockContent
      if (!plotConfig) return null

      onSubmit(plotConfig)

      toggleOpen()
    },
    [onSubmit, toggleOpen]
  )

  // get block plotter data
  const { response: blockPlotData, loading: loadingBlockPlotData } = useCallMavis<{
    data: any
    internal_cache: any
    schema: any
    ui_schema: any
  }>({
    method: 'POST',
    path: '/v1/dataset/plot/load',
    body: {
      dataset_slug: datasetSlug,
      group_slug: groupSlug,
      plot_slug: plotSlug,
    },
  })

  return (
    <div>
      <Tooltip title="Edit Plot">
        <IconContainer>
          <EditOutlined onClick={toggleOpen} />
        </IconContainer>
      </Tooltip>

      <Modal open={open} onCancel={toggleOpen} destroyOnClose width="95%" footer={null}>
        <Spin spinning={loadingBlockPlotData}>
          {blockPlotData?.data && (
            <GenericBlock
              initialFormData={blockPlotData.data}
              slug={BLOCK_SLUG}
              version={BLOCK_VERSION}
              submitCallback={submitCallback}
              bg="white"
              padded={false}
            />
          )}
        </Spin>
      </Modal>
    </div>
  )
}

export default EditPlotIconModal
