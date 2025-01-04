import { Steps } from 'antd-next'
import { StepsProps } from 'antd-next/es/steps'
import TemplateContext from 'components/Narratives/Templates/TemplateContext'
import type narrativeFromTemplateMachine from 'machines/narrativeTemplates/narrativeFromTemplateMachine'
import { useContext } from 'react'
import type { StateFrom } from 'xstate'

// Step key for antd <Step> component from machine context
const getStepIndexFromContext = (machineCurrent: StateFrom<typeof narrativeFromTemplateMachine>): number => {
  if (machineCurrent.matches({ main: 'activity_mapping' })) {
    return 0
  }
  if (machineCurrent.matches({ main: 'dataset_feature_mapping' })) {
    return 1
  }
  if (machineCurrent.matches({ main: 'word_mappings' })) {
    return 2
  }
  return 0
}

const getStateFromStepIndex = (current: number): string => {
  if (current === 0) {
    return 'activity_mapping'
  }
  if (current === 1) {
    return 'dataset_feature_mapping'
  }
  if (current === 2) {
    return 'word_mappings'
  }
  return 'activity_mapping'
}

const TemplateSteps = (props: StepsProps) => {
  const { machineCurrent, machineSend } = useContext(TemplateContext)
  const stepIndex = getStepIndexFromContext(machineCurrent)
  const completedSteps = machineCurrent.context._completed_steps

  const onChange = (current: number) => {
    const state = getStateFromStepIndex(current)
    machineSend('NAVIGATE_STEP', { state })
  }

  return (
    <Steps current={stepIndex} onChange={onChange} {...props}>
      <Steps.Step title="Choose your activities" />
      <Steps.Step title="Choose your features" disabled={!completedSteps?.includes('activity_mapping')} />
      <Steps.Step title="Customize language" disabled={!completedSteps?.includes('dataset_feature_mapping')} />
    </Steps>
  )
}

export default TemplateSteps
