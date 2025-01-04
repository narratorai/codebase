import { NON_DRAGGABLE_AREA_CLASSNAME } from 'components/Narratives/Dashboards/BuildDashboard/BuildDashboard'
import { Box } from 'components/shared/jawns'
import styled from 'styled-components'

const ChildrenContainer = styled(Box)`
  height: 100%;

  &:hover {
    cursor: auto;
  }
`

interface Props {
  children: React.ReactNode
}

const NonDraggableContainer = ({ children }: Props) => {
  return <ChildrenContainer className={NON_DRAGGABLE_AREA_CLASSNAME}>{children}</ChildrenContainer>
}

export default NonDraggableContainer
