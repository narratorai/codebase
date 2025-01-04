import { useMeasure } from 'react-use'
import ChevronLeftIcon from 'static/mavis/icons/chevron-left.svg'
import ChevronRightIcon from 'static/mavis/icons/chevron-right.svg'

interface Props {
  steps: number
  activeStep: number
  onChange: (step: number) => void
}

const StepperNavigation = ({ steps, activeStep, onChange }: Props) => {
  const [stepper, { width: sliderContainerWidth }] = useMeasure<HTMLDivElement>()
  const [step, { width: stepWidth }] = useMeasure<HTMLButtonElement>()

  const length = steps

  const handleNext = () => {
    if (activeStep === steps - 1) onChange(0)
    else onChange(activeStep + 1)
  }

  const handlePrev = () => {
    if (activeStep === 0) onChange(steps - 1)
    else onChange(activeStep - 1)
  }

  // Account for the 16px gaps between steps.
  const jump = stepWidth + 16
  const stepPosition = activeStep * jump

  // Center the active step in the slider after the first page.
  const nextSliderPosition = sliderContainerWidth / 2 - stepPosition
  const sliderPosition = stepPosition < sliderContainerWidth ? 0 : nextSliderPosition

  return (
    <div className="flex w-full items-center gap-4">
      <button className="button button-xs button-icon secondary text" onClick={handlePrev}>
        <ChevronLeftIcon className="size-6" />
      </button>
      <div className="w-full" ref={stepper}>
        <div className="w-0 overflow-hidden py-0.5" style={{ width: `${sliderContainerWidth}px` }}>
          <div
            className="ease-in-out relative flex h-5 w-full items-center justify-between gap-4 transition-transform duration-250"
            style={{ transform: `translateX(${sliderPosition}px)` }}
          >
            {Array.from({ length }).map((_, index) => (
              <button key={index} className="flex h-5 w-full items-center" onClick={() => onChange(index)} ref={step}>
                <div className="h-1 w-full min-w-8 rounded-sm bg-gray-50" />
              </button>
            ))}
            <div
              className="ease-in-out absolute h-1 min-w-8 rounded-sm bg-purple-600 transition-transform duration-250"
              style={{ transform: `translateX(${stepPosition}px)`, width: `${stepWidth}px` }}
            />
          </div>
        </div>
      </div>
      <button className="button button-xs button-icon secondary text" onClick={handleNext}>
        <ChevronRightIcon className="size-6" />
      </button>
    </div>
  )
}

export default StepperNavigation
