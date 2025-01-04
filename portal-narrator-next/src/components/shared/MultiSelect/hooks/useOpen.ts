import { useState } from 'react'

const useOpen = (isRemoteOpen?: boolean, setIsRemoteOpen?: (value: boolean) => void) => {
  const [isLocalOpen, setIsLocalOpen] = useState(false)

  const handleOpen = () => {
    if (setIsRemoteOpen) setIsRemoteOpen(true)
    else setIsLocalOpen(true)
  }

  const handleClose = () => {
    if (setIsRemoteOpen) setIsRemoteOpen(false)
    else setIsLocalOpen(false)
  }

  const isOpen = isRemoteOpen !== undefined ? isRemoteOpen : isLocalOpen

  return {
    open: isOpen,
    handleOpen,
    handleClose,
  }
}

export default useOpen
