import { Input } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { IActivity } from 'graph/generated'
import { isEmpty, isEqual } from 'lodash'
import { useCallback, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import styled, { css } from 'styled-components'
import { BEHAVIOR_COLOR, DEFINITION_ACTIVITY_TYPE_COHORT, OCCURRENCE_TIME } from 'util/datasets'
import { DatasetMachineState } from 'util/datasets/interfaces'
import usePrevious from 'util/usePrevious'

import ActivityStreamSelect from '../ActivityStreamSelect'
import ActivitySearchFormItem from './ActivitySearchFormItem'
import AddCohortFilterButton from './AdvancedFilters/AddCohortFilterButton'
import AdvancedFilters from './AdvancedFilters/AdvancedFilters'
import OccurrenceFilter from './AdvancedFilters/OccurrenceFilter'
import AppendActivities from './AppendActivities'
import DatasetDefinitionContext from './DatasetDefinitionContext'

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
  focusOnLoad?: boolean
  visible: boolean
  selectedActivityStream?: string | null
  cohortKpiLocked?: boolean
  processing: boolean
  shouldSetDefaultActivityStream?: boolean
  machineCurrent: DatasetMachineState
  machineSend: Function
  streamActivities?: IActivity[]
  datasetSlug?: string
  isExplore?: boolean
  hideActivityStreamSelect?: boolean
  isViewMode?: boolean
}

// eslint-disable-next-line max-lines-per-function
const DatasetDefinitionContent = ({
  focusOnLoad,
  visible,
  selectedActivityStream,
  cohortKpiLocked,
  processing,
  shouldSetDefaultActivityStream,
  machineCurrent,
  machineSend,
  streamActivities,
  datasetSlug,
  isExplore = false,
  hideActivityStreamSelect = false,
  isViewMode = false,
}: Props) => {
  const company = useCompany()
  const { watch, reset } = useFormContext()

  const hasMultipleStreams = company?.tables?.length > 1
  const occurrenceValue: string | undefined = watch('cohort.occurrence_filter.occurrence')
  const prevOccurrenceValue = usePrevious(occurrenceValue)
  const occurrenceFilterTimeSelected = occurrenceValue === OCCURRENCE_TIME

  const prevSelectedActivityStream = usePrevious(selectedActivityStream)

  // RESET form state when changing the activity stream
  useEffect(() => {
    if (prevSelectedActivityStream && !isEqual(prevSelectedActivityStream, selectedActivityStream)) {
      reset({
        activity_ids: [],
        column_options: [],
        cohort: {
          activity_ids: [],
          occurrence_filter: {
            occurrence: 'all',
          },
        },
      })
    }
  }, [reset, prevSelectedActivityStream, selectedActivityStream])

  const activityStream = machineCurrent.context.activity_stream

  const handleOnCohortChange = useCallback(
    ({ value, values }: { value: string[]; values: Object }) => {
      machineSend('SELECT_COHORT_ACTIVITY', {
        activityIds: value,
        formValue: values,
      })
    },
    [machineSend]
  )

  return (
    // This content can be controlled by different machines
    // i.e. BuildDataset vs Explore
    // Listen to this provider for correct machine
    <DatasetDefinitionContext.Provider
      value={{
        machineCurrent,
        machineSend,
        activityStream,
        streamActivities,
        datasetSlug,
        isExplore,
      }}
    >
      <Box>
        {!hideActivityStreamSelect && hasMultipleStreams && (
          <Box mb={2}>
            <ActivityStreamSelect
              activityStreamValue={selectedActivityStream}
              setDefaultValueOnEmpty={shouldSetDefaultActivityStream}
            />
          </Box>
        )}

        {/* Cohort Activity Section */}
        <StyledActivityContent disabled={cohortKpiLocked || isEmpty(selectedActivityStream)}>
          <Flex alignItems="center">
            <Typography type="title400" fontWeight="bold">
              Give me
            </Typography>
            <Box ml={1}>
              {occurrenceFilterTimeSelected ? (
                <Flex alignItems="center">
                  <OccurrenceFilter occurrenceValue={occurrenceValue} prevOccurrenceValue={prevOccurrenceValue} />
                </Flex>
              ) : (
                <Input.Group compact>
                  <OccurrenceFilter occurrenceValue={occurrenceValue} prevOccurrenceValue={prevOccurrenceValue} />
                  {!isViewMode && <AddCohortFilterButton parentFieldName="cohort" disabled={processing} />}
                </Input.Group>
              )}
            </Box>

            {!occurrenceFilterTimeSelected && (
              <>
                <Box mx={1} data-test="dataset-definition-activity-search">
                  <ActivitySearchFormItem
                    selectProps={{ tabIndex: 0, size: 'large' }}
                    inputColor={BEHAVIOR_COLOR}
                    focusOnLoad={focusOnLoad}
                    fieldName="cohort.activity_ids"
                    onFieldChange={handleOnCohortChange}
                    processing={processing}
                  />
                </Box>
                <Typography type="title400" fontWeight="bold">
                  activities…
                </Typography>
              </>
            )}
          </Flex>
          <Box pl={100} style={{ overflow: 'hidden' }}>
            <AdvancedFilters activityType={DEFINITION_ACTIVITY_TYPE_COHORT} isViewMode={isViewMode} />
          </Box>
        </StyledActivityContent>

        {/* Append Activities Section */}
        <Box mt={2} ml={2}>
          <AppendActivities processing={processing} drawerVisible={visible} isViewMode={isViewMode} />
        </Box>
      </Box>
    </DatasetDefinitionContext.Provider>
  )
}

export default DatasetDefinitionContent
