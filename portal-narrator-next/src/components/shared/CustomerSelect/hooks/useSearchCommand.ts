import { useState } from 'react'

import { useKeyboardShortcut } from '@/hooks'

const useSearchCommand = () => {
  const [isOpen, setIsOpen] = useState(false)
  useKeyboardShortcut('meta+k', () => setIsOpen(!isOpen))

  return { isOpen, setIsOpen }
}

export default useSearchCommand
