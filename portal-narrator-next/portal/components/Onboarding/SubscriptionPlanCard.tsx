import { Card, Divider, Flex, Tag, Typography } from 'antd-next'

import FeaturesForm from './FeaturesForm'

interface Props {
  onFeaturesChange: (data: Record<string, unknown>) => void
}

export default function SubscriptionPlanCard({ onFeaturesChange }: Props) {
  return (
    <Card style={{ width: 300, background: '#6331B3', borderRadius: 16, minHeight: '400px' }}>
      <Flex gap={16} justify="space-between" align="center">
        <Flex align="baseline" gap={4}>
          <Typography.Title level={2} style={{ color: 'white', margin: 0 }}>
            $500
          </Typography.Title>
          <Typography.Paragraph style={{ color: 'white', opacity: 0.5, margin: 0 }}>/ month</Typography.Paragraph>
        </Flex>
        <div>
          <Tag style={{ borderRadius: 24, background: 'white', margin: 0, padding: '4px 12px', border: 'none' }}>
            Standard
          </Tag>
        </div>
      </Flex>
      <Divider style={{ borderColor: 'white', opacity: 0.5 }} />
      <section>
        <Typography style={{ color: 'white', margin: 0, textTransform: 'uppercase', opacity: 0.75 }}>
          Users fee (users/month)
        </Typography>
        <div style={{ fontWeight: 'bold', marginTop: 12, fontFamily: 'monospace' }}>
          <Flex justify="space-between" style={{ marginBottom: 6 }}>
            <span style={{ color: '#F3F2F3', opacity: 0.5 }}>6-10</span>
            <span style={{ color: 'white', opacity: 1 }}>$100</span>
          </Flex>
          <Flex justify="space-between" style={{ marginBottom: 6 }}>
            <span style={{ color: '#F3F2F3', opacity: 0.5 }}>11-50</span>
            <span style={{ color: 'white', opacity: 1 }}>$50</span>
          </Flex>
          <Flex justify="space-between" style={{ marginBottom: 6 }}>
            <span style={{ color: '#F3F2F3', opacity: 0.5 }}>51+</span>
            <span style={{ color: 'white', opacity: 1 }}>$25</span>
          </Flex>
        </div>
      </section>
      <Divider style={{ borderColor: 'white', opacity: 0.5 }} />
      <FeaturesForm onSubmit={onFeaturesChange} />
    </Card>
  )
}
