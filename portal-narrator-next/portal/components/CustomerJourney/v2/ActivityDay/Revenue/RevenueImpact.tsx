import { Tag } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { Box } from 'components/shared/jawns'
import { isEmpty, isFinite } from 'lodash'
import { intlMoneyify } from 'util/helpers'

import { ICustomerJourneyActivityRowWithMoment } from '../../services/interfaces'

interface Props {
  act: ICustomerJourneyActivityRowWithMoment
}

const RevenueImpact = ({ act }: Props) => {
  const company = useCompany()

  if (!isEmpty(act.repeated_activities)) {
    return null
  }

  // if there is a number value for revenue impact
  // show the tag with value moneyified in company's currency
  if (isFinite(act?.revenue_impact)) {
    return (
      <Box mr={1}>
        <Tag color={(act.revenue_impact as number) < 0 ? 'red' : 'green'}>
          {intlMoneyify(act.revenue_impact, company?.currency_used || 'USD')}
        </Tag>
      </Box>
    )
  }

  return null
}

export default RevenueImpact
