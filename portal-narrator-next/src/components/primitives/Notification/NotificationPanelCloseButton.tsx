import { XMarkIcon } from '@heroicons/react/20/solid'

interface Props {
  onClick: () => void
}

const NotificationPanelCloseButton = ({ onClick }: Props) => {
  return (
    <div className="ml-4 flex flex-shrink-0">
      <button
        className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        onClick={onClick}
        type="button"
      >
        <span className="sr-only">Close</span>
        <XMarkIcon aria-hidden="true" className="h-5 w-5" />
      </button>
    </div>
  )
}

export default NotificationPanelCloseButton
