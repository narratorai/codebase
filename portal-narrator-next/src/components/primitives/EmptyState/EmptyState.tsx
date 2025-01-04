import { ExclamationCircleIcon } from '@heroicons/react/24/outline'

export interface Props {
  description?: string
  title: string
}

const EmptyState = ({ description, title }: Props) => (
  <div className="px-6 py-14 text-center text-sm sm:px-14">
    <ExclamationCircleIcon className="mx-auto h-6 w-6 text-gray-400" name="exclamation-circle" type="outline" />
    <p className="mt-4 font-semibold text-gray-900">{title}</p>
    {description ? <p className="mt-2 text-gray-500">{description}</p> : null}
  </div>
)

export default EmptyState
