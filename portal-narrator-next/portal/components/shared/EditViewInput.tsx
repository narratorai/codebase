import { Tooltip } from 'antd-next'
import { Typography } from 'components/shared/jawns'
import { useFormContext } from 'react-hook-form'
import styled from 'styled-components'
import useToggle from 'util/useToggle'

import EditInput, { InputProps } from './EditInput'

const StyledView = styled(Typography)`
  &:hover {
    cursor: pointer;
  }
`

interface Props extends InputProps {
  viewProps?: { [key: string]: string }
  viewTooltip?: string
}

const EditViewInput = ({ viewProps, inputProps, fieldName, viewTooltip = 'Click to Edit' }: Props) => {
  const { watch } = useFormContext()
  const [editInput, toggleEditInput] = useToggle(false)

  const value = watch(fieldName)

  if (editInput) return <EditInput toggleEditInput={toggleEditInput} inputProps={inputProps} fieldName={fieldName} />
  return (
    <Tooltip title={viewTooltip}>
      <StyledView onClick={toggleEditInput} type="title400" {...viewProps}>
        {value}
      </StyledView>
    </Tooltip>
  )
}

export default EditViewInput
