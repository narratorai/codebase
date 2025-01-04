import { ReadOutlined } from '@ant-design/icons'
import { Button, Spin, Tooltip } from 'antd-next'
import AnalyzeDataModal from 'components/Datasets/BuildDataset/AnalyzeDataModal'
import AutoSaveToggle from 'components/Datasets/BuildDataset/AutoSaveToggle'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { ACTION_TYPE_QUERY } from 'components/Datasets/BuildDataset/datasetReducer'
import DatasetLockedIcon from 'components/Datasets/DatasetLockedIcon'
import { NarrativeIcon } from 'components/Navbar/NavIcons'
import { Box, BoxProps, Flex, Typography } from 'components/shared/jawns'
import ResourceStateIcon from 'components/shared/ResourceStateIcon'
import { get, isEmpty } from 'lodash'
import { useContext, useState } from 'react'
import { getGroupFromContext, OCCURRENCE_TIME } from 'util/datasets'
import { IDatasetFormContext, IRequestApiData } from 'util/datasets/interfaces'

import DatasetManageMenu from './DatasetManageMenu'

interface Props extends BoxProps {
  handleRunAllTabs: (runOptions?: Record<string, unknown>) => void
}

const GlobalCTA = ({ handleRunAllTabs, ...props }: Props) => {
  const {
    machineCurrent,
    machineSend,
    groupSlug,
    activityStream,
    dataset,
    hasMultipleStreams,
    datasetSlug,
    selectedApiData,
  } = useContext<IDatasetFormContext>(DatasetFormContext) || {}
  const [openingAnalyzeDataModal, setOpeningAnalyzeDataModal] = useState(false)

  const isNewDataset = !datasetSlug
  const editingDefinition = machineCurrent.matches({ edit: 'definition' })
  const showAnalyzeModal = machineCurrent.matches({ edit: 'create_dataset_narrative' })

  // Note with dataset name "N/A" for auto generated datasets:
  const datasetTitle = isNewDataset ? 'Create New Dataset' : dataset?.name || 'N/A'
  const hoverTitle = hasMultipleStreams ? `${datasetTitle} (${activityStream})` : datasetTitle

  const group = getGroupFromContext({ context: machineCurrent.context, groupSlug })

  const isTimeCohort =
    get(machineCurrent, 'context._definition_context.form_value.cohort.occurrence_filter.occurrence') ===
    OCCURRENCE_TIME

  const { kpi } = machineCurrent.context

  const queryData = get(selectedApiData, ACTION_TYPE_QUERY, {} as IRequestApiData)
  const queryLoading = get(queryData, 'loading')

  const handleOpenStory = () => {
    machineSend('EDIT_DATASET_STORY')
  }

  // don't let users click Analyze Button if the dataset is running
  // (potentially wait for count too - but this should be good for now)
  // also don't allow analyze for time cohorts (it wont work)
  const analyzeButtonDisabled = queryLoading || isTimeCohort
  let analyzeButtonDisabledText = ''
  if (queryLoading) {
    analyzeButtonDisabledText = 'Disabled until data is returned'
  }
  if (isTimeCohort) {
    analyzeButtonDisabledText = 'Disabled for time cohorts'
  }

  const toggleAnalyzeModal = () => {
    if (showAnalyzeModal) {
      machineSend('CREATE_DATASET_NARRATIVE_CANCEL')
    } else {
      machineSend('CREATE_DATASET_NARRATIVE')
    }
  }

  return (
    <Box bg="gray200" py={3} {...props} data-public>
      {!isEmpty(kpi) && kpi?.name && (
        <Typography truncate as="div" type="title500" title={kpi.name}>
          {kpi.name}
        </Typography>
      )}

      <Box mb={2}>
        <Flex alignItems="center">
          {dataset?.locked && (
            <Box mr={1}>
              <DatasetLockedIcon />
            </Box>
          )}
          <Typography truncate as="div" type="title300" title={hoverTitle} data-test="dataset-title">
            {datasetTitle}
            {hasMultipleStreams && (
              <Typography as="span" type="body200">
                &nbsp;({activityStream})
              </Typography>
            )}
          </Typography>
        </Flex>

        <Flex alignItems="center">
          {dataset?.status && (
            <Box mr={1}>
              <ResourceStateIcon state={dataset.status} />
            </Box>
          )}

          <Typography truncate as="div" title={group ? group.name : undefined}>
            {editingDefinition ? (
              <strong>EDITING DEFINITION</strong>
            ) : group ? (
              <>
                <strong>GROUP BY</strong> {group.name}
              </>
            ) : (
              <strong>PARENT DATASET</strong>
            )}
          </Typography>
        </Flex>
      </Box>

      <Flex justifyContent="space-between" alignItems="center">
        <Flex>
          <Box mr={1}>
            <Spin spinning={openingAnalyzeDataModal}>
              <Tooltip title={analyzeButtonDisabledText}>
                <div>
                  <Button
                    onClick={toggleAnalyzeModal}
                    icon={<NarrativeIcon />}
                    size="small"
                    data-test="analyze-dataset-button"
                    disabled={analyzeButtonDisabled}
                  >
                    Analyze
                  </Button>
                </div>
              </Tooltip>
            </Spin>
          </Box>

          <Tooltip title="Dataset Story">
            <Button size="small" onClick={handleOpenStory} disabled={isNewDataset}>
              <ReadOutlined data-test="dataset-tab-story-cta" />
            </Button>
          </Tooltip>
        </Flex>

        <DatasetManageMenu onRunAllTabs={handleRunAllTabs} />
      </Flex>

      <AutoSaveToggle />

      {showAnalyzeModal && <AnalyzeDataModal onClose={toggleAnalyzeModal} setOpening={setOpeningAnalyzeDataModal} />}
    </Box>
  )
}

export default GlobalCTA
