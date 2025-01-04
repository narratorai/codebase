import { isEmpty, toString } from 'lodash'
import { useFormContext } from 'react-hook-form'
import { DEFINITION_ACTIVITY_TYPE_APPEND } from 'util/datasets'

import AllTimeResolutionFilters from './AllTimeResolutionFilters'
import CohortColumnFilters from './CohortColumnFilters'
import ColumnFilters from './ColumnFilters'
import RelativeActivityFilters from './RelativeActivityFilters'
import TimeFilters from './TimeFilters'

interface Props {
  activityType: 'cohort' | 'append'
  appendActivityIndex?: number | string
  isViewMode?: boolean
}

const AdvancedFilters = ({ activityType, appendActivityIndex, isViewMode }: Props) => {
  const { watch } = useFormContext()

  const isAppend = activityType === DEFINITION_ACTIVITY_TYPE_APPEND && !!toString(appendActivityIndex)
  const parentFieldName = isAppend ? `append_activities.${appendActivityIndex}` : 'cohort'

  const activityIdsValue = watch(`${parentFieldName}.activity_ids.0`)

  if (isEmpty(activityIdsValue)) {
    return null
  }

  return (
    <>
      <ColumnFilters parentFieldName={parentFieldName} isViewMode={isViewMode} />
      <TimeFilters parentFieldName={parentFieldName} isViewMode={isViewMode} />
      <RelativeActivityFilters parentFieldName={parentFieldName} isViewMode={isViewMode} />
      <CohortColumnFilters parentFieldName={parentFieldName} isViewMode={isViewMode} />

      {/* AllTimeResolutionFilters is only for time cohort - when "all" is selected */}
      {!isAppend && <AllTimeResolutionFilters isViewMode={isViewMode} />}
    </>
  )
}

export default AdvancedFilters
