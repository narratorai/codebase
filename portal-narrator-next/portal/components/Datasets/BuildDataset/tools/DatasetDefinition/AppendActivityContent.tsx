import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  BlockOutlined,
  DeleteOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons'
import { Button, Space, Tooltip } from 'antd-next'
import AppendRelationshipField from 'components/Datasets/BuildDataset/tools/DatasetDefinition/AppendRelationshipField'
import DatasetDefinitionContext from 'components/Datasets/BuildDataset/tools/DatasetDefinition/DatasetDefinitionContext'
import { IDatasetDefinitionContext } from 'components/Datasets/BuildDataset/tools/DatasetDefinition/interfaces'
import { Box, Typography } from 'components/shared/jawns'
import { includes } from 'lodash'
import { useContext } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { semiBoldWeight } from 'util/constants'
import {
  ATTRIBUTE_COLOR,
  BETWEEN_NOT_ALLOWED_OCCURENCES,
  BETWEEN_NOT_ALLOWED_RELATIONSHIP_OPTIONS,
  DEFINITION_ACTIVITY_TYPE_APPEND,
  OCCURRENCE_TIME,
  RELATIONSHIP_OPTIONS,
} from 'util/datasets'
import { IAppendActivity } from 'util/datasets/interfaces'
import { makeShortid } from 'util/shortid'

import ActivitySearchFormItem from './ActivitySearchFormItem'
import AdvancedFilters from './AdvancedFilters/AdvancedFilters'
import { AppendActivitiesProps } from './AppendActivities'
import { StyledActivityContent } from './DatasetDefinition'

interface Props extends AppendActivitiesProps {
  appendActivity: any
  index: number
  openRelationshipModal: () => void
  isViewMode?: boolean
}

// eslint-disable-next-line max-lines-per-function
const AppendActivityContent = ({
  appendActivity,
  index,
  processing,
  drawerVisible,
  openRelationshipModal,
  isViewMode = false,
}: Props) => {
  const { machineSend } = useContext<IDatasetDefinitionContext>(DatasetDefinitionContext)
  const { watch, control, setValue } = useFormContext()

  const occurrenceValue = watch('cohort.occurrence_filter.occurrence')
  const isTimeOccurrence = occurrenceValue === OCCURRENCE_TIME

  const appendActivities = watch('append_activities')
  const { append: addAppendActivity, move } = useFieldArray({
    control,
    name: 'append_activities',
  })

  const handleDuplicateAppendActivity = (activityToDuplicate: IAppendActivity) => {
    const duplicateAppendActivity = {
      ...activityToDuplicate,
      // make sure the new activity has unique key
      _unique_key: makeShortid(),
    }

    addAppendActivity(duplicateAppendActivity)
  }

  const handleDeleteAppendActivity = () => {
    // using useFieldArray's remove was not updating the form state correctly
    // in Chat definition
    const activitiesToUpdate = [...appendActivities]
    activitiesToUpdate.splice(index, 1)
    setValue('append_activities', activitiesToUpdate, { shouldValidate: true })
  }

  const moveAppendUp = (index: number) => {
    const from = index
    const to = index - 1

    machineSend('MOVE_APPEND_ACTIVITY', { from, to, activities: appendActivities })
    move(from, to)
  }

  const moveAppendDown = (index: number) => {
    const from = index
    const to = index + 1

    machineSend('MOVE_APPEND_ACTIVITY', { from, to, activities: appendActivities })
    move(from, to)
  }

  const relationshipOptions = includes(BETWEEN_NOT_ALLOWED_OCCURENCES, occurrenceValue)
    ? BETWEEN_NOT_ALLOWED_RELATIONSHIP_OPTIONS
    : RELATIONSHIP_OPTIONS

  // activies created from kpi cannot be edited
  const appendKpiLocked = !!appendActivity?.kpi_locked

  return (
    <StyledActivityContent disabled={appendKpiLocked} mt={1}>
      <Space align="start">
        <Box mt="5px">
          <Typography type="body50" fontWeight={semiBoldWeight}>
            Join
          </Typography>
        </Box>

        <AppendRelationshipField
          name={`append_activities.${index}.relationship_slug`}
          relationshipOptions={relationshipOptions}
          drawerVisible={drawerVisible}
          appendIndex={index}
          isViewMode={isViewMode}
        />

        {!isViewMode && (
          <Box mr={1}>
            <Tooltip placement="top" title="See how this is generated">
              <Button
                type="link"
                // disable when time cohort (no relationship animation modal available at this time)
                disabled={isTimeOccurrence}
                icon={<QuestionCircleOutlined style={{ fontSize: '14px', color: 'black' }} />}
                onClick={openRelationshipModal}
                style={{ padding: 0, width: 'inherit' }}
              />
            </Tooltip>
          </Box>
        )}

        <ActivitySearchFormItem
          key={`append_activities.${index}`}
          fieldName={`append_activities.${index}.activity_ids`}
          inputColor={ATTRIBUTE_COLOR}
          processing={processing}
          onFieldChange={({ value, values }: { value: string[]; values: any }) => {
            if (value) {
              machineSend('SELECT_APPEND_ACTIVITY', {
                activityIds: value,
                fieldIndex: index,
                relationshipSlug: values.append_activities[index].relationship_slug,
                formValue: values,
              })
            }
          }}
        />

        {!isViewMode && (
          <Box mt="5px" data-test="remove-append-activity">
            <Tooltip placement="right" title="Remove join activity and any associated filters">
              <DeleteOutlined onClick={handleDeleteAppendActivity} />
            </Tooltip>
          </Box>
        )}

        {!isViewMode && (
          <Box mt="5px" data-test="duplicate-append-activity">
            <Tooltip placement="right" title="Duplicate join activity">
              <BlockOutlined
                onClick={() => {
                  handleDuplicateAppendActivity(appendActivity)
                }}
              />
            </Tooltip>
          </Box>
        )}

        {!isViewMode && appendActivities.length - 1 > index && (
          <Box mt="5px" data-test="move-append-activity-down">
            <ArrowDownOutlined onClick={() => moveAppendDown(index)} />
          </Box>
        )}

        {!isViewMode && index !== 0 && (
          <Box mt="5px" data-test="move-append-activity-up">
            <ArrowUpOutlined onClick={() => moveAppendUp(index)} />
          </Box>
        )}
      </Space>

      <Box pl={87} style={{ overflow: 'hidden' }}>
        <AdvancedFilters
          activityType={DEFINITION_ACTIVITY_TYPE_APPEND}
          appendActivityIndex={index}
          isViewMode={isViewMode}
        />
      </Box>
    </StyledActivityContent>
  )
}

export default AppendActivityContent
