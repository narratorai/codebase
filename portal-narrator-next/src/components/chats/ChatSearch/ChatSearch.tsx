'use client'

import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'

import { Button } from '@/components/primitives/Button'
import { Tooltip } from '@/components/primitives/Tooltip'

import ChatSearchButtonTip from './ChatSearchButtonTip'
import ChatSearchDialog from './ChatSearchDialog'
import { useSearchCommand } from './hooks'

const ChatSearch = () => {
  const { isOpen, setIsOpen } = useSearchCommand()

  return (
    <>
      <Tooltip content={{ sideOffset: 4 }} showArrow tip={<ChatSearchButtonTip />}>
        <Button aria-label="Search chat history" onClick={() => setIsOpen(true)} plain>
          <MagnifyingGlassIcon />
        </Button>
      </Tooltip>
      <ChatSearchDialog open={isOpen} setOpen={setIsOpen} />
    </>
  )
}

export default ChatSearch
