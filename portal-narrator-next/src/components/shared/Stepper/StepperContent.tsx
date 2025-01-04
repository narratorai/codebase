import { useMeasure } from 'react-use'

interface Props {
  steps: number
  activeStep: number
  children: React.ReactNode
}

const StepperContent = ({ steps, activeStep, children }: Props) => {
  const [content, { width: sliderContainerWidth }] = useMeasure<HTMLDivElement>()

  const sliderWidth = sliderContainerWidth * steps
  const sliderPosition = sliderContainerWidth * activeStep * -1

  return (
    <div className="flex w-full" ref={content}>
      <div className="w-0 overflow-hidden" style={{ width: `${sliderContainerWidth}px` }}>
        <div
          className="ease-in-out relative flex w-full items-start justify-between gap-0 overflow-visible transition-transform duration-250"
          style={{ transform: `translateX(${sliderPosition}px)`, width: `${sliderWidth}px` }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export default StepperContent
