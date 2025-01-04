import { List, Typography } from 'antd-next'
import { ITransformation } from 'portal/stores/settings'
import styled from 'styled-components'

const StyledListItem = styled(List.Item)`
  padding: 4px 0 !important;
  border: none !important;
`

interface Props {
  transformations: ITransformation[]
}

const TutorialModalTransformations = ({ transformations }: Props) => (
  <List
    itemLayout="vertical"
    size="small"
    dataSource={transformations}
    renderItem={({ name, kind }) => (
      <StyledListItem key={`${name}:${kind}`}>
        <Typography.Text strong>{name}</Typography.Text>: <Typography.Text italic>{kind}</Typography.Text>
      </StyledListItem>
    )}
  />
)

export default TutorialModalTransformations
