import { BlockOutlined, CaretRightOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { Popconfirm, Radio, Tooltip } from 'antd-next'
import { useBuildNarrativeContext } from 'components/Narratives/BuildNarrative/BuildNarrativeProvider'
import BuildDashboardContext from 'components/Narratives/Dashboards/BuildDashboard/BuildDashboardContext'
import {
  ALLOW_OVERFLOW_EDIT_CONTENT_TYPES,
  DASHBOARD_BACKGROUND_COLOR,
  INNER_CONTENT_BORDER_RADIUS,
  INNER_CONTENT_HORIZONTAL_PADDING,
  INNER_CONTENT_VETICAL_PADDING,
} from 'components/Narratives/Dashboards/BuildDashboard/constants'
import { IContent } from 'components/Narratives/interfaces'
import { Box, Flex } from 'components/shared/jawns'
import { findIndex, includes, isEqual, isFunction, noop } from 'lodash'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { useField } from 'react-final-form'
import { useFieldArray } from 'react-final-form-arrays'
import styled, { css } from 'styled-components'
import { colors } from 'util/constants'
import { makeShortid } from 'util/shortid'

import NonDraggableContainer from './NonDraggableContainer'

interface Props {
  content: IContent
  handleCompileContent?: () => void
  children: React.ReactNode
}

// add small wrapper to match the background color of parent
// (otherwise border-radius causes white to bleed outside border)
const BackgroundColorWrapper = styled.div`
  height: 100%;
  background-color: ${DASHBOARD_BACKGROUND_COLOR};
`

const InnerContentContainer = styled(Box)<{ allowOverflow?: boolean; showNewContentAnimation?: boolean }>`
  height: 100%;
  width: 100%;
  position: relative;
  padding: ${INNER_CONTENT_VETICAL_PADDING}px ${INNER_CONTENT_HORIZONTAL_PADDING}px;
  border: 1px dashed ${colors.gray300};
  border-radius: ${INNER_CONTENT_BORDER_RADIUS}px;
  background-color: white;
  transition: transform 50ms ease-in;
  overflow: ${({ allowOverflow }) => (allowOverflow ? 'auto' : 'hidden')};

  ${({ showNewContentAnimation }) =>
    showNewContentAnimation &&
    css`
      animation-name: pasted-or-new-content;
      animation-duration: 2s;
      animation-iteration-count: 1;
      animation-direction: alternate-reverse;
      animation-timing-function: ease;
    `}

  .actions-container {
    z-index: 1;
    opacity: 0;
    transition: opacity 200ms ease-in;
    position: fixed;
    top: 4px;
    left: 50%;
    transform: translateX(-50%);
  }

  &:hover {
    border: 1px dashed ${colors.blue500};
    cursor: move;
    transform: scale(1.01);

    .actions-container {
      opacity: 1;
    }
  }

  @keyframes pasted-or-new-content {
    to {
      background-color: ${colors.green400};
    }

    from {
      background-color: white;
    }
  }
`

const InnerContent = ({ children, content, handleCompileContent }: Props) => {
  const { handleToggleDashboardContentOpen, setContentPasted, contentPasted, onContentPasted } =
    useBuildNarrativeContext()

  const { selectedSectionIndex, newContentItemId } = useContext(BuildDashboardContext)

  const isNewContent = content.id === newContentItemId

  const [wasPastedContent, setWasPastedContent] = useState(false)

  const sectionFieldname = `narrative.sections[${selectedSectionIndex}]`
  const contentFieldname = `${sectionFieldname}.content`

  const {
    input: { value: contentValues },
  } = useField(contentFieldname, { subscription: { value: true } })

  const { fields } = useFieldArray(contentFieldname, {
    subscription: {
      length: true,
    },
  })

  // check if this content was pasted
  // (we add animations for pasted content)
  useEffect(() => {
    if (contentPasted && content && isEqual(contentPasted.id, content.id)) {
      setWasPastedContent(true)

      // reset content pasted to allow for new paste events
      onContentPasted()
    }
  }, [contentPasted, onContentPasted, content])

  const handleEditContent = useCallback(() => {
    handleToggleDashboardContentOpen(content)
  }, [handleToggleDashboardContentOpen, content])

  const handleDuplicateContent = useCallback(() => {
    const uniqueContent = {
      ...content,
      id: makeShortid(),
    }

    // add duplicate content to form
    fields.push(uniqueContent)

    // add duplicated content to pasted content (for animation)
    setContentPasted(uniqueContent)
  }, [fields, content, setContentPasted])

  const handleDeleteContent = useCallback(() => {
    const contentIndex = findIndex(contentValues, ['id', content.id])

    if (contentIndex !== -1) {
      fields.remove(contentIndex)
    }
  }, [content.id, contentValues, fields])

  const allowOverflow = includes(ALLOW_OVERFLOW_EDIT_CONTENT_TYPES, content.type)

  const showNewContentAnimation = wasPastedContent || isNewContent

  return (
    <BackgroundColorWrapper>
      <InnerContentContainer allowOverflow={allowOverflow} showNewContentAnimation={showNewContentAnimation}>
        {/* high-jacking Radio.Group since Button.Group has been deprecated
              give Radio.Group a fake value so all the buttons aren't blue
              (let the buttons handle up/down/delete events)
          */}
        <Flex justifyContent="flex-end" className="actions-container">
          <Radio.Group value="not-a-real-value" size="small" buttonStyle="solid">
            {isFunction(handleCompileContent) && (
              <Radio.Button onClick={handleCompileContent}>
                <Tooltip title="Recompile Content">
                  <CaretRightOutlined style={{ color: colors.green500 }} />
                </Tooltip>
              </Radio.Button>
            )}

            <Radio.Button onClick={handleEditContent}>
              <Tooltip title="Edit Content">
                <EditOutlined />
              </Tooltip>
            </Radio.Button>

            <Radio.Button onClick={handleDuplicateContent}>
              <Tooltip title="Duplicate Content">
                <BlockOutlined />
              </Tooltip>
            </Radio.Button>

            <Popconfirm
              title="Are you sure you want to delete this content?"
              onConfirm={handleDeleteContent}
              okText="Delete"
            >
              <Radio.Button onClick={noop}>
                <Tooltip title="Delete Content">
                  <DeleteOutlined style={{ color: colors.red500 }} />
                </Tooltip>
              </Radio.Button>
            </Popconfirm>
          </Radio.Group>
        </Flex>

        <NonDraggableContainer>{children}</NonDraggableContainer>
      </InnerContentContainer>
    </BackgroundColorWrapper>
  )
}

export default InnerContent
