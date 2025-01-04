import { filter, join, map, slice } from 'lodash'
import React from 'react'

import { Avatar, AvatarGroup } from '@/components/primitives/Avatar'
import { Tooltip } from '@/components/primitives/Tooltip'
import { useCompany } from '@/stores/companies'

type Props = {
  sharedWithEveryone: boolean
  teamIds: string[]
}

const DatasetCollectionItemTeams = ({ sharedWithEveryone, teamIds }: Props) => {
  const company = useCompany()
  const teamIdsSet = new Set(teamIds)
  const teams = filter(company.teams, (team) => teamIdsSet.has(team.id))
  const hasTeams = teams.length > 0
  const hasMoreTeams = teams.length > 3
  const teamsNames = map(teams, 'name')
  const teamsNamesJoined = `Teams: ${join(teamsNames, ', ')}.`
  const firstThreeTeams = slice(teams, 0, 3)

  return sharedWithEveryone ? (
    <Tooltip content={{ sideOffset: 4 }} showArrow tip="Shared with everyone">
      <Avatar color="blue" icon="OutlineBuildingOfficeIcon" size="xs" />
    </Tooltip>
  ) : (
    hasTeams && (
      <Tooltip showArrow tip={teamsNamesJoined}>
        <AvatarGroup spread="lg">
          {map(firstThreeTeams, (item) => (
            <Avatar color={item.color} initials={item.name.toUpperCase().slice(0, 1)} key={item.id} size="sm" />
          ))}
          {hasMoreTeams && <Avatar color="indigo" initials="3+" size="sm" />}
        </AvatarGroup>
      </Tooltip>
    )
  )
}

export default DatasetCollectionItemTeams
