import type { InputRef } from 'antd/lib/input'
import { Input } from 'antd-next'
import { Icon } from 'components/shared/jawns'
import React, { useEffect, useRef, useState } from 'react'
import Close from 'static/svg/X.svg'
import styled from 'styled-components'

import ColumnLabel from './ColumnLabel'

const CloseWrapper = styled.div`
  cursor: pointer;
  position: absolute;
  right: 3px;
  top: 7px;
`

interface Props {
  renaming: boolean
  toggleRenaming(): void
  value?: string
  onChange(value: string): void
  truncateLimit?: number
  onBlur?: Function
  withCloseIcon?: boolean
}

const EditLabelField = ({
  renaming,
  toggleRenaming,
  value: columnLabel,
  onChange,
  truncateLimit,
  onBlur,
  withCloseIcon = true,
}: Props) => {
  const [stagedValue, setStagedValue] = useState<any>()
  const inputRef = useRef<InputRef>(null)

  // make sure EditLabelField is focused when renaming
  useEffect(() => {
    if (inputRef?.current && renaming) {
      inputRef.current?.focus()
    }
  }, [inputRef, renaming])

  useEffect(() => {
    if (columnLabel) {
      setStagedValue(columnLabel)
    }
  }, [renaming, columnLabel])

  const handleStagedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target
    setStagedValue(value)
  }

  // Only set the <Field>'s value when the user hits enter!
  // TODO: figure out why React.KeyboardEventHandler<HTMLInputElement> doesn't work
  const handlePressEnter = (event: any) => {
    if (event.key === 'Enter') {
      const { value } = event.target

      if (value) {
        onChange(value)
      }

      toggleRenaming()
    }
  }

  const handleOnBlur = () => {
    if (onBlur) {
      onBlur(stagedValue)
    }
  }

  if (renaming) {
    return (
      <div style={{ position: 'relative', paddingRight: '16px' }} data-test="edit-label-field-renaming">
        <Input
          ref={inputRef}
          size="small"
          onChange={handleStagedChange}
          value={stagedValue}
          onPressEnter={handlePressEnter}
          onBlur={handleOnBlur}
        />
        {withCloseIcon && (
          <CloseWrapper onClick={toggleRenaming}>
            <Icon svg={Close} color="gray500" width={8} height={8} />
          </CloseWrapper>
        )}
      </div>
    )
  }

  if (columnLabel) {
    return <ColumnLabel columnLabel={columnLabel} truncateLimit={truncateLimit} />
  }

  // THIS SHOULD NEVER HAPPEN:
  return null
}

export default EditLabelField
