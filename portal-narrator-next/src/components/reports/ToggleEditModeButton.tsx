import { EyeIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

interface Props {
  inEditMode: boolean
  onClick: () => void
}

export default function ToggleEditModeButton({ inEditMode, onClick }: Props) {
  return (
    <button
      className={clsx('gap-2 rounded-lg p-2 flex-x-center', {
        'bg-purple-100': inEditMode,
        'bg-yellow-100': !inEditMode,
      })}
      onClick={onClick}
    >
      {inEditMode ? (
        <>
          <PencilSquareIcon className="h-4" />
          <span>Edit mode</span>
        </>
      ) : (
        <>
          <EyeIcon className="h-4" />
          <span>Preview mode</span>
        </>
      )}
    </button>
  )
}
