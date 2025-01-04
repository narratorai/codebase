import { Typography } from 'components/shared/jawns'
import { colors } from 'util/constants'

const TutorialModalTitle = () => (
  <Typography type="title400" pb={2} style={{ borderBottom: `1px solid ${colors.gray200}` }} data-public>
    You have successufully connected your warehouse
  </Typography>
)

export default TutorialModalTitle
