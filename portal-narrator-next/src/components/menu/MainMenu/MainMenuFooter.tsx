/* eslint-disable max-lines-per-function */
import {
  AdjustmentsHorizontalIcon,
  ArrowRightStartOnRectangleIcon,
  ArrowsRightLeftIcon,
  BellIcon,
  ChatBubbleOvalLeftIcon,
  CircleStackIcon,
  CodeBracketSquareIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  LifebuoyIcon,
  UserGroupIcon,
  WrenchIcon,
} from '@heroicons/react/24/outline'

import { AvatarDetailsButton } from '@/components/primitives/Avatar'
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
  DropdownSection,
} from '@/components/primitives/Dropdown'
import { useCompanySlugParam } from '@/hooks'
import { useUser } from '@/stores/users'
import { logout, useCurrentAuth0User } from '@/util/auth'
import { toggleBeaconWidget } from '@/util/helpscout'

interface Props {
  isExpanded?: boolean
}

const MainMenuFooter = ({ isExpanded = false }: Props) => {
  const companySlug = useCompanySlugParam()
  const currentUser = useCurrentAuth0User()
  const accessRoles = useUser((state) => state.accessRoles)

  const src = currentUser.picture || null
  const label = isExpanded ? currentUser.name : undefined
  const description = isExpanded ? currentUser.email : undefined
  const initials = src ? undefined : label?.slice(0, 2).toUpperCase()

  return (
    <Dropdown>
      <DropdownButton
        as={AvatarDetailsButton}
        color="white"
        description={description}
        initials={initials}
        label={label}
        size="md"
        src={src}
      />
      <DropdownMenu anchor={{ gap: 24, to: 'right end' }}>
        <DropdownSection>
          <DropdownItem href="https://docs.narrator.ai">
            <LifebuoyIcon />
            <DropdownLabel>Docs</DropdownLabel>
          </DropdownItem>
          <DropdownItem onClick={() => toggleBeaconWidget()}>
            <ChatBubbleOvalLeftIcon />
            <DropdownLabel>Support</DropdownLabel>
          </DropdownItem>
        </DropdownSection>

        <DropdownDivider />

        <DropdownSection>
          {accessRoles.ManageProcessingConfig && (
            <DropdownItem href={`/${companySlug}/manage/company`}>
              <Cog6ToothIcon />
              <DropdownLabel>Account</DropdownLabel>
            </DropdownItem>
          )}
          {accessRoles.ManageUsers && (
            <DropdownItem href={`/${companySlug}/manage/users`}>
              <UserGroupIcon />
              <DropdownLabel>Teams</DropdownLabel>
            </DropdownItem>
          )}
        </DropdownSection>

        <DropdownDivider />

        <DropdownSection>
          {accessRoles.ManageConnection && (
            <DropdownItem href={`/${companySlug}/manage/warehouse`}>
              <CircleStackIcon />
              <DropdownLabel>Warehouse</DropdownLabel>
            </DropdownItem>
          )}
          {accessRoles.ManageApi && (
            <DropdownItem href={`/${companySlug}/manage/api-keys`}>
              <CodeBracketSquareIcon />
              <DropdownLabel>API</DropdownLabel>
            </DropdownItem>
          )}
          <DropdownItem>
            <AdjustmentsHorizontalIcon />
            <DropdownLabel>Processing Config</DropdownLabel>
          </DropdownItem>
          <DropdownItem>
            <WrenchIcon />
            <DropdownLabel>Custom Functions</DropdownLabel>
          </DropdownItem>
        </DropdownSection>

        <DropdownDivider />

        <DropdownSection>
          {accessRoles.ViewBilling && (
            <DropdownItem href={`/${companySlug}/manage/billing`}>
              <CreditCardIcon />
              <DropdownLabel>Billing</DropdownLabel>
            </DropdownItem>
          )}

          <DropdownItem href={`/${companySlug}/manage/notifications`}>
            <BellIcon />
            <DropdownLabel>Notifications</DropdownLabel>
          </DropdownItem>
        </DropdownSection>

        <DropdownDivider />

        <DropdownSection>
          <DropdownItem>
            <ArrowsRightLeftIcon />
            <DropdownLabel>Switch Company</DropdownLabel>
          </DropdownItem>
        </DropdownSection>

        <DropdownDivider />

        <DropdownSection>
          <DropdownItem onClick={() => logout()}>
            <ArrowRightStartOnRectangleIcon />
            <DropdownLabel>LogOut</DropdownLabel>
          </DropdownItem>
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  )
}

export default MainMenuFooter
