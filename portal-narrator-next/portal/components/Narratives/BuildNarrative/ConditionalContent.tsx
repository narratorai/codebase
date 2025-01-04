import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons'
import { AbstractTooltipProps } from 'antd/lib/tooltip'
import { Popover } from 'antd-next'
import { useCompileContent } from 'components/Narratives/hooks'
import { Box, Typography } from 'components/shared/jawns'
import { head, isEmpty, toString } from 'lodash'
import React, { lazy, Suspense } from 'react'
import { Field, useField } from 'react-final-form'
import { colors } from 'util/constants'
import { assembledSectionContentIsVisible } from 'util/narratives'

import { useBuildNarrativeContext } from './BuildNarrativeProvider'

const MarkdownField = lazy(
  () => import(/* webpackChunkName: "markdown-field" */ 'components/shared/jawns/forms/MarkdownField')
)

interface Props {
  fieldName: string
  // currently we only use this for takeaway, but could be for section or content later
  contentType: 'section' | 'content' | 'takeaway'
  placement?: AbstractTooltipProps['placement']
  withoutPopContainer?: boolean
}

const ConditionalContent = ({ fieldName, contentType, placement = 'right', withoutPopContainer }: Props) => {
  const { autocomplete } = useBuildNarrativeContext()

  // What is typed into the condition (eventually will be compiled to true vs false)
  const {
    input: { value: conditionedOnValue },
  } = useField<string>(`${fieldName}.conditioned_on`, { subscription: { value: true } })

  // Evaluate the field's truthiness
  const { response: compiledResponse } = useCompileContent({
    contents: [
      {
        condition: conditionedOnValue,
      },
    ],
  })

  const compiledConditionResponse = head(compiledResponse)?.condition

  // Cleaner - handle undefined/no condition/'False'... for true truthiness
  const visibleInAssembled = assembledSectionContentIsVisible({
    input: conditionedOnValue,
    compiled: compiledConditionResponse,
  })

  const hasInput = !isEmpty(conditionedOnValue)

  return (
    <Popover
      trigger="click"
      getPopupContainer={withoutPopContainer ? undefined : (trigger: HTMLElement) => trigger.parentNode as HTMLElement}
      placement={placement}
      content={
        <Field
          name={`${fieldName}.conditioned_on`}
          render={({ input, meta }) => (
            <Box style={{ width: '400px' }}>
              <Typography mb={1}>
                If the condition evaluates to false, this content will not be shown in the assembled narrative.
              </Typography>
              <Typography mb={1}>
                Compiled field below is: <strong>{toString(compiledConditionResponse).toUpperCase()}</strong>
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
              <Typography mt={1}>
                This {contentType}{' '}
                {visibleInAssembled ? (
                  <span style={{ color: colors.blue500 }}>will</span>
                ) : (
                  <span style={{ color: colors.red500 }}>will not</span>
                )}{' '}
                be visible in assembled version
                {contentType === 'content' && visibleInAssembled ? ' unless parent section is hidden.' : '.'}
              </Typography>
            </Box>
          )}
        />
      }
    >
      {visibleInAssembled ? (
        <EyeOutlined style={{ color: hasInput ? colors.blue500 : 'inherit' }} />
      ) : (
        <EyeInvisibleOutlined style={{ color: colors.red500, opacity: '0.5' }} />
      )}
    </Popover>
  )
}

export default ConditionalContent
