import { Button } from 'antd-next'

import { Example } from './interfaces'

interface Props {
  example: Example
  onSelect: (example: Example) => void
}

const ExampleCard = ({ example, onSelect }: Props) => {
  const handleClick = () => {
    onSelect(example)
  }

  return <Button onClick={handleClick}>{example.customer}</Button>
}

export default ExampleCard
