import { useCompany } from 'components/context/company/hooks'
import ResourceSearchSelect from 'components/shared/IndexPages/ResourceSearchSelect'
import { Box } from 'components/shared/jawns'
import { filter, find, includes, map, startCase } from 'lodash'
import { useMemo, useState } from 'react'
import { useHistory } from 'react-router'
import styled from 'styled-components'
import { breakpoints } from 'util/constants'

import { DIM_TABLE_EDIT_PARAM, NO_ACTIVITY_STREAM_TEXT } from './constants'
import { Activities, DimTables } from './interfaces'

const SearchContainer = styled(Box)`
  width: 224px;

  @media only screen and (min-width: ${breakpoints.tablet}) {
    width: 360px;
  }
`

interface Props {
  activities?: Activities
  dimTables?: DimTables
  setShowableActivities: (activities?: Activities) => void
}

const ActivityIndexSearch = ({ activities, setShowableActivities, dimTables }: Props) => {
  const company = useCompany()
  const history = useHistory()

  const options = useMemo(() => {
    const activityOptions = map(activities, (act) => ({
      value: act.id,
      label: act.name,
      resource: act,
      hideResourceStateIcon: true,
      optGroupBy: startCase(act?.company_table?.activity_stream) || NO_ACTIVITY_STREAM_TEXT,
    }))
    const dimTableOptions = map(dimTables, (table) => ({
      value: table.id,
      label: table.table,
      resource: table,
      optGroupBy: 'Dimension Tables',
    }))

    return [...activityOptions, ...dimTableOptions]
  }, [activities, dimTables])

  const [selectedValue, setSelectedValue] = useState<string | undefined>()

  const handleOnSearchCallback = (ids: string[], searchValue: string) => {
    // show all activties if nothing has been typed
    if (!searchValue) {
      // (and ensure selected value is reset on clear)
      setSelectedValue(undefined)

      return setShowableActivities(activities)
    }

    // otherwise, show the found activties (searching by name)
    const foundActivties = filter(activities, (act) => includes(ids, act.id))
    setShowableActivities(foundActivties)
  }

  const handleOnSelect = (selectedId: string) => {
    // check if they selected an activity
    const selectedActivity = find(activities, ['id', selectedId])
    if (selectedActivity?.name) {
      // set the search value and the showable activties ()
      setSelectedValue(selectedActivity.name)
      setShowableActivities([selectedActivity])

      // open the edit activity drawer
      history.push(`/${company.slug}/activities/edit/${selectedId}`)
      return
    }

    // check if they selected a dim table instead
    const selectedDimTable = find(dimTables, ['id', selectedId])
    if (selectedDimTable?.table) {
      // set the search value
      setSelectedValue(selectedDimTable.table)
      // clear the showable activities (they selected a table)
      setShowableActivities([])

      // open the edit dim table drawer
      history.push(`/${company.slug}/activities/${DIM_TABLE_EDIT_PARAM}/${selectedId}`)
    }
  }

  return (
    <SearchContainer>
      <ResourceSearchSelect
        options={options}
        onSelect={handleOnSelect}
        onSearchCallback={handleOnSearchCallback}
        placeholderText="Search Activities"
        asAutoComplete
        isGrouped
        hideAvatarInOption
        extraSelectProps={{
          value: selectedValue,
          allowClear: true,
        }}
      />
    </SearchContainer>
  )
}

export default ActivityIndexSearch
