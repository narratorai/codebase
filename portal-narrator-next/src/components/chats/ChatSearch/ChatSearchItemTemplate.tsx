import { ComboboxOptionProps } from '@headlessui/react'
import { filter, join, map, slice } from 'lodash'
import React, { forwardRef } from 'react'

import { Avatar, AvatarGroup } from '@/components/primitives/Avatar'
import { Row } from '@/components/primitives/Axis'
import { Badge, type IBadge } from '@/components/primitives/Badge'
import {
  SearchboxItem,
  SearchboxItemContents,
  SearchboxItemText,
  SearchboxItemTitle,
} from '@/components/primitives/Searchbox'
import { Tooltip } from '@/components/primitives/Tooltip'
import { IRemoteChat } from '@/stores/chats'
import { useCompany } from '@/stores/companies'
import { useTables } from '@/stores/tables'
import { formatDistanceToNow, formatShortDateTime } from '@/util/formatters'

type Ref = React.ForwardedRef<HTMLDivElement>

type Props = {
  value: IRemoteChat
} & Omit<ComboboxOptionProps, 'className' | 'as' | 'value'>

const SearchboxItemTemplate = ({ value, ...props }: Props, ref: Ref) => {
  const { createdAt, detailedSummary, favorited, sharedWithEveryone: everyone, summary, tableId } = value
  const teamIds = new Set(value.teamIds)

  const company = useCompany()

  // Get table details
  const getTable = useTables((state) => state.getTable)
  const table = getTable(tableId)
  const tableIdentifier = table?.identifier
  const tableColor = (table?.color || 'green') as IBadge['color']

  // Get teams details
  const teams = filter(company.teams, (team) => teamIds.has(team.id))
  const teamsNames = map(teams, 'name')
  const hasTeams = teams.length > 0
  const hasMoreTeams = teams.length > 3
  const teamsNamesJoined = `Teams: ${join(teamsNames, ', ')}.`
  const firstThreeTeams = slice(teamsNames, 0, 3)
  const teamsInitials = map(firstThreeTeams, (team) => team.toUpperCase().slice(0, 1))

  // Get creation time details
  const timeDistance = formatDistanceToNow(createdAt, company)
  const date = formatShortDateTime(createdAt, company)

  return (
    <SearchboxItem {...props} ref={ref} value={value}>
      <SearchboxItemContents>
        <SearchboxItemTitle data-slot="md-title">{summary}</SearchboxItemTitle>
        <Row data-slot="sm-details" gap="lg" items="center" x="end">
          {tableIdentifier && (
            <Badge color={tableColor} outline pill size="sm">
              {tableIdentifier}
            </Badge>
          )}

          {!everyone && hasTeams && (
            <Tooltip showArrow tip={teamsNamesJoined}>
              <AvatarGroup spread="lg">
                {map(teamsInitials, (team) => (
                  <Avatar color="fuchsia" initials={team} key={team} size="sm" />
                ))}
                {hasMoreTeams && <Avatar color="fuchsia" initials="3+" size="sm" />}
              </AvatarGroup>
            </Tooltip>
          )}
          <Tooltip content={{ sideOffset: 4 }} showArrow tip="Shared with everyone">
            {everyone && <Avatar color="blue" icon="OutlineBuildingOfficeIcon" size="xs" />}
          </Tooltip>

          <Tooltip content={{ sideOffset: 4 }} showArrow tip="Favorited">
            {favorited && <Avatar color="amber" icon="SolidBookmarkIcon" size="xs" />}
          </Tooltip>
        </Row>

        <Row data-slot="lg-subtitle" gap="lg" items="center" x="between">
          {detailedSummary && (
            <Tooltip showArrow tip={detailedSummary}>
              <SearchboxItemText truncate>{detailedSummary}</SearchboxItemText>
            </Tooltip>
          )}
          <Tooltip showArrow tip={date}>
            <SearchboxItemText>{timeDistance}</SearchboxItemText>
          </Tooltip>
        </Row>
      </SearchboxItemContents>
    </SearchboxItem>
  )
}

export default forwardRef(SearchboxItemTemplate)
