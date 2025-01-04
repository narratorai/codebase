import { QuestionCircleOutlined } from '@ant-design/icons'
import { Popover, Spin, Tooltip } from 'antd-next'
import { useCompileContent } from 'components/Narratives/hooks'
import ActionableIcon from 'components/Narratives/shared/ActionableIcon'
import { Box, Typography } from 'components/shared/jawns'
import { toString } from 'lodash'
import React, { lazy, Suspense } from 'react'
import { Field, useField } from 'react-final-form'
import styled from 'styled-components'
import { colors } from 'util/constants'

import { useBuildNarrativeContext } from './BuildNarrativeProvider'

const MarkdownField = lazy(
  () => import(/* webpackChunkName: "markdown-field" */ 'components/shared/jawns/forms/MarkdownField')
)

const StyledIcon = styled.div`
  &:hover {
    cursor: pointer;
  }
`

const StyledQuestionIcon = styled(QuestionCircleOutlined)`
  &:hover {
    color: ${colors.blue500};
  }
`

interface Props {
  fieldName: string
}

const ActionablePopover = ({ fieldName }: Props) => {
  const { autocomplete } = useBuildNarrativeContext()

  const {
    input: { value: isActionable },
  } = useField<string>(fieldName, { subscription: { value: true } })

  const { loading: loadingIsActionable, response: compiledIsActionable } = useCompileContent({
    contents: [
      {
        text: isActionable,
      },
    ],
  })
  const compiledIsActionableValue = compiledIsActionable?.[0]?.text

  return (
    <Popover
      trigger="click"
      getPopupContainer={(trigger: HTMLElement) => trigger.parentNode as HTMLElement}
      placement="right"
      content={
        <Field
          name={fieldName}
          render={({ input, meta }) => (
            <Box style={{ width: '400px' }}>
              <Typography mb={1}>
                If the condition evaluates to true, this narrative will be shown as "actionable" in the narrative index.
              </Typography>
              <Typography mb={1}>
                Compiled field below is: <strong>{toString(compiledIsActionableValue).toUpperCase()}</strong>
              </Typography>
              <Box data-test="content-visible-condition">
                <Suspense fallback={null}>
                  <MarkdownField
                    {...input}
                    meta={meta}
                    options={{
                      autocomplete,
                    }}
                  />
                </Suspense>
              </Box>
              {compiledIsActionableValue === true && (
                <Typography mt={1}>
                  This narrative <span style={{ color: colors.blue500 }}>is</span> actionable.
                </Typography>
              )}
              {compiledIsActionableValue === false && (
                <Typography mt={1}>
                  This narrative <span style={{ color: colors.red500 }}>is not</span> actionable yet.
                </Typography>
              )}
            </Box>
          )}
        />
      }
    >
      <Tooltip title="Define whether this narrative is actionable or not. This can be seen and filtered from the narrative index page.">
        <Spin spinning={loadingIsActionable}>
          <StyledIcon>
            {compiledIsActionableValue === '' ? (
              <StyledQuestionIcon />
            ) : (
              <ActionableIcon isActionable={compiledIsActionableValue} />
            )}
          </StyledIcon>
        </Spin>
      </Tooltip>
    </Popover>
  )
}

export default ActionablePopover
