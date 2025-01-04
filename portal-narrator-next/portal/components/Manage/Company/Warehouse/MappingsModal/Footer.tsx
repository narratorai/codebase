import { Button, Flex } from 'antd-next'

interface FooterProps {
  disabled?: boolean
  onRunClick: () => void
  onCancelClick: () => void
}

const Footer = ({ onRunClick, onCancelClick, disabled }: FooterProps) => (
  <Flex gap={8} justify="space-around" align="center">
    <Button onClick={onCancelClick} block>
      Cancel
    </Button>
    <Button type="primary" onClick={onRunClick} block disabled={disabled}>
      Run
    </Button>
  </Flex>
)

export default Footer
