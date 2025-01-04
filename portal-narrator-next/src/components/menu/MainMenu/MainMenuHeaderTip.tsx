import { Column } from '@/components/primitives/Axis'
import { Frame } from '@/components/primitives/Frame'
import { Strong, Text } from '@/components/primitives/Text'

interface Props {
  companyName: string
  isExpanded?: boolean
}

const MainMenuHeaderTip = ({ companyName, isExpanded = false }: Props) => (
  <Frame dark>
    {isExpanded ? (
      <Text>
        <Strong>Click to Expand/Collapse Side Menu</Strong>
      </Text>
    ) : (
      <Frame all="md">
        <Column items="center">
          <Text>
            <Strong>{companyName}</Strong>
          </Text>
          <Text>Click to Expand/Collapse Side Menu</Text>
        </Column>
      </Frame>
    )}
  </Frame>
)

export default MainMenuHeaderTip
