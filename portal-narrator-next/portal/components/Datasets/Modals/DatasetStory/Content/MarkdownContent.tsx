import { Tooltip } from 'antd-next'
import { Box } from 'components/shared/jawns'
import MarkdownRenderer from 'components/shared/MarkdownRenderer'
import { isEmpty } from 'lodash'
import React, { lazy, Suspense, useCallback } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import styled from 'styled-components'
import useToggle from 'util/useToggle'

const MarkdownField = lazy(
  () => import(/* webpackChunkName: "markdown-field" */ 'components/shared/jawns/forms/MarkdownField')
)

const ViewContainer = styled(Box)`
  &:hover {
    cursor: pointer;
  }
`

interface Props {
  index: number
}

const MarkdownContent = ({ index }: Props) => {
  const { control, watch } = useFormContext()

  const markdownValue = watch(`story.content.[${index}].markdown`)

  // default "edit" for new markdown and "view" for existing markdown
  const [isEditMode, toggleIsEditMode] = useToggle(isEmpty(markdownValue))

  const handleToggleIsEditMode = useCallback(
    (value: string) => {
      // make sure there is a value before going to view mode
      if (isEditMode && isEmpty(value)) {
        return
      }

      toggleIsEditMode()
    },
    [toggleIsEditMode, isEditMode]
  )

  return (
    <Box mt={1}>
      <Controller
        control={control}
        name={`story.content.[${index}].markdown`}
        render={({ field, fieldState: { isTouched, error } }) => (
          <Box>
            {isEditMode && (
              <Suspense fallback={null}>
                <MarkdownField
                  {...field}
                  // moving up/down was loosing value inside controller
                  // use markdownValue instead
                  value={markdownValue}
                  meta={{ touched: isTouched, error: error?.message }}
                  options={{
                    default_height: 80,
                    // keep lazy false so we can click into the view
                    // and actually be in edit mode in BasicEditorWidget
                    lazy: false,
                  }}
                  onBlur={(value: string) => {
                    handleToggleIsEditMode(value)
                  }}
                />
              </Suspense>
            )}

            {!isEditMode && (
              <Tooltip title="Click to Edit" placement="topLeft">
                <ViewContainer onClick={() => handleToggleIsEditMode(markdownValue)}>
                  <MarkdownRenderer source={markdownValue} />
                </ViewContainer>
              </Tooltip>
            )}
          </Box>
        )}
      />
    </Box>
  )
}

export default MarkdownContent
