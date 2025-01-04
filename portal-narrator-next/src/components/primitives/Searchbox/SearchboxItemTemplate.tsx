import { ComboboxOptionProps } from '@headlessui/react'
import { CheckIcon } from '@heroicons/react/24/outline'
import React, { forwardRef } from 'react'

import { Avatar, AvatarGroup, IAvatar } from '../Avatar'
import { Row } from '../Axis'
import { Badge, type IBadge } from '../Badge'
import { Tooltip } from '../Tooltip'
import { SearchboxItem, SearchboxItemContents, SearchboxItemText, SearchboxItemTitle } from '.'

type Ref = React.ForwardedRef<HTMLDivElement>

export interface SearchboxItemTemplateProps extends Pick<IBadge, 'color'>, Pick<IAvatar, 'icon'> {
  category?: string
  createdAt: string
  description: string
  everyone: boolean
  favorited: boolean
  id: number
  name: string
  tags?: string[]
  teams?: string[]
  url: string
}

type Props = {
  value: SearchboxItemTemplateProps
} & Omit<ComboboxOptionProps, 'className' | 'as' | 'value'>

const SearchboxItemTemplate = ({ value, ...props }: Props, ref: Ref) => (
  <SearchboxItem {...props} ref={ref} value={value}>
    <SearchboxItemContents>
      <Avatar color={value.color} data-slot="lg-lead-icon" icon={value.icon} size="md" />
      <SearchboxItemTitle data-slot="md-title">{value.name}</SearchboxItemTitle>
      <Row data-slot="sm-details" gap="lg" items="center" x="end">
        <Row gap="sm" items="center">
          {value.category && (
            <Badge color={value.color} outline pill size="sm">
              {value.category}
            </Badge>
          )}
          {value.tags?.map((tag) => (
            <Badge color="green" key={tag} size="sm" soft>
              {tag}
            </Badge>
          ))}
        </Row>
        {!value.everyone && value.teams && value.teams.length > 0 && (
          <Tooltip showArrow tip={value.teams.join(', ')}>
            <AvatarGroup spread="lg">
              {value.teams.slice(0, 3).map((team) => (
                <Avatar color="fuchsia" initials={team} key={team} size="sm" />
              ))}
              {value.teams.length > 3 && <Avatar color="fuchsia" initials="3+" key="more" size="sm" />}
            </AvatarGroup>
          </Tooltip>
        )}
        <Tooltip content={{ sideOffset: 4 }} showArrow tip="Shared with everyone">
          {value.everyone && <Avatar color="blue" icon="OutlineBuildingOfficeIcon" size="xs" />}
        </Tooltip>
        <Tooltip content={{ sideOffset: 4 }} showArrow tip="Favorited">
          {value.favorited && <Avatar color="amber" icon="SolidBookmarkIcon" size="xs" />}
        </Tooltip>
      </Row>

      <Row data-slot="lg-subtitle" full items="center" x="between">
        <SearchboxItemText>{value.description}</SearchboxItemText>
        <Tooltip showArrow tip={value.createdAt}>
          <SearchboxItemText>{value.createdAt}</SearchboxItemText>
        </Tooltip>
      </Row>
      <CheckIcon data-slot="selection" />
    </SearchboxItemContents>
  </SearchboxItem>
)

export default forwardRef(SearchboxItemTemplate)
