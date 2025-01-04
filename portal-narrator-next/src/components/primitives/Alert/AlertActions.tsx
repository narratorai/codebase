type Props = React.ComponentPropsWithoutRef<'div'>

const AlertActions = (props: Props) => (
  <div
    {...props}
    className="mt-6 flex flex-col-reverse items-center justify-end gap-3 *:w-full sm:mt-4 sm:flex-row sm:*:w-auto"
  />
)

export default AlertActions
