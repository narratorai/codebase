import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { Button, Input } from 'antd-next'
import { Box, Flex } from 'components/shared/jawns'
import { ChangeEvent, useCallback, useMemo, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { colors } from 'util/constants'

export interface InputProps {
  fieldName: string
  inputProps?: { [key: string]: string }
}

interface Props extends InputProps {
  toggleEditInput: () => void
  maxInputLength?: number
}

const EditInput = ({ toggleEditInput, inputProps, fieldName, maxInputLength = 56 }: Props) => {
  const { control, setValue, watch } = useFormContext()
  const value = watch(fieldName)

  const [tempValue, setTempValue] = useState<string>(value)

  const handleOnAccept = useCallback(() => {
    // Set dirty state since we are programatically calling setValue (on enter or check button click)
    // (Controller's ref would not pick up on this change)
    setValue(fieldName, tempValue, { shouldValidate: true, shouldDirty: true })
    toggleEditInput()
  }, [setValue, fieldName, tempValue, toggleEditInput])

  const handleOnChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const value = event?.target?.value || ''
    setTempValue(value)
  }, [])

  const handleEscape = useCallback(
    (event: any) => {
      if (event.code === 'Escape') {
        event.stopPropagation()

        toggleEditInput()
      }
    },
    [toggleEditInput]
  )

  const inputSize = useMemo(() => {
    if (!tempValue?.length || tempValue?.length < 30) {
      return 30
    }

    if (tempValue?.length > maxInputLength) {
      return maxInputLength
    }

    return tempValue?.length
  }, [tempValue, maxInputLength])

  return (
    <Flex style={{ width: '100%' }}>
      <Input.Group compact>
        <Box>
          <Controller
            name={fieldName}
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                autoFocus
                value={tempValue}
                onChange={handleOnChange}
                onPressEnter={handleOnAccept}
                onKeyDown={handleEscape}
                htmlSize={inputSize}
                {...inputProps}
              />
            )}
          />
        </Box>

        <Button
          onClick={handleOnAccept}
          icon={<CheckOutlined style={{ color: colors.green500 }} color={colors.green500} />}
        />
        <Button
          onClick={toggleEditInput}
          icon={<CloseOutlined style={{ color: colors.red500 }} color={colors.red500} />}
        />
      </Input.Group>
    </Flex>
  )
}

export default EditInput
