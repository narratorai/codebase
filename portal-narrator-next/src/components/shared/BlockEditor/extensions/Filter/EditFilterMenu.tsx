import EditIcon from 'static/mavis/icons/edit.svg'

interface Props {
  onClick: () => void
}

export default function EditFilterMenu({ onClick }: Props) {
  return (
    <div className="rounded-md bg-gray-900 p-1 text-white shadow-sm flex-x-center">
      <button
        className="gap-0.5 rounded p-1.5 text-xs font-medium text-gray-100 flex-x-center hover:bg-gray-600"
        onClick={onClick}
      >
        <EditIcon className="size-4" />
        <span>Edit filter</span>
      </button>
    </div>
  )
}
