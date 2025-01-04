import { Alert, Button, Drawer, Space, Spin, Tooltip } from 'antd-next'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import DatasetDefinitionContent from 'components/Datasets/BuildDataset/tools/DatasetDefinition/DatasetDefinitionContent'
import MachineError from 'components/Datasets/BuildDataset/tools/shared/MachineError'
import { Box, Flex } from 'components/shared/jawns'
import { IActivity } from 'graph/generated'
import { isEmpty } from 'lodash'
import { BaseSyntheticEvent, useContext } from 'react'
import styled, { css } from 'styled-components'
import { IDatasetFormContext } from 'util/datasets/interfaces'

export const DRAWER_HEIGHT = '55vh'

// disabled all clicks events on kpi_locked activities
export const StyledActivityContent = styled(Box)<{ disabled: boolean }>`
  ${({ disabled }) =>
    disabled &&
    css`
      pointer-events: none;
      opacity: 0.5;
      cursor: not-allowed;
    `}
`

interface Props {
  handleSubmit: (e?: BaseSyntheticEvent<object, any, any> | undefined) => Promise<void>
  invalid: boolean
  drawerVisible: boolean
  streamActivities?: IActivity[]
}

const DatasetDefinition = ({ handleSubmit, invalid, drawerVisible = false, streamActivities }: Props) => {
  const { machineCurrent, machineSend, activitiesLoading, datasetSlug } =
    useContext<IDatasetFormContext>(DatasetFormContext)
  const { _definition_context: definitionContext, kpi, activities } = machineCurrent.context
  const selectedActivityStream = machineCurrent.context.activity_stream

  const isKpi = !isEmpty(kpi)
  const cohortKpiLocked = !!activities?.[0]?.kpi_locked

  const mainReady = machineCurrent.matches({ main: 'ready' })
  const mainNew = machineCurrent.matches({ main: 'new' })
  const definitionLoading = machineCurrent.matches({ api: 'loading_definition' })
  const definitionUpdating = machineCurrent.matches({ api: 'updating_definition' })
  const definitionSubmitting = machineCurrent.matches({ api: 'submitting_definition' })
  const definitionReconciling = machineCurrent.matches({ api: 'reconciling_response' })

  const activityIds = definitionContext?.form_value?.cohort?.activity_ids
  const processing = definitionUpdating || definitionSubmitting || definitionReconciling

  const onClose = () => {
    // Only allow close on edit (not mainNew)
    if (mainReady) {
      machineSend('CANCEL_EDIT_DEFINITION')
    }
  }

  return (
    <Drawer
      placement="top"
      open={drawerVisible}
      closable={false}
      keyboard={false}
      height={DRAWER_HEIGHT}
      // Render drawer in current dom:
      getContainer={false}
      style={{
        position: 'absolute',
        overflow: 'hidden',
        width: '96%',
        margin: '2%',
      }}
      footer={
        <Box px={1}>
          <Space>
            <Tooltip title={invalid ? 'Please enter all required fields' : undefined}>
              <Button
                disabled={processing || invalid}
                type="primary"
                htmlType="submit"
                onClick={handleSubmit}
                data-test="dataset-definition-submit"
              >
                Submit
              </Button>
            </Tooltip>

            {mainReady && (
              <Button data-test="cancel-edit-definition-changes" onClick={onClose}>
                Cancel
              </Button>
            )}
          </Space>
        </Box>
      }
    >
      <Flex style={{ height: '100%' }} data-public>
        <Spin
          spinning={definitionLoading || processing || activitiesLoading}
          style={{ minHeight: 400 }}
          wrapperClassName="spinner"
        >
          <Box style={{ minWidth: 680 }}>
            <MachineError />

            {isKpi && (
              <Box mb={2}>
                <Alert
                  message="Kpi Dataset"
                  description={`This is part of the ${kpi?.name} definition and some activities cannot be edited.`}
                  type="warning"
                />
              </Box>
            )}

            <DatasetDefinitionContent
              processing={processing}
              focusOnLoad={mainNew && drawerVisible && isEmpty(activityIds)}
              visible={drawerVisible}
              selectedActivityStream={selectedActivityStream}
              cohortKpiLocked={cohortKpiLocked}
              machineCurrent={machineCurrent}
              machineSend={machineSend}
              streamActivities={streamActivities}
              datasetSlug={datasetSlug}
              isExplore={false}
            />
          </Box>
        </Spin>
      </Flex>
    </Drawer>
  )
}

export default DatasetDefinition
