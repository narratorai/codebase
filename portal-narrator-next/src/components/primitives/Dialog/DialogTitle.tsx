import { DialogTitle as HeadlessDialogTitle, DialogTitleProps as HeadlessDialogTitleProps } from '@headlessui/react'

type Props = Omit<HeadlessDialogTitleProps, 'as' | 'className'>

const DialogTitle = (props: Props) => (
  <HeadlessDialogTitle
    {...props}
    className="text-balance text-lg/6 font-semibold text-zinc-950 sm:text-base/6 dark:text-white"
  />
)

export default DialogTitle
