import { Collapse } from 'antd-next'
import TemplateContext from 'components/Narratives/Templates/TemplateContext'
import MarkdownRenderer from 'components/shared/MarkdownRenderer'
import { useContext } from 'react'

const AdditionalContext = () => {
  const { machineCurrent } = useContext(TemplateContext)
  const additionalContext = machineCurrent.context?.additional_context

  if (!additionalContext) {
    return null
  }

  return (
    <Collapse>
      <Collapse.Panel header="Additional Context" key="additional_context">
        <MarkdownRenderer source={machineCurrent.context.additional_context} />
      </Collapse.Panel>
    </Collapse>
  )
}

export default AdditionalContext
