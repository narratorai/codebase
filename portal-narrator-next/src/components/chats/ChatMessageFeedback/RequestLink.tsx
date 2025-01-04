import { isNil } from 'lodash'
import Link from 'next/link'
import FileIcon from 'static/mavis/icons/file.svg'

import { TooltipTrigger } from '@/components/shared/Tooltip'
import { useCompanySlugParam } from '@/hooks'

import ChatMessageFeedbackTooltip from './Tooltip'

interface Props {
  requestId: string | null
}

const RequestLink = ({ requestId }: Props) => {
  const companySlug = useCompanySlugParam()

  if (isNil(requestId)) return null

  return (
    <ChatMessageFeedbackTooltip label="View request">
      <TooltipTrigger>
        <Link className="button button-xs secondary outlined" href={`/${companySlug}/llms/requests/edit/${requestId}`}>
          <FileIcon className="button button-xs button-icon" />
        </Link>
      </TooltipTrigger>
    </ChatMessageFeedbackTooltip>
  )
}

export default RequestLink
