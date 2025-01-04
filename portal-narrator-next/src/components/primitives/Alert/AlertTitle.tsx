import { DialogTitle as HeadlessDialogTitle, DialogTitleProps as HeadlessDialogTitleProps } from '@headlessui/react'

type Props = Omit<HeadlessDialogTitleProps, 'as' | 'className'>

const AlertTitle = (props: Props) => (
  <HeadlessDialogTitle
    {...props}
    className="text-balance text-center text-base/6 font-semibold text-zinc-950 sm:text-wrap sm:text-left sm:text-sm/6 dark:text-white"
  />
)

export default AlertTitle
