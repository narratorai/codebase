import clsx from 'clsx'

type Props = React.ComponentPropsWithoutRef<'div'>

const CheckboxGroup = (props: Props) => (
  <div
    className={clsx(
      // Basic groups
      'space-y-3',
      // With descriptions
      'has-[[data-slot=description]]:space-y-6 [&_[data-slot=label]]:has-[[data-slot=description]]:font-medium'
    )}
    data-slot="control"
    {...props}
  />
)

export default CheckboxGroup
