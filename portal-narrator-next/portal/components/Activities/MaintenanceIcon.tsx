import { RedoOutlined, WarningOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { Box, Typography } from 'components/shared/jawns'
import { IActivity_Maintenance, IMaintenance_Kinds_Enum, ITransformation_Maintenance } from 'graph/generated'
import { colors } from 'util/constants'
import { formatTimeStamp } from 'util/helpers'

interface Props {
  maintenance?: IActivity_Maintenance | ITransformation_Maintenance
  withSpin?: boolean
}

const MaintenanceIcon = ({ maintenance, withSpin }: Props) => {
  const company = useCompany()

  // Must pass either activity or transformation maintenance
  if (!maintenance) {
    return null
  }

  const isResync =
    maintenance?.kind === IMaintenance_Kinds_Enum.Resynced ||
    maintenance?.kind === IMaintenance_Kinds_Enum.CascadeResynced

  return (
    <Tooltip
      title={
        <Box>
          <Typography>
            <span style={{ fontWeight: 'bold' }}>
              Started {formatTimeStamp(maintenance?.started_at, company?.timezone, 'll')}
            </span>{' '}
            {maintenance?.maintenance_kind?.description && `- ${maintenance.maintenance_kind.description}`}
          </Typography>
          {maintenance?.notes && <Typography mt={2}>{maintenance.notes}</Typography>}
        </Box>
      }
    >
      {/* Can be resync or failure */}
      {isResync ? (
        <RedoOutlined spin={!!withSpin} style={{ color: colors.blue500 }} />
      ) : (
        <WarningOutlined style={{ color: colors.red500 }} />
      )}
    </Tooltip>
  )
}

export default MaintenanceIcon
