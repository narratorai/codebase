import { AvatarButton } from '@/components/primitives/Avatar'
import { Row } from '@/components/primitives/Axis'
import { Heading } from '@/components/primitives/Heading'
import { Tooltip } from '@/components/primitives/Tooltip'
import { useCompany } from '@/stores/companies'

import MainMenuHeaderTip from './MainMenuHeaderTip'

interface Props {
  isExpanded?: boolean
  toggleMenu: () => void
}

const MainMenuHeader = ({ isExpanded = false, toggleMenu }: Props) => {
  const [companyName, companyLogo] = useCompany((state) => [state.name, state.logoUrl])

  const logoUrl = companyLogo || '/static/mavis/icons/logo.svg'

  return (
    <Row gap="lg" items="center">
      <Tooltip
        content={{ side: 'right', sideOffset: 4 }}
        showArrow
        tip={<MainMenuHeaderTip companyName={companyName} isExpanded={isExpanded} />}
      >
        <AvatarButton alt="Expand/Collapse" color="transparent" onClick={toggleMenu} size="md" square src={logoUrl} />
      </Tooltip>
      {isExpanded && <Heading level={6}>{companyName}</Heading>}
    </Row>
  )
}

export default MainMenuHeader
