import { PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd-next'
import { Box, Flex } from 'components/shared/jawns'
import styled from 'styled-components'

const DashedLine = styled.div`
  height: 8px;
  border-bottom: 1px dashed ${(props) => props.theme.colors.gray400};
  opacity: 0.5;

  &:hover {
    opacity: 1;
  }
`

const FlexParent = styled(Flex)`
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
`

export interface AddButtonProps {
  disabled?: boolean
  onClick?: (event?: any) => void
  className?: string
  buttonText?: string
}

const AddButton = ({ buttonText, disabled, onClick, className }: AddButtonProps) => {
  return (
    <FlexParent
      flexDirection="column"
      disabled={disabled}
      onClick={disabled ? () => {} : onClick}
      className={className}
      data-public
    >
      <DashedLine />
      <Box alignSelf="center" style={{ marginTop: '-13px' }}>
        <Button
          shape={buttonText ? 'round' : 'circle'}
          size="small"
          className="button"
          disabled={disabled}
          data-test="add-button"
        >
          <PlusOutlined />
          {buttonText ? ` ${buttonText}` : null}
        </Button>
      </Box>
    </FlexParent>
  )
}

export default AddButton
