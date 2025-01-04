import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import type { InputRef } from 'antd/lib/input'
import { App, Button, Input, Spin, Tooltip } from 'antd-next'
import { useUpdateNarrativeMeta } from 'components/Narratives/hooks'
import { Box, Typography } from 'components/shared/jawns'
import { INarrative, INarrative_Types_Enum } from 'graph/generated'
import { isEmpty, isEqual } from 'lodash'
import React, { ChangeEvent, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { colors } from 'util/constants'
import { handleMavisErrorNotification } from 'util/useCallMavis'
import usePrevious from 'util/usePrevious'

const StyledName = styled(Typography)`
  max-width: 45vw;

  &:hover {
    cursor: pointer;
  }
`

interface Props {
  narrative: Partial<INarrative>
  refetchNarrative: () => void
}

const RenameNarrativeInput = ({ narrative, refetchNarrative }: Props) => {
  const { notification } = App.useApp()
  const inputRef = useRef<InputRef>(null)

  const [showInput, setShowInput] = useState(false)
  const [narrativeNameInputValue, setNarrativeNameInputValue] = useState<string | undefined>(narrative?.name)
  const disableSave = isEmpty(narrativeNameInputValue)

  const onChangeNarrativeName = (event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault()

    setNarrativeNameInputValue(event?.target?.value)
  }

  const [
    updateNarrative,
    { loading: updateNarrativeLoading, error: updateNarrativeError, saved: updateNarrativeSaved },
  ] = useUpdateNarrativeMeta()
  const prevNarrativeSaved = usePrevious(updateNarrativeSaved)

  const toggleShowInput = () => setShowInput((prevShowInput) => !prevShowInput)

  useEffect(() => {
    // focus the input when toggling to show it
    if (showInput && inputRef?.current) {
      inputRef?.current.focus()
    }
  }, [showInput])

  const closeAndResetInput = () => {
    setNarrativeNameInputValue(narrative?.name)
    toggleShowInput()
  }

  const handleEscape = (event: any) => {
    if (event.code === 'Escape') {
      closeAndResetInput()
    }
  }

  const handleSaveNarrativeName = (event: any) => {
    if (event) {
      // prevent default on enter so as not to submit the
      // BuildNarrative form (sections/content/takeaways....)
      event?.preventDefault()
    }

    if (narrative && !isEmpty(narrativeNameInputValue) && !disableSave) {
      updateNarrative({
        narrative_id: narrative.id,
        name: narrativeNameInputValue as string,
        isEdit: true,
        slug: narrative.slug as string,
        state: narrative.state as string,
        description: narrative.description || undefined,
        category: narrative.company_category?.category,
        schedule: narrative.company_task?.schedule,
        requested_by: narrative.requested_by,
        type: narrative.type as INarrative_Types_Enum,
        created_by: narrative.created_by,
      })
    }
  }

  // handle successful rename
  useEffect(() => {
    if (updateNarrativeSaved && !isEqual(prevNarrativeSaved, updateNarrativeSaved) && !updateNarrativeError) {
      // refetch narrative
      refetchNarrative()

      // toggle off input (back to name)
      toggleShowInput()
    }
  }, [updateNarrativeSaved, refetchNarrative, toggleShowInput, prevNarrativeSaved, updateNarrativeError])

  // handle failed rename
  useEffect(() => {
    // show error notification
    if (updateNarrativeError) {
      handleMavisErrorNotification({ error: updateNarrativeError, notification })
    }
  }, [updateNarrativeError, notification])

  if (showInput) {
    return (
      <Box>
        <Spin spinning={updateNarrativeLoading}>
          <Input.Group compact>
            <Input
              ref={inputRef}
              value={narrativeNameInputValue}
              onChange={onChangeNarrativeName}
              onPressEnter={handleSaveNarrativeName}
              onKeyDown={handleEscape}
              placeholder="Enter Narrative Name"
              style={{ width: '440px' }}
            />
            <Button
              disabled={disableSave}
              onClick={handleSaveNarrativeName}
              icon={<CheckOutlined style={{ color: colors.green500 }} color={colors.green500} />}
            />
            <Button
              onClick={closeAndResetInput}
              icon={<CloseOutlined style={{ color: colors.red500 }} color={colors.red500} />}
            />
          </Input.Group>
        </Spin>
      </Box>
    )
  }

  return (
    <Box onClick={toggleShowInput}>
      <Tooltip title="Click to Edit Name">
        <StyledName type="title400" truncate title={narrative?.name} mr={1}>
          {narrative?.name}
        </StyledName>
      </Tooltip>
    </Box>
  )
}

export default RenameNarrativeInput
