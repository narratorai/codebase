import { List, Spin } from 'antd-next'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { Box } from 'components/shared/jawns'
import { get, groupBy, isEmpty } from 'lodash'
import { useContext } from 'react'
import { useFormContext } from 'react-hook-form'
import { animated, useTransition } from 'react-spring'
import styled from 'styled-components'
import { colors } from 'util/constants'
import { COLUMN_KIND_COMPUTED, COMPUTATION_COLOR } from 'util/datasets'

import ColumnLabel from './ColumnLabel'
import ColumnRow from './ColumnRow'
import InfoPanelActivity from './InfoPanelActivity'
import InfoPanelAddButton from './InfoPanelAddButton'
import InfoPanelSection from './InfoPanelSection'
import TitleRow from './TitleRow'

const DisabledColumnLabel = styled(ColumnLabel)`
  color: ${({ theme }) => theme.colors.gray500};
`

const ParentColumns = () => {
  const { machineCurrent, machineSend } = useContext(DatasetFormContext)
  const { context: machineContext } = machineCurrent
  const { _plan_execution: planExecution } = machineContext || {}

  const { watch } = useFormContext()

  const definitionLoading = machineCurrent.matches({ api: 'loading_definition' })
  const definitionUpdating = machineCurrent.matches({ api: 'updating_definition' })
  const definitionSubmitting = machineCurrent.matches({ api: 'submitting_definition' })
  const submittingActivityColumns = machineCurrent.matches({ api: 'submitting_activity_columns' })
  const definitionReconciling = machineCurrent.matches({ api: 'reconciling_response' })
  const processing = definitionUpdating || definitionSubmitting || definitionReconciling || submittingActivityColumns

  const definitionEditing = machineCurrent.matches({ edit: 'definition' })
  const reconcilerEditing = machineCurrent.matches({ edit: 'reconciler' })
  const editMode = definitionEditing || reconcilerEditing
  const columnDefinitions = editMode
    ? planExecution?.staged_dataset?.query?.columns || []
    : machineContext?.columns || []
  const activityDefinitions = editMode
    ? planExecution?.staged_dataset?.query?.activities || []
    : machineContext?.activities || []

  const hasCohortActivity = machineContext.activities.length > 0

  const columnsGroupedByActivityId = groupBy(columnDefinitions, (val) => {
    const activityId = get(val, 'source_details.activity_id')
    if (activityId) {
      return activityId
    }
    // Assume all columns that don't have a source_details.activity_id are computed
    return 'computed'
  })

  const computedColumnDefinitions = columnsGroupedByActivityId.computed || []

  // Let's grab the cohort activity id's so we can
  // determine if we should render the Cohort info panel
  // or not. For example, on new Datasets before a cohort
  // is selected
  const cohortFieldValue = watch('cohort')
  const appendActivities = watch('append_activities')

  /////////////////////////////////////////////
  // Animating a react-final-form-arrays list!
  /////////////////////////////////////////////
  //
  // Map over appendActivities and assemble the proper config for useTransiton
  // { fieldName: string; key: string; }
  //
  // Any time the key in useTransition is updated, the animation will fire!
  // see machineServices for where _last_updated gets set
  // (it's set any time activity_ids or relationship_slug are updated)!
  const animatedCohortActivityConfig = {
    fieldName: 'cohort',
    key: cohortFieldValue?._last_updated || 'cohort',
  }
  const animatedAppendActivityConfigs =
    appendActivities?.map((activity: any, index: number) => {
      const fieldName = `append_activities.${index}`
      return {
        fieldName,
        // add index to last updated to ensure unique key when duplicating append columns
        key: activity._last_updated ? activity._last_updated + index || fieldName : fieldName,
      }
    }) || []

  const activityTransitions = useTransition<{ fieldName: string; key: string }, any>(
    [animatedCohortActivityConfig, ...animatedAppendActivityConfigs],
    (item) => item.key,
    {
      from: { backgroundColor: colors['white'] },
      enter: (item) => async (next: any) => {
        // FOR INITIAL LOAD - item.key will always equal item.fieldName
        // key is either fieldValue._last_updated or fieldName
        // if it's the fieldName, then don't trigger the animation!
        if (item.key === item.fieldName) {
          return
        }
        // Flash a yellow background to alert the user that this activity has changed!
        await next({ backgroundColor: colors['yellow100'] })
        await next({ backgroundColor: colors['white'] })
      },
      leave: { display: 'none' },
    }
  )

  return (
    <Spin spinning={definitionLoading || processing} wrapperClassName="spinner">
      {/* DEFAULT Read Only Mode */}
      {!editMode &&
        activityDefinitions.map((activityDefinition, index) => {
          return (
            <InfoPanelActivity
              key={activityDefinition.id}
              bg="white"
              activityDefinition={activityDefinition}
              columnDefinitions={columnsGroupedByActivityId[activityDefinition.id]}
              appendActivityFieldIndex={index === 0 ? undefined : index - 1}
              // NOTE, the first activity definition will always be the cohort activity
              activityFieldName={index === 0 ? 'cohort' : `append_activities[${index - 1}]`}
            />
          )
        })}

      {/* EDIT Dataset Defintiion Mode */}
      {editMode &&
        !isEmpty(cohortFieldValue.activity_ids) &&
        activityTransitions.map(({ item, props, key }, index) => {
          return (
            <animated.div key={key} style={props}>
              <InfoPanelActivity
                appendActivityFieldIndex={item.fieldName === 'cohort' ? undefined : index - 1}
                activityFieldName={item.fieldName}
              />
            </animated.div>
          )
        })}

      {hasCohortActivity && (
        <InfoPanelSection leftBorderColor={COMPUTATION_COLOR} disabled={editMode} data-test="info-panel-computation">
          <TitleRow
            color={COMPUTATION_COLOR}
            title="COMPUTATION COLUMNS"
            description="Computed columns can be used to create calculations between columns in your data."
          />

          <Box>
            <List size="small">
              {computedColumnDefinitions.map((columnDefinition) => (
                <List.Item key={columnDefinition.id}>
                  {editMode ? (
                    <DisabledColumnLabel columnLabel={columnDefinition.label} />
                  ) : (
                    <ColumnRow columnDefinition={columnDefinition} columnKind={COLUMN_KIND_COMPUTED} />
                  )}
                </List.Item>
              ))}
            </List>

            {!editMode && (
              <InfoPanelAddButton
                className="add-button"
                buttonText="Add Column"
                onClick={() => machineSend({ type: 'EDIT_COMPUTATION' })}
              />
            )}
          </Box>
        </InfoPanelSection>
      )}
    </Spin>
  )
}

export default ParentColumns
