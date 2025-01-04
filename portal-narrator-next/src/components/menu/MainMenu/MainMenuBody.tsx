import {
  ChatBubbleLeftEllipsisIcon,
  ClockIcon,
  CpuChipIcon,
  DocumentChartBarIcon,
  PuzzlePieceIcon,
  TableCellsIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'

import { useCompanySlugParam } from '@/hooks'
import { useUser } from '@/stores/users'

import MainMenuItem from './MainMenuItem'

interface Props {
  isExpanded?: boolean
}

const MainMenuBody = ({ isExpanded = false }: Props) => {
  const companySlug = useCompanySlugParam()
  const accessRoles = useUser((state) => state.accessRoles)

  return (
    <>
      {accessRoles.ViewChat && (
        <MainMenuItem
          href={`/v2/${companySlug}/chats`}
          Icon={ChatBubbleLeftEllipsisIcon}
          isExpanded={isExpanded}
          label="Chat"
        />
      )}
      {accessRoles.ViewDataset && (
        <MainMenuItem href={`/${companySlug}/datasets`} Icon={TableCellsIcon} isExpanded={isExpanded} label="Query" />
      )}
      {accessRoles.ViewReport && (
        <MainMenuItem
          href={`/v2/${companySlug}/reports`}
          Icon={DocumentChartBarIcon}
          isExpanded={isExpanded}
          label="Reports"
        />
      )}
      {accessRoles.ViewCustomerJourney && (
        <MainMenuItem
          href={`/${companySlug}/customer_journey`}
          Icon={UserCircleIcon}
          isExpanded={isExpanded}
          label="Journey"
        />
      )}
      {accessRoles.ViewActivities && (
        <MainMenuItem
          href={`/${companySlug}/activities`}
          Icon={PuzzlePieceIcon}
          isExpanded={isExpanded}
          label="Activities"
        />
      )}
      {accessRoles.ManageTransformations && (
        <MainMenuItem
          href={`/${companySlug}/transformations`}
          Icon={CpuChipIcon}
          isExpanded={isExpanded}
          label="Transformations"
        />
      )}
      {accessRoles.ViewProcessing && (
        <MainMenuItem
          href={`/${companySlug}/manage/tasks`}
          Icon={ClockIcon}
          isExpanded={isExpanded}
          label="Processing"
        />
      )}
    </>
  )
}

export default MainMenuBody
