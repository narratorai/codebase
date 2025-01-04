import { useCompany } from 'components/context/company/hooks'
import { useAdminOnboarding, useWarehouse } from 'portal/stores/settings'
import { useShallow } from 'zustand/react/shallow'

import TutorialModal from './TutorialModal'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const TutorialModalContainer = ({ isOpen, onClose }: Props) => {
  const company = useCompany()
  const [showNarrative, transformations, set] = useAdminOnboarding(
    useShallow((state) => [state.show_narrative, state.transformations, state.set])
  )

  const clearResponse = () => {
    set({ show_narrative: false, transformations: [] })
  }

  const lastSave = useWarehouse((state) => state.lastSave)
  const narrative = lastSave?.narrative_to_show || null
  const companySlug = company?.slug || null
  const isVisible = isOpen && showNarrative

  return (
    <TutorialModal
      narrative={narrative}
      companySlug={companySlug}
      transformations={transformations}
      isOpen={isVisible}
      onClose={onClose}
      afterClose={clearResponse}
    />
  )
}

export default TutorialModalContainer
