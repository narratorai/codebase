import { Tag } from '@/components/shared/Tag'

import { IToken } from './interfaces'
import Token from './Token'

interface Props {
  tokens: IToken[]
}

const Line = ({ tokens }: Props) => (
  <Tag size="lg" color="gray">
    {tokens.map((token, index) => (
      <Token key={index} format={token.format}>
        {token.value}
      </Token>
    ))}
  </Tag>
)

export default Line
