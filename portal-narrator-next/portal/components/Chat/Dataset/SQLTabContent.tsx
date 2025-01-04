import { Card } from 'antd-next'
import SQLText from 'components/shared/SQLText'

interface Props {
  query: string
}

function SQLTabContent({ query }: Props) {
  return (
    <Card style={{ background: 'white', padding: '8px' }}>
      <SQLText value={query} fontSize={12} defaultHeight={462} />
    </Card>
  )
}

export default SQLTabContent
