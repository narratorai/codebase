import MarkdownRenderer from 'components/shared/MarkdownRenderer'
import { MarkdownContent } from 'util/blocks/interfaces'

import OverflowModalContainer from './OverflowModalContainer'

interface Props {
  content: MarkdownContent & { id: string }
}

function MarkdownItem({ content }: Props) {
  const source = content.value || content.text

  return (
    <OverflowModalContainer contentId={content.id} type="markdown">
      <MarkdownRenderer source={source} />
    </OverflowModalContainer>
  )
}

export default MarkdownItem
