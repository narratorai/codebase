import { useState } from 'react'

import DeleteModal from '../DeleteModal'
import MappingsModal from '../MappingsModal'
import TutorialModal from '../TutorialModal'
import WarehouseForm from '../WarehouseForm'

interface Props {
  isAdmin: boolean
}

const WarehouseControl = ({ isAdmin }: Props) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isMappingsModalOpen, setIsMappingsModalOpen] = useState(false)
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false)

  const handleDeleteModalOpen = () => setIsDeleteModalOpen(true)
  const handleDeleteModalClose = () => setIsDeleteModalOpen(false)

  const handleMappingsModalOpen = () => setIsMappingsModalOpen(true)
  const handleMappingsModalClose = () => {
    setIsMappingsModalOpen(false)
    setIsTutorialModalOpen(true)
  }

  const handleTutorialModalClose = () => setIsTutorialModalOpen(false)

  return (
    <>
      <WarehouseForm isAdmin={isAdmin} onDelete={handleDeleteModalOpen} onSubmit={handleMappingsModalOpen} />
      <DeleteModal isAdmin={isAdmin} isOpen={isDeleteModalOpen} onClose={handleDeleteModalClose} />
      <MappingsModal isOpen={isMappingsModalOpen} onClose={handleMappingsModalClose} />
      <TutorialModal isOpen={isTutorialModalOpen} onClose={handleTutorialModalClose} />
    </>
  )
}

export default WarehouseControl
