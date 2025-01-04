import { ExportOutlined } from '@ant-design/icons'
import { Link } from 'components/shared/jawns'

interface Props {
  narrativeSlug: string
}

const AnalyzeLink = ({ narrativeSlug }: Props) => (
  <Link to={`/narratives/a/${narrativeSlug}`}>
    <ExportOutlined />
  </Link>
)

export default AnalyzeLink
