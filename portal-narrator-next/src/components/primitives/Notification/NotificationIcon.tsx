import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline'

import { Status } from './interfaces'

interface Props {
  status: Status
}

const NotificationIcon = ({ status }: Props) => {
  if (status === 'success') return <CheckCircleIcon aria-hidden="true" className="h-6 w-6 text-green-400" />

  if (status === 'info') return <InformationCircleIcon aria-hidden="true" className="h-6 w-6 text-blue-400" />

  if (status === 'warning') return <ExclamationCircleIcon aria-hidden="true" className="h-6 w-6 text-amber-400" />

  if (status === 'error') return <NoSymbolIcon aria-hidden="true" className="h-6 w-6 text-red-400" />
}

export default NotificationIcon
