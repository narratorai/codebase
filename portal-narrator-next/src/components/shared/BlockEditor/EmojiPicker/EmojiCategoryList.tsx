import { Emoji } from '@emoji-mart/data'

interface Props {
  items: Emoji[]
  onClick: (emoji: string) => void
  title: string
}

export default function EmojiCategoryList({ title, items, onClick }: Props) {
  if (items.length === 0) return null
  return (
    <li>
      <p className="mb-2 text-xs capitalize text-gray-600">{title}</p>
      <div className="grid grid-cols-9 text-xl">
        {items.map((emoji) => (
          <button
            className="rounded p-0.5 hover:bg-gray-50"
            key={emoji.id}
            onClick={() => onClick(emoji.skins[0].native)}
          >
            {emoji.skins[0].native}
          </button>
        ))}
      </div>
    </li>
  )
}
