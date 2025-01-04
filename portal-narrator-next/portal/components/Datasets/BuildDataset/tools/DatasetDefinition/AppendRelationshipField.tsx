import { Input } from 'antd-next'
import { FormItem, SearchSelect } from 'components/antd/staged'
import { cloneDeep, get, includes, isEmpty, set } from 'lodash'
import React, { useCallback, useContext, useEffect } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import {
  ALL_BETWEEN_RELATIONSHIPS,
  ALL_EVER_RELATIONSHIPS,
  BETWEEN_NOT_ALLOWED_OCCURENCES,
  BETWEEN_RELATIONSHIP_OVERRIDES,
} from 'util/datasets'
import { required } from 'util/forms'

import AddAppendFilterButton from './AdvancedFilters/AddAppendFilterButton'
import DatasetDefinitionContext from './DatasetDefinitionContext'
import { IDatasetDefinitionContext } from './interfaces'

interface Props {
  name: string
  drawerVisible: boolean
  appendIndex: number
  relationshipOptions: { label: string; value: string }[]
  isViewMode?: boolean
}

const AppendRelationshipField: React.FC<Props> = ({
  name,
  drawerVisible,
  appendIndex,
  relationshipOptions,
  isViewMode = false,
}) => {
  const { watch, setValue, control } = useFormContext()

  const { machineSend } = useContext<IDatasetDefinitionContext>(DatasetDefinitionContext)

  const values = watch()
  const appendRelationship = watch(name)

  const onChangeOverride = useCallback(
    (value: any) => {
      setValue(name, value, { shouldValidate: true })

      if (!isEmpty(value)) {
        // if switching to an "EVER" relationship
        // clear out the append/join activities time filter
        // (in data world it doesn't makes sense to have time filters for EVER relationships)
        const copyValues = cloneDeep(values)
        const updatedValues = set(copyValues, name, value)
        if (includes(ALL_EVER_RELATIONSHIPS, value)) {
          updatedValues.append_activities[appendIndex].time_filters = []
        }

        // update the relationship in machine's "_definition_context"
        // (any updates to ^^ triggers form state to reset to ^^)
        machineSend('SELECT_RELATIONSHIP', {
          activityIds: values.append_activities[appendIndex].activity_ids,
          fieldIndex: appendIndex,
          relationshipSlug: value,
          formValue: updatedValues,
        })
      }
    },
    [values, appendIndex, name, machineSend, setValue]
  )

  const cohortOccurence = values?.cohort?.occurrence_filter?.occurrence
  const betweenNotAllowed = includes(BETWEEN_NOT_ALLOWED_OCCURENCES, cohortOccurence)
  const isBetweenRelationship = includes(ALL_BETWEEN_RELATIONSHIPS, appendRelationship)
  // if cohort is a BETWEEN_NOT_ALLOWED_OCCURENCES (i.e. "first")
  // update any append/join relationships that are "in between" to "after"
  // i.e. first_in_between -> first_after
  useEffect(() => {
    if (drawerVisible && betweenNotAllowed && isBetweenRelationship) {
      const updatedValue: string = get(BETWEEN_RELATIONSHIP_OVERRIDES, appendRelationship, appendRelationship)

      onChangeOverride(updatedValue)
    }
  }, [drawerVisible, betweenNotAllowed, isBetweenRelationship, onChangeOverride, appendRelationship])

  return (
    <Controller
      control={control}
      name={name}
      rules={{ validate: required }}
      render={({ field, fieldState: { isTouched, error } }) => (
        <FormItem noStyle meta={{ touched: isTouched, error: error?.message }}>
          <Input.Group compact>
            <SearchSelect
              style={{ minWidth: 180 }}
              placeholder="Select relationship"
              options={relationshipOptions}
              optionFilterProp="label"
              data-test="append-relationship-select"
              {...field}
              onChange={onChangeOverride}
            />
            {!isViewMode && <AddAppendFilterButton parentFieldName={`append_activities.${appendIndex}`} />}
          </Input.Group>
        </FormItem>
      )}
    />
  )
}

export default AppendRelationshipField
