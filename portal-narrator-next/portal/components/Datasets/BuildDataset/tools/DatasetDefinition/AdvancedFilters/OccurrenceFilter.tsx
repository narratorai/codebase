import { DownOutlined, FilterOutlined } from '@ant-design/icons'
import { Button, Dropdown, Input, InputNumber } from 'antd-next'
import { FormItem, SearchSelect } from 'components/antd/staged'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { isEmpty, isEqual, startCase } from 'lodash'
import { readableColor } from 'polished'
import { useCallback, useContext, useEffect } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import styled from 'styled-components'
import {
  BEHAVIOR_COLOR,
  isAllTimeResolution,
  OCCURRENCE_ALL,
  OCCURRENCE_CUSTOM,
  OCCURRENCE_FIRST,
  OCCURRENCE_LAST,
  OCCURRENCE_TIME,
  TIME_COHORT_RESOLUTION_FILTER_FIELDNAME,
} from 'util/datasets'
import { required } from 'util/forms'
import usePrevious from 'util/usePrevious'

import DatasetDefinitionContext from '../DatasetDefinitionContext'
import { IDatasetDefinitionContext } from '../interfaces'
import {
  DEFAULT_TIME_COHORT_RESOLUTION_FILTER_FROM_VALUE,
  DEFAULT_TIME_COHORT_RESOLUTION_FILTER_SEGMENTATION,
  DEFAULT_TIME_COHORT_RESOLUTION_FILTER_TYPE,
} from './AllTimeResolutionFilters'

const StyledDropdownWrapper = styled.div`
  && .antd5-dropdown-trigger {
    background-color: ${({ theme }: { theme: any }) => theme.colors[BEHAVIOR_COLOR]};
    color: ${({ theme }: { theme: any }) => readableColor(theme.colors[BEHAVIOR_COLOR])};
    font-weight: 600;
  }

  && .anticon-down {
    color: ${({ theme }: { theme: any }) => readableColor(theme.colors[BEHAVIOR_COLOR])};
  }
`

const occurrenceOptions = [
  { label: 'All', value: OCCURRENCE_ALL },
  { label: 'First', value: OCCURRENCE_FIRST },
  { label: 'Last', value: OCCURRENCE_LAST },
  { label: 'Nth', value: OCCURRENCE_CUSTOM },
  { label: 'Time', value: OCCURRENCE_TIME },
]

const getResolutionLabel = (resolutionValue: string) => {
  if (resolutionValue === 'year') {
    return 'All Years'
  }

  if (resolutionValue === 'quarter') {
    return 'All Quarters'
  }

  if (resolutionValue === 'month') {
    return 'All Months'
  }

  if (resolutionValue === 'week') {
    return 'All Weeks'
  }

  if (resolutionValue === 'day') {
    return 'All Days'
  }

  return startCase(resolutionValue)
}

interface Props {
  // get prevOccurrenceValue and occurrenceValue from parent since this component unmounts
  // when switching from time/not-time occurrence
  occurrenceValue?: string
  prevOccurrenceValue?: string
}

