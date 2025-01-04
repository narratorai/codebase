import { Emoji } from '@emoji-mart/data'
import * as Popover from '@radix-ui/react-popover'

import { categories, emojis } from './data'
import EmojiCategoryList from './EmojiCategoryList'
import EmojiSearchForm from './EmojiSearchForm'
import useFuse from './useFuse'

interface Props {
  onChange: (value: string) => void
  value: string
}

export default function EmojiPicker({ value, onChange }: Props) {
  const [items, setFilterExpr] = useFuse<Emoji>(Object.values(emojis), ['id', 'name', 'keywords'])

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button>{value}</button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className="z-50" side="bottom" sideOffset={6}>
          <div className="w-72 rounded-lg bg-white shadow-xl bordered-gray-100">
            <div className="p-2 sticky-top-0">
              {/* eslint-disable-next-line react/jsx-max-depth */}
              <EmojiSearchForm onChange={setFilterExpr} />
            </div>

            {/* TODO: Add virtualization to the list */}
            <ul className="max-h-80 space-y-4 overflow-scroll p-2">
              {categories.map((category) => (
                <EmojiCategoryList
                  items={items.filter((item) => category.emojis.includes(item.id))}
                  key={category.id}
                  onClick={onChange}
                  title={category.id}
                />
              ))}
            </ul>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
