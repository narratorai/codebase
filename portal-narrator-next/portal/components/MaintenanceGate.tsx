import { Typography } from 'components/shared/jawns'
import StatusPageNotification from 'components/StatusPageNotification'
import { useFlags } from 'launchdarkly-react-client-sdk'

interface Props {
  children: React.ReactNode
}

const MaintenanceGate = ({ children }: Props) => {
  const flags = useFlags()

  if (flags['maintenance-mode']) {
    return (
      <>
        <StatusPageNotification initializeWithStatus />
        <Typography as="h1" type="heading1" p={48} style={{ textAlign: 'center' }}>
          Maintenance Mode
        </Typography>
      </>
    )
  }

  return children
}

export default MaintenanceGate
