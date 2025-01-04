import ArrowUpIcon from 'static/mavis/icons/arrow-up.svg'

interface Props {
  children: React.ReactNode
  onClick: () => void
}

const ChatSuggestion = ({ children, onClick }: Props) => {
  return (
    <li className="rounded-xl text-gray-600 bordered-gray-100 hover:bg-gray-50">
      <button className="w-full justify-between gap-2 p-4 text-sm flex-x-center" onClick={onClick}>
        <span className="truncate">{children}</span>
        <div className="rounded-md p-2 bordered-gray-100">
          <ArrowUpIcon className="size-4 stroke-gray-400" />
        </div>
      </button>
    </li>
  )
}

export default ChatSuggestion
