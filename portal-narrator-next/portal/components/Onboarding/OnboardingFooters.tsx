import { Typography } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import moment from 'moment'

export default function OnboardingFooters() {
  const company = useCompany()
  const trialEnd = moment(company.created_at).add(14, 'days').format('MMM DD, YYYY')

  return (
    <div style={{ textAlign: 'center', marginTop: '16px' }}>
      <Typography.Paragraph style={{ fontSize: '12px', margin: 0, color: '#B4B3B9' }}>
        By using the free trial, you acknowledge and agree to abide by Mavis' Terms of Use and Privacy Policy.
      </Typography.Paragraph>
      <Typography.Paragraph style={{ fontSize: '12px', margin: 0, color: '#B4B3B9' }}>
        You can cancel your trial and auto-renewal BEFORE {trialEnd}. Your subscription will stop immediately, and you
        will not be charged.
      </Typography.Paragraph>
    </div>
  )
}
