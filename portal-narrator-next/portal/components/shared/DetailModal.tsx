import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd-next'
import { Modal } from 'components/antd/staged'
import { useState } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

/**
 * This is a modal used to display something and on click make it bigger.
 * When closed the modal just renders the child as is. When open it renders that same
 * child in a fullscreen view.
 * Used to show a fullscreen table in narratives
 */
const DetailModal = ({ isOpen, onClose, children }: Props) => {
  return isOpen ? (
    <Modal open={isOpen} full footer={null} closable={false} onCancel={onClose}>
      {children}
    </Modal>
  ) : (
    children
  )
}

export const useModalState = () => {
  const [isOpen, setIsOpen] = useState(false)

  const closeModal = () => setIsOpen(false)
  const openModal = () => setIsOpen(true)

  return { isOpen, openModal, closeModal }
}

interface OpenCloseFullScreenButtonProps {
  isOpen: boolean
  openModal: () => void
  closeModal: () => void
}

export const OpenCloseFullScreenButton = ({ isOpen, openModal, closeModal }: OpenCloseFullScreenButtonProps) => {
  return isOpen ? (
    <Tooltip placement="topRight" title="Close full screen">
      <Button type="text" onClick={closeModal} icon={<FullscreenExitOutlined />} size="small" />
    </Tooltip>
  ) : (
    <Tooltip placement="topRight" title="View full screen">
      <Button type="text" onClick={openModal} icon={<FullscreenOutlined />} size="small" />
    </Tooltip>
  )
}

export default DetailModal
