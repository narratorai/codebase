const useKeyboard = (onArrowDown: () => void, onArrowUp: () => void, onShiftEnter: () => void, onEnter: () => void) => {
  const handleKeyboardEvent = (event: React.KeyboardEvent) => {
    event.preventDefault()
    if (event.key === 'ArrowDown') onArrowDown()

    if (event.key === 'ArrowUp') onArrowUp()

    if (event.key === 'Enter') {
      if (event.shiftKey) {
        onShiftEnter()
      } else {
        onEnter()
      }
    }
  }

  return handleKeyboardEvent
}

export default useKeyboard