const OccurrenceFilter = ({ occurrenceValue, prevOccurrenceValue }: Props) => {
  const { machineSend } = useContext<IDatasetDefinitionContext>(DatasetDefinitionContext)

  const { watch, control, setValue } = useFormContext()
  const formValues = watch()

  const occurenceOnChange = useCallback(
    (occurence: string) => {
      setValue('cohort.occurrence_filter.occurrence', occurence, { shouldValidate: true })
    },
    [setValue]
  )

  const resolutionValue = watch('cohort.occurrence_filter.resolution')
  const prevResolutionValue = usePrevious(resolutionValue)

  const isTimeCohort = occurrenceValue === OCCURRENCE_TIME
  const prevIsTimeCohort = prevOccurrenceValue ? prevOccurrenceValue === OCCURRENCE_TIME : undefined
  const isAllTimeResolutionValue = isTimeCohort && isAllTimeResolution(resolutionValue)

  const allTimeResolutionFilterValue = watch(TIME_COHORT_RESOLUTION_FILTER_FIELDNAME)
  const allTimeResolutionFilterOnChange = useCallback(
    (filterValue: { type: string; from_value: string | number; segmentation: string }) => {
      setValue(TIME_COHORT_RESOLUTION_FILTER_FIELDNAME, filterValue, { shouldValidate: true })
    },
    [setValue]
  )

  // refetch the activity columns when changing occurence value
  useEffect(() => {
    const occurrenceValueChanged = prevOccurrenceValue && !isEqual(prevOccurrenceValue, occurrenceValue)

    // typeOfOccurrenceChanged -> watches if it went from/to time cohort <--> normal cohort
    // (we wouldn't need this and could rely on occurrenceValueChanged EXCEPT THAT
    // we unmount this component when switching from/to time/normal occurrence)
    const typeOfOccurrenceChanged = prevIsTimeCohort !== undefined && !isEqual(prevIsTimeCohort, isTimeCohort)

    if ((occurrenceValueChanged || typeOfOccurrenceChanged) && formValues) {
      machineSend('SELECT_COHORT_OCCURRENCE', {
        occurrence: occurrenceValue,
        formValue: formValues,
        changedFromNormalToTimeOccurrence: !prevIsTimeCohort && isTimeCohort,
        changedFromTimeToNormalOccurrence: prevIsTimeCohort && !isTimeCohort,
      })
    }
  }, [prevOccurrenceValue, occurrenceValue, formValues, prevIsTimeCohort, isTimeCohort])

  // if a resolution is selected/updated (in time cohort)
  // fetch new columns and rebuild formValues
  // (we use the resolution as the cohort.activity_ids: [resolution])
  useEffect(() => {
    if (
      formValues &&
      isTimeCohort &&
      prevResolutionValue &&
      resolutionValue &&
      !isEqual(prevResolutionValue, resolutionValue)
    ) {
      machineSend('SELECT_TIME_COHORT_RESOLUTION', {
        timeResolution: resolutionValue,
        isAllTimeResolution: isAllTimeResolutionValue,
        formValue: formValues,
      })
    }
  }, [prevResolutionValue, resolutionValue, formValues, isTimeCohort, isAllTimeResolutionValue])

  // when you click the show all filter options
  const handleSetDefualtAllTimeResolutionFilters = useCallback(() => {
    // set the default resolution filters (if none are currently set)
    if (isEmpty(allTimeResolutionFilterValue?.type)) {
      allTimeResolutionFilterOnChange({
        type: DEFAULT_TIME_COHORT_RESOLUTION_FILTER_TYPE,
        from_value: DEFAULT_TIME_COHORT_RESOLUTION_FILTER_FROM_VALUE,
        segmentation: DEFAULT_TIME_COHORT_RESOLUTION_FILTER_SEGMENTATION,
      })
    }

    // (AllTimeResolutionFilters will show if filters are set)
  }, [allTimeResolutionFilterOnChange, allTimeResolutionFilterValue])

  // Options for the user to select:
  // - "only the (first/last) occurrence"
  // - "only (custom) occurrence number (5)"
  return (
    <>
      <SearchSelect
        data-test="cohort-occurrence-filter"
        popupMatchSelectWidth={false}
        style={{ minWidth: 48 }}
        size="large"
        options={occurrenceOptions}
        onChange={occurenceOnChange}
        value={occurrenceValue}
      />

      {occurrenceValue === OCCURRENCE_CUSTOM && (
        <Controller
          control={control}
          rules={{
            validate: required,
          }}
          name="cohort.occurrence_filter.custom_value"
          render={({ field, fieldState: { isTouched: touched, error } }) => (
            <FormItem noStyle meta={{ touched, error: error?.message }}>
              <InputNumber style={{ borderRadius: 0 }} size="large" min={1} {...field} />
            </FormItem>
          )}
        />
      )}

      {isTimeCohort && (
        <Flex alignItems="center">
          <Typography type="title400" fontWeight="bold" mx={1}>
            for
          </Typography>
          <Input.Group compact>
            <Box>
              <Controller
                control={control}
                rules={{
                  validate: required,
                }}
                name="cohort.occurrence_filter.resolution"
                render={({ field, fieldState: { isTouched: touched, error } }) => {
                  const handleSelect = (e: any) => {
                    const selectedKey = e?.key
                    if (selectedKey) {
                      field.onChange(selectedKey)
                    }
                  }

                  return (
                    <FormItem noStyle meta={{ touched, error: error?.message }}>
                      <StyledDropdownWrapper>
                        <Dropdown
                          trigger={['click']}
                          // @ts-ignore
                          menu={{
                            selectedKeys: [field.value],
                            items: [
                              {
                                key: 'year',
                                label: 'Year',
                                children: [
                                  {
                                    key: 'this_year',
                                    onClick: handleSelect,
                                    label: 'This Year',
                                  },
                                  {
                                    key: 'last_year',
                                    onClick: handleSelect,
                                    label: 'Last Year',
                                  },
                                  {
                                    key: 'year',
                                    onClick: handleSelect,
                                    label: "Year's Start",
                                  },
                                  {
                                    key: 'end_of_years',
                                    onClick: handleSelect,
                                    label: "Year's End",
                                  },
                                ],
                              },

                              {
                                key: 'quarter',
                                label: 'Quarter',
                                children: [
                                  {
                                    key: 'this_quarter',
                                    onClick: handleSelect,
                                    label: 'This Quarter',
                                  },
                                  {
                                    key: 'last_quarter',
                                    onClick: handleSelect,
                                    label: 'Last Quarter',
                                  },
                                  {
                                    key: 'quarter',
                                    onClick: handleSelect,
                                    label: "Quarter's Start",
                                  },
                                  {
                                    key: 'end_of_quarters',
                                    onClick: handleSelect,
                                    label: "Quarter's End",
                                  },
                                ],
                              },

                              {
                                key: 'month',
                                label: 'Month',
                                children: [
                                  {
                                    key: 'this_month',
                                    onClick: handleSelect,
                                    label: 'This Month',
                                  },
                                  {
                                    key: 'last_month',
                                    onClick: handleSelect,
                                    label: 'Last Month',
                                  },
                                  {
                                    key: 'month',
                                    onClick: handleSelect,
                                    label: "Month's Start",
                                  },
                                  {
                                    key: 'end_of_months',
                                    onClick: handleSelect,
                                    label: "Month's End",
                                  },
                                ],
                              },

                              {
                                key: 'week',
                                label: 'Week',
                                children: [
                                  {
                                    key: 'this_week',
                                    onClick: handleSelect,
                                    label: 'This Week',
                                  },
                                  {
                                    key: 'last_week',
                                    onClick: handleSelect,
                                    label: 'Last Week',
                                  },
                                  {
                                    key: 'week',
                                    onClick: handleSelect,
                                    label: "Week's Start",
                                  },
                                  {
                                    key: 'end_of_weeks',
                                    onClick: handleSelect,
                                    label: "Week's End",
                                  },
                                ],
                              },

                              {
                                key: 'day',
                                label: 'Day',
                                children: [
                                  {
                                    key: 'today',
                                    onClick: handleSelect,
                                    label: 'Today',
                                  },
                                  {
                                    key: 'yesterday',
                                    onClick: handleSelect,
                                    label: 'Yesterday',
                                  },
                                  {
                                    key: 'day',
                                    onClick: handleSelect,
                                    label: "Day's Start",
                                  },
                                  {
                                    key: 'end_of_days',
                                    onClick: handleSelect,
                                    label: "Day's End",
                                  },
                                ],
                              },

                              {
                                key: 'hour',
                                onClick: handleSelect,
                                label: 'Hour',
                              },
                            ],
                          }}
                        >
                          <Flex
                            alignItems="center"
                            justifyContent="space-between"
                            px="11px"
                            style={{
                              height: '40px',
                              minWidth: '180px',
                              borderTopLeftRadius: '4px',
                              borderBottomLeftRadius: '4px',
                            }}
                          >
                            <Typography style={{ fontSize: '16px' }}>{getResolutionLabel(field.value)}</Typography>
                            <DownOutlined />
                          </Flex>
                        </Dropdown>
                      </StyledDropdownWrapper>
                    </FormItem>
                  )
                }}
              />
            </Box>

            <Button
              size="large"
              disabled={!isAllTimeResolutionValue}
              onClick={handleSetDefualtAllTimeResolutionFilters}
            >
              <FilterOutlined />
            </Button>
          </Input.Group>
        </Flex>
      )}
    </>
  )
}

export default OccurrenceFilter
