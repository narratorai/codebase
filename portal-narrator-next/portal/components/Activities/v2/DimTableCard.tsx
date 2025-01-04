import { Tooltip } from 'antd-next'
import MaintenanceIcon from 'components/Activities/MaintenanceIcon'
import { ContainerCard, StyledActivityOrDimLink } from 'components/Activities/v2/ActivityCard'
import { DimTables } from 'components/Activities/v2/ActivityIndexV2'
import { DIM_TABLE_EDIT_PARAM } from 'components/Activities/v2/constants'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { Box } from 'components/shared/jawns'
import { IActivity_Maintenance } from 'graph/generated'
import { isEmpty, startCase } from 'lodash'
import { useHistory } from 'react-router'

type DimTable = DimTables[number]

interface Props {
  dimTable: DimTable
}

const DimTableCard = ({ dimTable }: Props) => {
  const history = useHistory()
  const company = useCompany()
  const { isCompanyAdmin } = useUser()

  const openEditDimDrawer = () => {
    if (isCompanyAdmin) {
      history.push(`/${company.slug}/activities/${DIM_TABLE_EDIT_PARAM}/${dimTable.id}`)
    }
  }

  return (
    <ContainerCard key={dimTable.id} style={{ position: 'relative' }} p={1}>
      {!isEmpty(dimTable?.maintenances) && (
        <Box mr={1} style={{ position: 'absolute', left: -16 }}>
          <MaintenanceIcon maintenance={dimTable.maintenances?.[0] as IActivity_Maintenance} />
        </Box>
      )}

      <Tooltip title={isCompanyAdmin ? 'Edit Dimension Table' : 'You must be an admin to edit'} placement="topLeft">
        <StyledActivityOrDimLink onClick={openEditDimDrawer}>{startCase(dimTable.table)}</StyledActivityOrDimLink>
      </Tooltip>
    </ContainerCard>
  )
}

export default DimTableCard
