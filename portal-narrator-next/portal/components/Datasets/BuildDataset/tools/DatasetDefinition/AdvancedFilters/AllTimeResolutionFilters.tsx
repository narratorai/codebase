import { CloseCircleOutlined } from '@ant-design/icons'
import { Select, Space } from 'antd-next'
import CompanyTimezoneDatePicker from 'components/antd/CompanyTimezoneDatePicker'
import { NumberField, TimeSegmentationSelect } from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm'
import { Box, Flex, Typography } from 'components/shared/jawns'
import _ from 'lodash'
import { useCallback, useEffect } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import styled from 'styled-components'
import {
  TIME_COHORT_RESOLUTION_FILTER_FIELDNAME,
  TIME_FILTER_KIND_ABSOLUTE,
  TIME_FILTER_KIND_RELATIVE,
} from 'util/datasets'
import { nTimeAgo } from 'util/helpers'
import usePrevious from 'util/usePrevious'

import ConnectingFilterBox from './ConnectingFilterBox'

export const DEFAULT_TIME_COHORT_RESOLUTION_FILTER_TYPE = TIME_FILTER_KIND_RELATIVE
export const DEFAULT_TIME_COHORT_RESOLUTION_FILTER_FROM_VALUE = 3
export const DEFAULT_TIME_COHORT_RESOLUTION_FILTER_SEGMENTATION = 'year'

const RESOLUTION_TYPE_OPTIONS = [
  { label: 'a relative time...', value: TIME_FILTER_KIND_RELATIVE },
  { label: 'a specific time...', value: TIME_FILTER_KIND_ABSOLUTE },
]

const StyledClose = styled.div`
  position: absolute;
  top: 0;
  z-index: 1;
  margin-left: -20px;
  margin-top: 8px;

  & > span.anticon {
    background-color: white;
  }
`

// eslint-disable-next-line max-lines-per-function
const AllTimeResolutionFilters = ({ isViewMode = false }: { isViewMode?: boolean }) => {
  const { watch, setValue, control } = useFormContext()

  const resolutionFilterValues = watch(TIME_COHORT_RESOLUTION_FILTER_FIELDNAME)
  const resolutionFilterOnChange = useCallback(
    (resolution: string | null) => {
      setValue(TIME_COHORT_RESOLUTION_FILTER_FIELDNAME, resolution, { shouldValidate: true })
    },
    [setValue]
  )

  const typeValue = watch(`${TIME_COHORT_RESOLUTION_FILTER_FIELDNAME}.type`)
  const prevTypeValue = usePrevious(typeValue)

  // relative value (number of ...)
  const fromValue = watch(`${TIME_COHORT_RESOLUTION_FILTER_FIELDNAME}.from_value`)
  const fromValueOnChange = useCallback(
    (fromVal: string | number | null) => {
      setValue(`${TIME_COHORT_RESOLUTION_FILTER_FIELDNAME}.from_value`, fromVal, { shouldValidate: true })
    },
    [setValue]
  )
  const segmentationIsPlural = fromValue > 1

  // relative segmentation (months, days, years...)
  const segmentationOnChange = useCallback(
    (segmentation: string | null) => {
      setValue(`${TIME_COHORT_RESOLUTION_FILTER_FIELDNAME}.segmentation`, segmentation, { shouldValidate: true })
    },
    [setValue]
  )

  // specific value (in ISO format)
  const fromDateOnChange = useCallback(
    (fromDate: string | null) => {
      setValue(`${TIME_COHORT_RESOLUTION_FILTER_FIELDNAME}.from_date`, fromDate, { shouldValidate: true })
    },
    [setValue]
  )

  const handleRemoveResolutionFilters = () => {
    resolutionFilterOnChange(null)
  }

  // set defaults when changing to type value (specific <--> relative)
  useEffect(() => {
    if (prevTypeValue && !_.isEqual(prevTypeValue, typeValue)) {
      // when changing to relative
      if (typeValue === TIME_FILTER_KIND_RELATIVE) {
        // clear specific values (from_date)
        fromDateOnChange(null)

        // set default to 3 years ago
        fromValueOnChange(DEFAULT_TIME_COHORT_RESOLUTION_FILTER_FROM_VALUE)
        segmentationOnChange(DEFAULT_TIME_COHORT_RESOLUTION_FILTER_SEGMENTATION)
      }

      // when changing to specific
      if (typeValue === TIME_FILTER_KIND_ABSOLUTE) {
        // clear relative values (from_value and segmentation)
        fromValueOnChange(null)
        segmentationOnChange(null)

        // set default to 3 years ago
        const threeYearsAgo = nTimeAgo(DEFAULT_TIME_COHORT_RESOLUTION_FILTER_FROM_VALUE, 'years').toISOString()
        fromDateOnChange(threeYearsAgo)
      }
    }
  }, [prevTypeValue, typeValue, fromDateOnChange, fromValueOnChange, segmentationOnChange])

  // Don't show anything if no filter values are selected
  // Also - Mavis will send back resolution filters with no values
  // so make sure that at least one of those has a value (i.e. segmentation: null, from_date: null ...)
  const resolutionFiltersHaveValues = !_.isEmpty(_.compact(_.values(resolutionFilterValues)))
  if (_.isEmpty(resolutionFilterValues) || !resolutionFiltersHaveValues) {
    return null
  }

  // set defaults when changing to specific
  return (
    <Box my={1} relative>
      <Space align="start">
        <ConnectingFilterBox mt="5px">
          <Typography type="body50">since</Typography>
        </ConnectingFilterBox>
        <Space align="start" style={{ flexWrap: 'wrap', rowGap: 8 }}>
          <Controller
            control={control}
            name={`${TIME_COHORT_RESOLUTION_FILTER_FIELDNAME}.type`}
            render={({ field }) => <Select options={RESOLUTION_TYPE_OPTIONS} {...field} />}
          />
        </Space>
        {typeValue === TIME_FILTER_KIND_RELATIVE && (
          <Flex alignItems="center">
            <Box mr={1}>
              <NumberField
                fieldName={`${TIME_COHORT_RESOLUTION_FILTER_FIELDNAME}.from_value`}
                defaultValue={fromValue}
              />
            </Box>
            <Box mr={1}>
              <TimeSegmentationSelect
                fieldName={`${TIME_COHORT_RESOLUTION_FILTER_FIELDNAME}.segmentation`}
                plural={segmentationIsPlural}
              />
            </Box>
            <Box>
              <Typography type="body50">ago</Typography>
            </Box>
          </Flex>
        )}

        {typeValue === TIME_FILTER_KIND_ABSOLUTE && (
          <Space align="start">
            <Controller
              control={control}
              name={`${TIME_COHORT_RESOLUTION_FILTER_FIELDNAME}.from_date`}
              render={({ field }) => <CompanyTimezoneDatePicker resolution="date" {...field} />}
            />
          </Space>
        )}
      </Space>

      {!isViewMode && (
        <StyledClose>
          <CloseCircleOutlined onClick={handleRemoveResolutionFilters} />
        </StyledClose>
      )}
    </Box>
  )
}

export default AllTimeResolutionFilters
