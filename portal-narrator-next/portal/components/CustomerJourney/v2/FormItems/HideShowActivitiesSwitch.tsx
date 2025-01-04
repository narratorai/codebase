import { Switch } from 'antd-next'
import { Box } from 'components/shared/jawns'
import { filter, includes, isEmpty, map } from 'lodash'
import { useFormContext } from 'react-hook-form'
import styled from 'styled-components'
import { colors } from 'util/constants'

import { ACTIVITIES_FIELDNAME, HIDE_ACTIVITIES_FIELDNAME } from './constants'
import { Activities } from './interfaces'

const StyledSwitchContainer = styled(Box)<{ isHideMode: boolean }>`
  .styled-toggle-hide-show {
    background-color: ${({ isHideMode }) => (isHideMode ? colors.red500 : colors.green500)};
  }
`

interface Props {
  activities?: Activities
}

const HideShowActivitiesSwitch = ({ activities }: Props) => {
  const { setValue, watch } = useFormContext()

  const selectedActivities = watch(ACTIVITIES_FIELDNAME)
  const isHideActivitiesMode = watch(HIDE_ACTIVITIES_FIELDNAME)

  const handleToggleIsHideMove = (hide: boolean) => {
    // maintain form state
    setValue(HIDE_ACTIVITIES_FIELDNAME, !hide, { shouldValidate: true })

    // if there were activities selected
    if (!isEmpty(selectedActivities)) {
      // switch the selected activies to the non-selected activities
      const activityValues = map(activities, (act) => act.slug)
      const oppositeActivities = filter(activityValues, (activityValue) => !includes(selectedActivities, activityValue))
      setValue(ACTIVITIES_FIELDNAME, oppositeActivities, { shouldValidate: true })
    }
  }

  return (
    <StyledSwitchContainer isHideMode={isHideActivitiesMode} mt="4px">
      <Switch
        data-test="hide-show-duplicate-parent-columns-toggle"
        className="styled-toggle-hide-show"
        checked={!isHideActivitiesMode}
        onChange={handleToggleIsHideMove}
        checkedChildren="Show"
        unCheckedChildren="Hide"
      />
    </StyledSwitchContainer>
  )
}

export default HideShowActivitiesSwitch
