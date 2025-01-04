import { useState } from 'react'

import StepperContent from './StepperContent'
import StepperNavigation from './StepperNavigation'

interface Props {
  steps: number
  children: React.ReactNode
}

const Stepper = ({ steps, children }: Props) => {
  const [activeStep, setActiveStep] = useState(0)

  return (
    <div className="flex w-full flex-col gap-4">
      <StepperContent steps={steps} activeStep={activeStep}>
        {children}
      </StepperContent>
      <StepperNavigation steps={steps} activeStep={activeStep} onChange={setActiveStep} />
    </div>
  )
}

export default Stepper
