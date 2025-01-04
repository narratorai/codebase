import { List } from 'antd-next'
import { Box, Typography } from 'components/shared/jawns'
import { find, includes, startCase } from 'lodash'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { animated, useTransition } from 'react-spring'
import styled, { css } from 'styled-components'
import { colors } from 'util/constants'
import {
  ATTRIBUTE_COLOR,
  BEHAVIOR_COLOR,
  COLUMN_KIND_ATTRIBUTE,
  COLUMN_KIND_BEHAVIOR,
  COLUMN_KIND_CONVERSION,
  DATASET_ACTIVITY_KIND_ATTRIBUTE,
  DATASET_ACTIVITY_KIND_BEHAVIOR,
  DATASET_ACTIVITY_KIND_CONVERSION,
  OCCURRENCE_CUSTOM,
  OCCURRENCE_METRIC,
  RELATIONSHIP_OPTIONS,
} from 'util/datasets'
import { IDatasetQueryActivity, IDatasetQueryColumn } from 'util/datasets/interfaces'
import { ordinalSuffixOf } from 'util/helpers'

import AdditionalColumnPopover from './AdditionalColumnPopover/AdditionalColumnPopover'
import ColumnRow from './ColumnRow'
import EditColumnRow from './EditColumnRow'
import InfoPanelActivityHeader from './InfoPanelActivityHeader'

const InfoPanelActivityWrapper = styled(Box)<{ isEditMode: boolean }>`
  position: relative;
  border-left: 4px solid ${({ color, theme }) => theme.colors[color as string]};

  ${({ isEditMode }) =>
    !isEditMode &&
    css`
      .add-button {
        transition: opacity 150ms ease-in-out;
        opacity: 0;
      }

      &:hover {
        .add-button {
          opacity: 1;
        }
      }
    `};
`

interface Props {
  appendActivityFieldIndex?: number
  bg?: string
  // Default Read Only Mode Props:
  activityDefinition?: IDatasetQueryActivity
  columnDefinitions?: IDatasetQueryColumn[]
  // Edit Mode Props:
  activityFieldName?: string
}

