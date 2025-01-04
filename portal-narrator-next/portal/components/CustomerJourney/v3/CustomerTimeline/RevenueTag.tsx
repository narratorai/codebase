import { Tag } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { intlMoneyify } from 'util/helpers'

interface Props {
  revenue: number
}

const RevenueTag = ({ revenue }: Props) => {
  const company = useCompany()
  return <Tag color={revenue < 0 ? 'red' : 'green'}>{intlMoneyify(revenue, company?.currency_used || 'USD')}</Tag>
}

export default RevenueTag
