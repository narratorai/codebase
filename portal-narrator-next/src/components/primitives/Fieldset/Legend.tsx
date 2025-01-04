import { Legend as HeadlessLegend, LegendProps as HeadlessLegendProps } from '@headlessui/react'

type Props = Omit<HeadlessLegendProps, 'as' | 'className'>

const Legend = (props: Props) => (
  <HeadlessLegend
    className="text-base/6 font-semibold text-zinc-950 data-[disabled]:opacity-50 sm:text-sm/6 dark:text-white"
    data-slot="legend"
    {...props}
  />
)

export default Legend
