import { FieldProps } from '@rjsf/core'
import { Steps } from 'antd-next'
import { Button, Space } from 'antd-next'
import { Box, Flex } from 'components/shared/jawns'
import { cloneDeep, get, omit } from 'lodash'
import React from 'react'
import { triggerSchemaAndDataUpdates } from 'util/blocks/helpers'

const { Step } = Steps

type Status = 'wait' | 'process' | 'finish' | 'error'

type Step = {
  title: string
  sub_title: string
  description: string
  status?: Status
  disabled?: boolean
}

interface StepFieldProps extends FieldProps {
  formData: {
    bg: string
    field_slug: string
    current: number
    steps: Step[]
    type?: 'default' | 'navigation'
    status?: Status
    size?: 'default' | 'small'
    direction: 'horizontal' | 'vertical'
    percent: number
    clickable?: boolean
    show_buttons?: boolean
    button_labels?: { next: string; previous: string }
  }
}

const StepField: React.FC<StepFieldProps> = ({ formData, formContext, onChange, uiSchema }) => {
  const { current, clickable, field_slug, steps, show_buttons } = formData
  const stepProps = omit(formData, ['current', 'clickable', 'field_slug', 'steps', 'show_buttons'])

  const prevDisabled = steps && current ? current === 0 || steps[current - 1].disabled : false
  const nextDisabled = steps && current ? current === steps.length - 1 || steps[current + 1].disabled : false

  const prevLabel = get(formData, 'button_labels.previous', 'Previous')
  const nextLabel = get(formData, 'button_labels.next', 'Next')

  const boxProps = get(uiSchema, 'ui:options.step_box_props', {})

  const buttonFlexProps = get(uiSchema, 'ui:options.step_button_flex_props', {})

  const options = get(uiSchema, 'ui:options', {})

  const handlePreviousClick = () => {
    const newStep = current > 0 ? current - 1 : current
    requestNewStep(newStep)
  }

  const handleNextClick = () => {
    const newStep = current < steps.length - 1 ? current + 1 : current
    requestNewStep(newStep)
  }

  const requestNewStep = (newStep: number) => {
    if (newStep !== current) {
      triggerSchemaAndDataUpdates(formContext, options, field_slug)

      const newData = cloneDeep(formData)
      newData.current = newStep
      onChange(newData)
    }
  }

  // Handle change is the only way we're notified of clicks to the actual steps
  const handleChange = clickable
    ? (stepIndex: number) => {
        requestNewStep(stepIndex)
      }
    : undefined

  if (steps) {
    return (
      <Box width="100%" {...boxProps}>
        <Steps {...stepProps} current={current} onChange={handleChange}>
          {steps.map((step: Step, index) => (
            <Step {...step} subTitle={step.sub_title} key={index} />
          ))}
        </Steps>
        {show_buttons && (
          <Flex mt={4} justifyContent={buttonFlexProps.justify_content}>
            <Space>
              <Button onClick={handlePreviousClick} disabled={prevDisabled}>
                {prevLabel}
              </Button>
              <Button onClick={handleNextClick} disabled={nextDisabled}>
                {nextLabel}
              </Button>
            </Space>
          </Flex>
        )}
      </Box>
    )
  }

  return null
}

export default StepField
