import InfoModal from 'components/shared/DynamicForm/InfoModal'
import { Box, Flex } from 'components/shared/jawns'
import { TabConfig } from 'util/blocks/interfaces'

interface Props {
  tab: Partial<TabConfig>
}

const TabWithInfo = ({ tab }: Props) => {
  const { label } = tab
  const infoModalMarkdown = tab['ui:info_modal']

  if (!infoModalMarkdown) {
    return <span>{label}</span>
  }

  return (
    <Flex alignItems="baseline">
      {label}
      <Box ml={1}>
        <InfoModal markdown={infoModalMarkdown} />
      </Box>
    </Flex>
  )
}

export default TabWithInfo
