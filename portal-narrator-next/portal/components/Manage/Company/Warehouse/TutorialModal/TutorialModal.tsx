import { Modal } from 'antd-next'
import { ITransformation } from 'portal/stores/settings'

import TutorialModalContent from './TutorialModalContent'
import TutorialModalTitle from './TutorialModalTitle'

interface Props {
  narrative: string | null
  companySlug: string | null
  transformations: ITransformation[]
  isOpen: boolean
  onClose: () => void
  afterClose: () => void
}

const TutorialModal = ({ narrative, companySlug, transformations, isOpen, onClose, afterClose }: Props) => (
  <Modal
    title={<TutorialModalTitle />}
    width={600}
    open={isOpen}
    onOk={onClose}
    onCancel={onClose}
    okText="Continue"
    okType="default"
    afterClose={afterClose}
  >
    <TutorialModalContent narrative={narrative} companySlug={companySlug} transformations={transformations} />
  </Modal>
)

export default TutorialModal