const InfoPanelActivity = ({
  appendActivityFieldIndex,
  bg,
  activityFieldName,
  activityDefinition,
  columnDefinitions,
}: Props) => {
  const { watch, control } = useFormContext()

  const activityColumns = watch(`${activityFieldName}.columns`) || []
  const { remove: removeActivityColumn } = useFieldArray({
    control,
    name: `${activityFieldName}.columns`,
  })

  // Get activity_id only in edit mode (editing dataset definition)!
  const activityFormValue = watch(`${activityFieldName || '_IGNORE_'}`)

  const isAppend =
    activityDefinition?.kind === DATASET_ACTIVITY_KIND_ATTRIBUTE ||
    includes(activityFieldName, 'append_') ||
    activityDefinition?.kind === DATASET_ACTIVITY_KIND_CONVERSION

  const color = isAppend ? ATTRIBUTE_COLOR : BEHAVIOR_COLOR

  // DEFAULT (get relationship_slug from activityDefinition)
  // EDIT (get relationship_slug from activityFormValue)
  const relationshipSlug = activityDefinition?.relationship_slug || activityFormValue?.relationship_slug
  const relationship = find(RELATIONSHIP_OPTIONS, ['value', relationshipSlug])

  const occurrenceSlug =
    activityDefinition?.kind === DATASET_ACTIVITY_KIND_BEHAVIOR ? activityDefinition.occurrence : null
  const occurrenceLabel =
    occurrenceSlug === OCCURRENCE_CUSTOM && activityDefinition?.occurrence_value
      ? ordinalSuffixOf(activityDefinition.occurrence_value)
      : occurrenceSlug
        ? startCase(occurrenceSlug)
        : null

  const activitySelected = (activityFormValue?.activity_ids || []).length > 0

  ////////////////////////////////////
  // Column Row Animations (Edit Mode Only)
  ////////////////////////////////////
  const animatedColumnRowConfigs = activityColumns?.map((column: any, index: number) => {
    const fieldName = `${activityFieldName}.columns.${index}`
    return {
      fieldName,
      key: fieldName,
      isNew: column._is_new,
    }
  })

  const columnRowTransitions = useTransition<{ fieldName: string; key: string; isNew: boolean }, any>(
    animatedColumnRowConfigs,
    (item) => item?.key,
    {
      from: (item) => {
        // INITIAL VALUES - don't animate initial values
        // only animate when fieldValue._is_new is true
        return {
          width: '100%',
          opacity: item?.isNew ? 0 : 1,
        }
      },
      enter: { width: '100%', opacity: 1 },
      // don't want to transition out when leaving:
      leave: { display: 'none' },
    }
  )
  const isEditMode = !!(activityFieldName && !columnDefinitions)

  // In edit mode, don't show a skeleton activity:
  if (isEditMode && !activitySelected) {
    return null
  }

  return (
    <InfoPanelActivityWrapper
      // Add id prop for scroll control!
      id={isAppend ? `append-activity-${appendActivityFieldIndex}` : 'cohort-activity'}
      bg={bg}
      mb={3}
      color={color}
      data-test={`dataset-info-panel-activity${isAppend ? '-append' : ''}`}
      isEditMode={isEditMode}
    >
      <Box p={2} pb={0}>
        {occurrenceLabel && (
          <Typography type="body300" color={color}>
            {occurrenceLabel}
          </Typography>
        )}

        {/* Don't show relationship label for "limiting" panels */}
        {relationship && activityDefinition?.kind !== DATASET_ACTIVITY_KIND_BEHAVIOR && (
          <Typography type="body300" color={color}>
            {relationship.label}
          </Typography>
        )}

        <InfoPanelActivityHeader
          isAppend={isAppend}
          activityDefinition={activityDefinition}
          activityFieldName={activityFieldName}
        />

        {activityDefinition?.occurrence === OCCURRENCE_METRIC && (
          <Typography type="body300" color={color}>
            {activityDefinition?.occurrence_value} on columns
          </Typography>
        )}
      </Box>

      {/* DEFAULT Read Only Mode */}
      {activityFieldName && columnDefinitions && (
        <>
          <List size="small">
            {columnDefinitions.map((columnDefinition) => {
              const columnKind =
                activityDefinition?.kind === DATASET_ACTIVITY_KIND_CONVERSION
                  ? COLUMN_KIND_CONVERSION
                  : activityDefinition?.kind === DATASET_ACTIVITY_KIND_BEHAVIOR
                    ? COLUMN_KIND_BEHAVIOR
                    : COLUMN_KIND_ATTRIBUTE

              return (
                <List.Item key={columnDefinition.id}>
                  <ColumnRow
                    columnDefinition={columnDefinition}
                    columnKind={columnKind}
                    relationshipSlug={relationshipSlug}
                  />
                </List.Item>
              )
            })}
          </List>
          <Box pb={2}>{activitySelected && <AdditionalColumnPopover activityFieldName={activityFieldName} />}</Box>
        </>
      )}

      {/* EDIT Dataset Definition Mode */}
      {activityFieldName && !columnDefinitions && (
        <>
          <List size="small">
            {columnRowTransitions?.map(({ item, key, props }, index) => (
              <List.Item key={key}>
                <animated.div key={key} style={props}>
                  <EditColumnRow
                    fieldName={item.fieldName}
                    columnName={activityColumns?.[index]?.name}
                    onRemove={() => removeActivityColumn(index)}
                    relationshipSlug={relationshipSlug}
                    activityFieldName={activityFieldName}
                  />
                  {activityColumns?.[index]?.name && (
                    <Typography color={colors.gray500} type="body300">
                      {activityColumns?.[index]?.name}
                    </Typography>
                  )}
                </animated.div>
              </List.Item>
            ))}
          </List>
          <Box pb={2}>{activitySelected && <AdditionalColumnPopover activityFieldName={activityFieldName} />}</Box>
        </>
      )}
    </InfoPanelActivityWrapper>
  )
}

export default InfoPanelActivity
