import { useCallback, useEffect } from 'react'

interface Props {
  handleSave: Function
}

const QuickSaveListener = ({ handleSave }: Props) => {
  const handleQuickSaveSubmit = useCallback(
    (event: any) => {
      // handle (cmd + s) hotkey
      if ((event.ctrlKey || event.metaKey) && event.keyCode == 83) {
        // stop browser from saving the file
        event.preventDefault()

        handleSave(event)
      }
    },
    [handleSave]
  )

  useEffect(() => {
    // add listener for cmd + s
    document.addEventListener('keydown', handleQuickSaveSubmit)

    return () => {
      // remove listener for cmd + s
      document.removeEventListener('keydown', handleQuickSaveSubmit)
    }
  }, [handleQuickSaveSubmit])

  // just a listener, no UI
  return null
}

export default QuickSaveListener
