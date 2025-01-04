import { Row } from '@/components/primitives/Axis'
import { Frame } from '@/components/primitives/Frame'
import { Heading } from '@/components/primitives/Heading'
import { IRemotePlotConfigTitle } from '@/stores/datasets'

type Props = Partial<IRemotePlotConfigTitle>

const SimplePlotTitle = ({ visible, text }: Props) =>
  visible &&
  text && (
    <Frame x="3xl">
      <Row full items="center">
        <Heading level={4}>{text}</Heading>
      </Row>
    </Frame>
  )

export default SimplePlotTitle
