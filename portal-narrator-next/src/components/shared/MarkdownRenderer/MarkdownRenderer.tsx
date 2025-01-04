import { Remark } from 'react-remark'

import remarkConfig from './remarkConfig'

interface Props {
  source: string
}

const MarkdownRenderer = ({ source }: Props) => {
  return <Remark {...remarkConfig}>{source}</Remark>
}

export default MarkdownRenderer
