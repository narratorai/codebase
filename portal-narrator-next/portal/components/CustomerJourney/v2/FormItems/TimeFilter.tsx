import { DeleteOutlined } from '@ant-design/icons'
import { DEFAULT_TIME_FILTER } from 'components/CustomerJourney/v2/Customer'
import { Box, Flex } from 'components/shared/jawns'
import WithinTimeSelect from 'components/shared/WithinTimeSelect'
import { useFormContext } from 'react-hook-form'
import styled from 'styled-components'
import { FILTER_KIND_VALUE } from 'util/datasets'

import { TIME_FILTER_UNSELECTED } from '../Customer'

const StyledDeleteIconWrapper = styled(Box)`
  &:hover {
    cursor: pointer;
  }
`

const TimeFilter = () => {
  const { setValue } = useFormContext()

  const handleClearTimeFilter = () => {
    // trigger clear of operator to ensure react-hook-form catches update
    // (if just targeting top level 'time_filter' field, form is not updating)
    // (we add/remove time_filter query param if no operator & isn't TIME_FILTER_UNSELECTED)
    setValue('time_filter.operator', undefined, { shouldValidate: true })

    // set time_filter to string "unselected" to be picked up in query params
    // decodedTimeFilter in parent component Customer will deal with the values sent to mavis
    setValue('time_filter', TIME_FILTER_UNSELECTED, { shouldValidate: true })
  }

  return (
    <Flex alignItems="baseline">
      <WithinTimeSelect
        fieldName="time_filter"
        valueKindOptionOverrides={[FILTER_KIND_VALUE]}
        quickTimeFilterDefaultValue={DEFAULT_TIME_FILTER.value}
      />

      <StyledDeleteIconWrapper onClick={handleClearTimeFilter} data-test="clear-time-filter-cta">
        <DeleteOutlined />
      </StyledDeleteIconWrapper>
    </Flex>
  )
}

export default TimeFilter
